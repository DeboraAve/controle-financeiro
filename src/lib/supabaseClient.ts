import { createClient } from '@supabase/supabase-js';

// The "publishable" key is designed to be public — it only ever acts within
// what Row Level Security allows for the signed-in user. Safe to ship in a
// static, client-only bundle like this one.
const SUPABASE_URL = 'https://scgbbllkrqiqdixjkkny.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_DtlwiqZSQ0ArvJAKH-yRJg__OgEq81a';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
