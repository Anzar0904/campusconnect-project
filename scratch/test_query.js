const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log('Supabase URL:', url);
  
  // 1. Get first profile from profiles
  const { data: profiles, error: err1 } = await supabase
    .from('profiles')
    .select('id, dating_verified, dating_verified_at, dating_terms_accepted, dating_safety_accepted, date_of_birth')
    .limit(5);
    
  console.log('Profiles check:', { profiles, err1 });
}

run();
