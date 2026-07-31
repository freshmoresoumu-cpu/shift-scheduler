import { supabase } from "./supabaseClient.js";

// このファイルは、Claudeアーティファクトの window.storage API と
// まったく同じ形（get/set/delete/list、戻り値の形）を、Supabaseの
// テーブル1つ（kv_store）を使って再現しています。
// これにより、アプリ本体（App.jsx）のコードは一切書き換えずに
// そのまま動きます。

// 「個人用データ」（shared=false）は、この端末・このブラウザだけの
// ものにするため、端末ごとのIDを付けて別々に保存します。
function getDeviceId() {
  let id = localStorage.getItem("shift_scheduler_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("shift_scheduler_device_id", id);
  }
  return id;
}

function fullKey(key, shared) {
  return shared ? `shared:${key}` : `device:${getDeviceId()}:${key}`;
}

async function get(key, shared) {
  const k = fullKey(key, shared);
  const { data, error } = await supabase
    .from("kv_store")
    .select("value")
    .eq("key", k)
    .maybeSingle();
  if (error || !data) return null;
  return { key, value: data.value, shared };
}

async function set(key, value, shared) {
  const k = fullKey(key, shared);
  const { error } = await supabase
    .from("kv_store")
    .upsert({ key: k, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error("storage.set error:", error);
    return null;
  }
  return { key, value, shared };
}

async function del(key, shared) {
  const k = fullKey(key, shared);
  const { error } = await supabase.from("kv_store").delete().eq("key", k);
  if (error) return null;
  return { key, deleted: true, shared };
}

async function list(prefix, shared) {
  const base = shared ? "shared:" : `device:${getDeviceId()}:`;
  const fullPrefix = prefix ? `${base}${prefix}` : base;
  const { data, error } = await supabase
    .from("kv_store")
    .select("key")
    .like("key", `${fullPrefix}%`);
  if (error) return null;
  const keys = (data || []).map((row) => row.key.slice(base.length));
  return { keys, prefix, shared };
}

window.storage = { get, set, delete: del, list };
