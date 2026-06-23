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

const tables = [
  'colleges',
  'profiles',
  'internships',
  'events',
  'communities',
  'clubs',
  'notes',
  'exam_papers',
  'study_groups',
  'marketplace_items',
  'messages',
  'friendships'
]

async function run() {
  console.log('Table Row Counts:')
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`- ${table}: Error (${error.message})`)
    } else {
      console.log(`- ${table}: ${count} rows`)
    }
  }
}

run()
