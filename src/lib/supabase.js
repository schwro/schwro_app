import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://TWOJ-PROJEKT.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TWOJ-KLUCZ';

export const supabase = createClient(supabaseUrl, supabaseKey);
