const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wyuszwwbwxrjtkluncyg.supabase.co';
const supabaseKey = 'sb_publishable_HkOVkQ6vEJqQxkJDvCVvqw_3FIUOlzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('internships').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample Row:', data);
  }
}

check();
