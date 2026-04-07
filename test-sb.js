require('dotenv').config({ path: '.env.lol' });
cons{ createClient } = require('@supabase/supabase-js');
const supabase cat = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.storage.from('studio-assets').list('frames').then(res => console.log(JSON.stringify(res.data, null, 2)));
