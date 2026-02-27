import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://yqprmygoguauebuttrle.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcHJteWdvZ3VhdWVidXR0cmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTEwODEsImV4cCI6MjA4NzM4NzA4MX0.IkvlmIVkMybvYx8Sj2Mdq0hTe7kaSpi97fRW9nU5Oy8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});