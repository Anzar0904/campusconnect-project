const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Parse env manually
const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const value = parts.slice(1).join('=').trim()
    envVars[key] = value
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function getFuzzyScore(text, query) {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 60
  
  let score = 0
  let qIdx = 0
  for (let i = 0; i < t.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++
      score += 5
      if (qIdx === q.length) {
        return score + 10
      }
    }
  }
  return 0
}

async function testSearch(searchQuery) {
  console.log(`Searching for: "${searchQuery}"`)
  const [
    usersRes,
    commsRes,
    clubsRes,
    notesRes,
    eventsRes,
    marketRes,
    internRes,
    studyRes,
    papersRes,
    messagesRes
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, username').ilike('full_name', `%${searchQuery}%`).limit(4),
    supabase.from('communities').select('id, name, description').ilike('name', `%${searchQuery}%`).limit(4),
    supabase.from('clubs').select('id, name, description').ilike('name', `%${searchQuery}%`).limit(4),
    supabase.from('notes').select('id, title, subject').ilike('title', `%${searchQuery}%`).limit(4),
    supabase.from('events').select('id, title, description').ilike('title', `%${searchQuery}%`).limit(4),
    supabase.from('marketplace_items').select('id, title, price').eq('status', 'available').ilike('title', `%${searchQuery}%`).limit(4),
    supabase.from('internships').select('id, title, company').ilike('title', `%${searchQuery}%`).limit(4),
    supabase.from('study_groups').select('id, subject, venue').ilike('subject', `%${searchQuery}%`).limit(4),
    supabase.from('exam_papers').select('id, subject, course_code').ilike('subject', `%${searchQuery}%`).limit(4),
    supabase.from('messages').select('id, content, sender_id, receiver_id').ilike('content', `%${searchQuery}%`).limit(4)
  ])

  const mappedResults = []

  if (usersRes.data) {
    usersRes.data.forEach(u => {
      mappedResults.push({
        id: u.id,
        title: u.full_name,
        subtitle: u.username ? `@${u.username}` : undefined,
        category: 'Users',
        href: `/profile?id=${u.id}`
      })
    })
  }

  if (commsRes.data) {
    commsRes.data.forEach(c => {
      mappedResults.push({
        id: c.id,
        title: c.name,
        subtitle: c.description || undefined,
        category: 'Communities',
        href: `/community/${c.id}`
      })
    })
  }

  if (notesRes.data) {
    notesRes.data.forEach(n => {
      mappedResults.push({
        id: n.id,
        title: n.title,
        subtitle: n.subject || undefined,
        category: 'Notes',
        href: `/notes?id=${n.id}`
      })
    })
  }

  if (eventsRes.data) {
    eventsRes.data.forEach(e => {
      mappedResults.push({
        id: e.id,
        title: e.title,
        subtitle: e.description || undefined,
        category: 'Events',
        href: `/events?id=${e.id}`
      })
    })
  }

  if (marketRes.data) {
    marketRes.data.forEach(m => {
      mappedResults.push({
        id: m.id,
        title: m.title,
        subtitle: m.price ? `₹${m.price}` : undefined,
        category: 'Marketplace',
        href: `/marketplace?id=${m.id}`
      })
    })
  }

  if (internRes.data) {
    internRes.data.forEach(i => {
      mappedResults.push({
        id: i.id,
        title: i.title,
        subtitle: i.company,
        category: 'Internships',
        href: `/internships?id=${i.id}`
      })
    })
  }

  const rankedResults = mappedResults
    .map(r => ({ ...r, score: getFuzzyScore(r.title, searchQuery) }))
    .filter(r => r.score > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))

  console.log(`Found ${rankedResults.length} ranked results:`)
  console.log(rankedResults)
  console.log('---')
}

async function run() {
  console.log('Signing in as test user...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'testadmin_1782238242221@iilm.edu',
    password: 'Password123!'
  })
  if (error) {
    console.error('Sign in failed:', error)
    return
  }
  console.log('Sign in successful. User ID:', data.user.id)

  await testSearch('Computer')
  await testSearch('Hackathon')
  await testSearch('Software')
  await testSearch('Physics')
  await testSearch('Structures')
}

run()
