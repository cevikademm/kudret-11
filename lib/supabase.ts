
import { createClient } from '@supabase/supabase-js';

// GÜNCELLEME: Proje URL'niz
const supabaseUrl = 'https://frbcbhpqgywosmbklxhc.supabase.co';

// GÜNCELLEME: Anon Public Key
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYmNiaHBxZ3l3b3NtYmtseGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODY3MTgsImV4cCI6MjA5MDQ2MjcxOH0.3MKIJR0QygC6vKdOJxuPv8yymxQ4TAWg2Sm0dB7vR4w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
