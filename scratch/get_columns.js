const fs = require('fs');

let url, key;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts[0] === 'NEXT_PUBLIC_SUPABASE_URL') {
      url = parts[1].trim();
    }
    if (parts[0] === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      key = parts[1].trim();
    }
  });
} catch (e) {
  console.error("Error reading .env.local:", e);
}

if (!url || !key) {
  console.error("Missing SUPABASE URL or KEY");
  process.exit(1);
}

async function run() {
  try {
    const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
    const schema = await res.json();
    console.log(schema);
  } catch (e) {
    console.error("Error fetching schema:", e);
  }
}
run();
