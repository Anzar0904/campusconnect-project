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
  const email = 'testadmin_1782244454828@iilm.edu'
  const password = 'Password123!'
  console.log(`Logging in ${email}...`)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Login error:', error.message)
  } else {
    console.log('Login successful! Session user ID:', data.user.id)
  }
}

run()
