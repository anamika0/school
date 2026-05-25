/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

// আপনার Supabase প্রজেক্টের আসল URL এবং Anon Key এখানে বসাবেন
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);