const URL = 'https://wyuszwwbwxrjtkluncyg.supabase.co/functions/v1/validate-otp'
const ANON_KEY = 'sb_publishable_HkOVkQ6vEJqQxkJDvCVvqw_3FIUOlzc'

async function test(email) {
  console.log(`Testing: ${email}`)
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY
    },
    body: JSON.stringify({
      email: email,
      acceptedTerms: true
    })
  })

  console.log('Status:', res.status)
  try {
    const data = await res.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (e) {
    console.log('Error parsing JSON')
  }
  console.log('---')
}

async function run() {
  await test('anzar0904@gmail.com')
  await test('mohammad.anzar.cs28@iilm.edu')
}

run()
