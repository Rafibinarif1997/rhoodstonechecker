import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfig = {
  url: supabaseUrl,
  key: supabaseKey,
  ready: Boolean(supabaseUrl && supabaseKey),
};

export const supabase = supabaseConfig.ready
  ? createClient(supabaseUrl, supabaseKey)
  : null;
