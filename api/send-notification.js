import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// 公開情報（すでにクライアント側にも入っているものと同じ）
const SUPABASE_URL = "https://vjnyviyvtsimimlsgrkl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WzydovCaJNtcbSzWdFvLsQ_9zogeaVi";
const VAPID_PUBLIC_KEY =
  "BIIhefII6En3whZ98Nr9nochkhsU4Iqe3JKVxJMUGWbIJZ5IOrR8OyxBJbf7-R-X8hLGGvG0t76sgP5Q0t0ikwc";

// 秘密鍵だけは、Vercelの環境変数（Settings → Environment Variables）に
// VAPID_PRIVATE_KEY という名前で設定してください。コードには書きません。
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!VAPID_PRIVATE_KEY) {
    res.status(500).json({ error: "VAPID_PRIVATE_KEY is not set on the server" });
    return;
  }

  webpush.setVapidDetails("mailto:notifications@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const { title, body } = req.body || {};
  const { data: subs, error } = await supabase.from("push_subscriptions").select("*");
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const payload = JSON.stringify({ title: title || "シフト管理", body: body || "" });

  const results = await Promise.allSettled(
    (subs || []).map((row) => webpush.sendNotification(row.subscription, payload))
  );

  await Promise.all(
    results.map((r, i) => {
      const statusCode = r.status === "rejected" ? r.reason?.statusCode : null;
      if (statusCode === 404 || statusCode === 410) {
        return supabase.from("push_subscriptions").delete().eq("endpoint", subs[i].endpoint);
      }
      return Promise.resolve();
    })
  );

  res.status(200).json({ sent: results.length });
}
