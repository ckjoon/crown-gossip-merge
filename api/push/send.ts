// POST /api/push/send — QStash만 부르는 엔드포인트 (서명 확인 후 브라우저 푸시 전송). 구독이 만료됐으면(404·410) 조용히 끝낸다
import { Receiver } from "@upstash/qstash";
import webpush from "web-push";
import { ENERGY_FULL_PAYLOAD, parseSub } from "../_lib/pushSub.js";

export async function POST(request: Request): Promise<Response> {
  const env = process.env;
  if (!env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }
  const raw = await request.text();
  const receiver = new Receiver({ currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY, nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY });
  const ok = await receiver.verify({ signature: request.headers.get("upstash-signature") ?? "", body: raw }).catch(() => false);
  if (!ok) return Response.json({ error: "bad signature" }, { status: 401 });
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 아래에서 400
  }
  const sub = parseSub((parsed as { subscription?: unknown } | null)?.subscription);
  if (!sub) return Response.json({ error: "bad request" }, { status: 400 });
  webpush.setVapidDetails(env.VAPID_SUBJECT || "mailto:noreply@example.com", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  try {
    await webpush.sendNotification(sub, JSON.stringify(ENERGY_FULL_PAYLOAD), { TTL: 6 * 60 * 60, urgency: "normal", topic: "energy-full" });
  } catch (err) {
    const code = (err as { statusCode?: number }).statusCode;
    if (code !== 404 && code !== 410) throw err;
  }
  return Response.json({ ok: true });
}
