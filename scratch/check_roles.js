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
  const { data, error } = await supabase
    .from('profiles')
    .select('email, role, is_verified, dating_verified')
  
  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Profiles in Database:')
    console.log(data)
  }
}

run()
