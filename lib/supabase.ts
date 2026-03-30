
import { createClient } from '@supabase/supabase-js';

// GÜNCELLEME: Proje URL'niz
const supabaseUrl = 'https://hlyxaqdimvwcrlssxczu.supabase.co';

// GÜNCELLEME: Anon Public Key
const supabaseAnonKey = 'sb_publishable_lt-Ysij50RJE0cX_eYURnQ_NZwCvuan'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
