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

async function run() {
  const email = `testadmin_${Date.now()}@iilm.edu`
  const password = 'Password123!'
  console.log(`Signing up ${email}...`)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test Administrator',
        accepted_terms: true,
        policy_version: '1.0'
      }
    }
  })

  if (error) {
    console.error('Signup error:', error)
  } else {
    console.log('Signup successful:', data.user ? data.user.id : 'No user returned')
    // Wait 2 seconds for trigger to execute
    await new Promise(r => setTimeout(r, 2000))
    
    // Check if profile was created
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
    
    console.log('Profiles currently in DB:', profile, 'Error:', profileErr)
  }
}

run()
