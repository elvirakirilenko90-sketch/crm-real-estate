import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://stvinrjyfuskqddcxzjv.supabase.co";
const supabaseKey = "sb_publishable_MA2mF2cPre1gGnfUfjhKuA_BsD61g5A";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
