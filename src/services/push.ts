// push.ts — 번개 가득 알림(v3.13): 이 기기에서 켜고 끄는 설정(세이브가 아니라 기기 설정 — 알림 권한도 기기마다 다름)
// 게임을 떠날 때(화면이 숨겨질 때) 다 차는 시각에 맞춰 서버에 예약하고, 돌아오면 지운다. 켤 때만 알림 권한을 묻는다

const VAPID_PUBLIC_KEY = "BBk__sOOcrovtC0aCdn3ElSJBOLvRpPM88xDRz3f2e_vNEnpV-GrdMSKDs_ACn6sL0YxxTbBlXKkpoD6ex8niic";
const KEY_ON = "crown_gossip_energy_alert_v1";
const KEY_MSG = "crown_gossip_energy_alert_msg_v1";
const KEY_ASKED = "crown_gossip_energy_alert_asked_v1";
// 구독 정보(JSON) — 떠나는 순간 기다림 없이 바로 보내려고 켤 때·시작할 때 미리 담아 둔다
const KEY_SUB = "crown_gossip_energy_alert_sub_v1";

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function energyAlertOn(): boolean {
  return store()?.getItem(KEY_ON) === "on" && pushSupported() && Notification.permission === "granted";
}

// 번개가 바닥났을 때 한 번만 물어본다 (그 뒤로는 설정에서)
export function shouldAskEnergyAlert(): boolean {
  return pushSupported() && !energyAlertOn() && Notification.permission !== "denied" && store()?.getItem(KEY_ASKED) !== "1";
}

export function markEnergyAlertAsked(): void {
  store()?.setItem(KEY_ASKED, "1");
}

function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function subscription(create: boolean): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready;
  const cur = await reg.pushManager.getSubscription();
  if (cur || !create) return cur;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) });
}

export type EnableResult = "on" | "denied" | "unsupported" | "error";

export async function enableEnergyAlert(): Promise<EnableResult> {
  markEnergyAlertAsked();
  if (!pushSupported()) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  try {
    const sub = await subscription(true);
    if (!sub) return "error";
    store()?.setItem(KEY_SUB, JSON.stringify(sub.toJSON()));
  } catch {
    return "error";
  }
  store()?.setItem(KEY_ON, "on");
  return "on";
}

export async function disableEnergyAlert(): Promise<void> {
  markEnergyAlertAsked();
  store()?.removeItem(KEY_ON);
  store()?.removeItem(KEY_SUB);
  await cancelEnergyAlert();
  try {
    await (await subscription(false))?.unsubscribe();
  } catch {
    // 이미 없으면 그만
  }
}

// 시작할 때: 구독이 바뀌었을 수 있으니(브라우저가 갱신) 담아 둔 구독을 새로 고친다
export async function refreshEnergyAlertSub(): Promise<void> {
  if (!energyAlertOn()) return;
  try {
    const sub = await subscription(true);
    if (sub) store()?.setItem(KEY_SUB, JSON.stringify(sub.toJSON()));
  } catch {
    // 다음에 다시
  }
}

// 게임을 떠날 때: 다 차기까지 남은 초 뒤에 알림. 이미 가득이면 보내지 않는다
// 안드로이드는 화면이 숨겨지면 곧 페이지를 얼리므로, 기다리는 일 없이 이 순간에 요청을 내보낸다 (keepalive)
export function scheduleEnergyAlert(delaySec: number): void {
  const sub = store()?.getItem(KEY_SUB);
  if (!energyAlertOn() || delaySec <= 0 || !sub) return;
  void cancelEnergyAlert();
  fetch("/api/push/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: `{"subscription":${sub},"delay":${Math.round(delaySec)}}`,
    keepalive: true,
  })
    .then((res) => (res.ok ? (res.json() as Promise<{ id?: string }>) : null))
    .then((r) => {
      if (!r?.id) return;
      store()?.setItem(KEY_MSG, r.id);
      // 얼어 있다가 게임으로 돌아온 뒤에 답이 왔으면 바로 지운다
      if (document.visibilityState === "visible") void cancelEnergyAlert();
    })
    .catch(() => {
      // 오프라인이면 이번엔 알림 없음
    });
}

// 게임으로 돌아오면 예약을 지운다 (다시 떠날 때 새로 예약)
export async function cancelEnergyAlert(): Promise<void> {
  const id = store()?.getItem(KEY_MSG);
  if (!id) return;
  store()?.removeItem(KEY_MSG);
  try {
    await fetch("/api/push/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }), keepalive: true });
  } catch {
    // 못 지우면 알림이 한 번 더 올 뿐
  }
}
