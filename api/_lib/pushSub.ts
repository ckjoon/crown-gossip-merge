// pushSub.ts — 번개 가득 알림 요청 검증 (순수 함수, 함수 엔드포인트와 테스트가 같이 씀)
// 누구나 부를 수 있는 엔드포인트라 받는 값을 좁힌다: 알려진 브라우저 푸시 서버 주소만, 지연은 번개가 0→100 차는 시간까지만

export interface PushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// 번개 0개에서 100개까지 200분 + 여유
export const MAX_DELAY_SEC = 4 * 60 * 60;

const PUSH_HOSTS = [/(^|\.)googleapis\.com$/, /(^|\.)mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];

export function parseSub(v: unknown): PushSub | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof o.endpoint !== "string" || o.endpoint.length > 1000) return null;
  let url: URL;
  try {
    url = new URL(o.endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !PUSH_HOSTS.some((h) => h.test(url.hostname))) return null;
  const p256dh = o.keys?.p256dh;
  const auth = o.keys?.auth;
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) return null;
  return { endpoint: o.endpoint, keys: { p256dh, auth } };
}

export function parseSchedule(v: unknown): { sub: PushSub; delay: number } | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { subscription?: unknown; delay?: unknown };
  const sub = parseSub(o.subscription);
  const delay = typeof o.delay === "number" ? Math.round(o.delay) : NaN;
  if (!sub || !(delay >= 1 && delay <= MAX_DELAY_SEC)) return null;
  return { sub, delay };
}

// QStash 메시지 id만 받는다 (취소용)
export function parseMessageId(v: unknown): string | null {
  const id = v && typeof v === "object" ? (v as { id?: unknown }).id : undefined;
  return typeof id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(id) ? id : null;
}

export const ENERGY_FULL_PAYLOAD = { title: "⚡ 번개가 가득 찼어요!", body: "번개 100개가 모였어요. 성으로 돌아와 재료를 만들어 볼까요?", tag: "energy-full" };
