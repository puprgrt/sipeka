import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testSupabase() {
  console.log('Testing REST API...');
  const { data, error } = await supabase.from('todos').select('*').limit(1);
  if (error) {
    console.error('REST API Error:', error);
  } else {
    console.log('REST API Success! Data:', data);
  }
}

testSupabase();
