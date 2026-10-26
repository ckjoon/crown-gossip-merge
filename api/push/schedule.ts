// POST /api/push/schedule — 번개가 다 차는 시각에 맞춰 푸시를 예약 (QStash 지연 메시지에 구독 정보를 실어 보냄, 따로 저장하지 않음)
import { Client } from "@upstash/qstash";
import { parseSchedule } from "../_lib/pushSub.js";

export async function POST(request: Request): Promise<Response> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return Response.json({ error: "not configured" }, { status: 503 });
  const req = parseSchedule(await request.json().catch(() => null));
  if (!req) return Response.json({ error: "bad request" }, { status: 400 });
  const client = new Client({ token, baseUrl: process.env.QSTASH_URL });
  const { messageId } = await client.publishJSON({
    // 미리보기 주소는 배포 보호로 막힐 수 있어 운영 주소로 (없으면 요청 주소)
    url: `${process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : new URL(request.url).origin}/api/push/send`,
    body: { subscription: req.sub },
    delay: req.delay,
    retries: 1,
  });
  return Response.json({ id: messageId });
}
