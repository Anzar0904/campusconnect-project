const URL = 'https://wyuszwwbwxrjtkluncyg.supabase.co/functions/v1/validate-otp'
const ANON_KEY = 'sb_publishable_HkOVkQ6vEJqQxkJDvCVvqw_3FIUOlzc'

async function test() {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY
    },
    body: JSON.stringify({
      email: 'anzar0904@gmail.com',
      acceptedTerms: true
    })
  })

  console.log('Status:', res.status)
  console.log('Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2))
  try {
    const data = await res.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (e) {
    console.log('Text:', await res.text())
  }
}

test()
