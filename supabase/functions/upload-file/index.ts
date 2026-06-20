/**
 * EDGE FUNCTION: upload-file
 *
 * Validates file type + size BEFORE writing to Supabase Storage.
 * Client sends: multipart/form-data with fields:
 *   - file: the actual file
 *   - bucket: 'notes' | 'marketplace' | 'avatars' | 'papers'
 *   - college_id: user's college (verified server-side)
 *
 * Deploy: supabase functions deploy upload-file
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Allowed MIME types per bucket
const ALLOWED_TYPES: Record<string, string[]> = {
  notes:       ['application/pdf', 'application/msword',
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                 'application/vnd.ms-powerpoint',
                 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  marketplace: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  avatars:     ['image/jpeg', 'image/png', 'image/webp'],
  papers:      ['application/pdf'],
}

// Max sizes in bytes
const MAX_SIZE: Record<string, number> = {
  notes:       20 * 1024 * 1024,  // 20 MB
  marketplace: 5  * 1024 * 1024,  //  5 MB
  avatars:     2  * 1024 * 1024,  //  2 MB
  papers:      10 * 1024 * 1024,  // 10 MB
}

// Bucket Permissions Map
const BUCKET_PERMISSIONS: Record<string, string[]> = {
  notes:       ['student', 'faculty', 'admin', 'moderator'],
  marketplace: ['student', 'faculty', 'admin', 'moderator'],
  avatars:     ['student', 'faculty', 'admin', 'moderator'],
  papers:      ['faculty', 'admin'], // RESTRICTED
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Authenticate the caller
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } }
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string | null)?.toLowerCase() ?? 'notes'

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Server-Side Bucket Authorization ────────────────────
    
    // 1. Fetch user profile and college status
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select(`
        role,
        is_verified,
        college_id,
        colleges!inner(is_active)
      `)
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // @ts-ignore - Supabase type inference for inner join
    const isCollegeActive = profile.colleges?.is_active === true
    const userRole = profile.role ?? 'student'
    const isVerified = profile.is_verified === true

    // 2. Enforce active college requirement (except for avatars which might be set during onboarding)
    if (!isCollegeActive && bucket !== 'avatars') {
       return new Response(JSON.stringify({ error: 'Your college is currently inactive.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Enforce specific bucket requirements
    const allowedRoles = BUCKET_PERMISSIONS[bucket]
    if (!allowedRoles) {
      return new Response(JSON.stringify({ error: `Unknown bucket: ${bucket}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!allowedRoles.includes(userRole)) {
       return new Response(
        JSON.stringify({ error: `You do not have permission to upload to the "${bucket}" bucket.` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Notes and Marketplace require verification
    if ((bucket === 'notes' || bucket === 'marketplace') && !isVerified) {
        return new Response(
        JSON.stringify({ error: `You must be verified to upload to the "${bucket}" bucket.` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    // ── Validate MIME type ──────────────────────────────────
    const allowedMimes = ALLOWED_TYPES[bucket]

    // Read first 8 bytes to check magic bytes (can't trust Content-Type header alone)
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer.slice(0, 8))
    const detectedMime = detectMimeFromBytes(bytes)
    const reportedMime = file.type.toLowerCase()

    // Both detected and reported must be in allowlist
    if (!allowedMimes.includes(reportedMime) || (detectedMime && !allowedMimes.includes(detectedMime))) {
      return new Response(
        JSON.stringify({ error: `File type "${reportedMime}" is not allowed in bucket "${bucket}". Allowed: ${allowedMimes.join(', ')}` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Validate file size ──────────────────────────────────
    const maxBytes = MAX_SIZE[bucket] ?? 10 * 1024 * 1024
    if (arrayBuffer.byteLength > maxBytes) {
      return new Response(
        JSON.stringify({ error: `File exceeds maximum size of ${maxBytes / 1024 / 1024} MB` }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Rate limit: 20 uploads per hour per user ────────────
    const rateLimitOk = await adminClient.rpc('check_rate_limit', {
      p_action: `upload_${bucket}`,
      p_limit: 20,
      p_window: '1 hour',
    })
    if (!rateLimitOk.data) {
      return new Response(JSON.stringify({ error: 'Upload limit reached. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Store file ──────────────────────────────────────────
    const ext = reportedMime.split('/')[1].replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx')
    const fileName = `${user.id}/${Date.now()}.${ext}`

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: reportedMime,
        upsert: false,
      })

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Return public URL (for notes/papers) or signed URL (for marketplace)
    let url: string
    if (bucket === 'marketplace' || bucket === 'avatars') {
      const { data: signed } = await adminClient.storage.from(bucket)
        .createSignedUrl(uploadData.path, 60 * 60 * 24 * 7) // 7 days
      url = signed?.signedUrl ?? ''
    } else {
      const { data: pub } = adminClient.storage.from(bucket).getPublicUrl(uploadData.path)
      url = pub.publicUrl
    }

    return new Response(JSON.stringify({ success: true, url, path: uploadData.path }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('Upload error:', err)
    return new Response(JSON.stringify({ error: 'Upload failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

/** Detect MIME from magic bytes — blocks renamed executables */
function detectMimeFromBytes(bytes: Uint8Array): string | null {
  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf'
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  // JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg'
  // GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif'
  // WEBP (RIFF....WEBP)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp'
  // ZIP-based (docx, pptx, xlsx are ZIP)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) return 'application/zip'
  // Windows PE executable — BLOCK
  if (bytes[0] === 0x4D && bytes[1] === 0x5A) return 'application/x-msdownload' // .exe .dll
  // ELF executable — BLOCK
  if (bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) return 'application/x-elf'
  return null
}
