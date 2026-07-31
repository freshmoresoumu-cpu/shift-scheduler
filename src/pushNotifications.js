import { supabase } from "./supabaseClient.js";

// 公開されて構わないキーです（VAPID公開鍵）。秘密鍵はサーバー側（Vercelの環境変数）にのみ保管します。
const VAPID_PUBLIC_KEY =
  "BIIhefII6En3whZ98Nr9nochkhsU4Iqe3JKVxJMUGWbIJZ5IOrR8OyxBJbf7-R-X8hLGGvG0t76sgP5Q0t0ikwc";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function getPushSubscriptionStatus() {
  if (!isPushSupported()) return "unsupported";
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return "not-subscribed";
  const sub = await reg.pushManager.getSubscription();
  return sub ? "subscribed" : "not-subscribed";
}

export async function enablePushNotifications() {
  if (!isPushSupported()) {
    alert(
      "この端末・ブラウザは通知に対応していません。iPhone/iPadの場合は、一度「ホーム画面に追加」してから、そのアイコンで開いてもう一度お試しください。"
    );
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("通知が許可されませんでした。端末の設定から、このアプリの通知を許可してください。");
      return false;
    }
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({ endpoint: sub.endpoint, subscription: sub.toJSON() }, { onConflict: "endpoint" });
    if (error) {
      console.error("push subscription save error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("enablePushNotifications error:", e);
    return false;
  }
}

export async function sendPushNotification(title, body) {
  try {
    await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
  } catch (e) {
    console.error("push send error:", e);
  }
}
