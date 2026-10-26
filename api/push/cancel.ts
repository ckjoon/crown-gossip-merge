// POST /api/push/cancel — 게임으로 돌아오면 예약해 둔 알림을 지운다 (이미 보냈거나 없으면 그냥 성공)
import { Client } from "@upstash/qstash";
import { parseMessageId } from "../_lib/pushSub.js";

export async function POST(request: Request): Promise<Response> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return Response.json({ error: "not configured" }, { status: 503 });
  const id = parseMessageId(await request.json().catch(() => null));
  if (!id) return Response.json({ error: "bad request" }, { status: 400 });
  await new Client({ token, baseUrl: process.env.QSTASH_URL }).messages.delete(id).catch(() => {});
  return Response.json({ ok: true });
}
