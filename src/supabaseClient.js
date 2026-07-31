import { createClient } from "@supabase/supabase-js";

// これは公開されるキーです（anon/publishable キー）。Supabase側で
// Row Level Security（RLS）を正しく設定していれば、これが漏れても問題ありません。
const SUPABASE_URL = "https://vjnyviyvtsimimlsgrkl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WzydovCaJNtcbSzWdFvLsQ_9zogeaVi";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
