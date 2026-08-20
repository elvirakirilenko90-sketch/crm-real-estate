import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://stvinrjyfuskqddcxzjv.supabase.co";
// Legacy anon JWT остаётся публичным клиентским ключом Supabase. В этом проекте
// новый sb_publishable ключ периодически получает 504 на Auth gateway.
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0dmlucmp5ZnVza3FkZGN4emp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDI3NTYsImV4cCI6MjA5NjA3ODc1Nn0.OrvX2nqY40D-XoBpDYizS-3Zl4eegv4acenoQH7zyhw";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
