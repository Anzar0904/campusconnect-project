const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wyuszwwbwxrjtkluncyg.supabase.co';
const supabaseKey = 'sb_publishable_HkOVkQ6vEJqQxkJDvCVvqw_3FIUOlzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('internships').insert({
    company: 'Test Co',
    title: 'Test Developer',
    type: 'Technical',
    location: 'Noida'
  }).select();
  
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Inserted Row:', data);
    // Cleanup
    const { error: delErr } = await supabase.from('internships').delete().eq('id', data[0].id);
    console.log('Deleted temp row:', delErr ? delErr : 'OK');
  }
}

check();
