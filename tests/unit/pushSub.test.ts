import { test, expect } from "vitest";
import { parseSchedule, parseMessageId, MAX_DELAY_SEC } from "../../api/_lib/pushSub";

// v3.13 번개 가득 알림: 누구나 부를 수 있는 예약 엔드포인트가 받는 값
const sub = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "k", auth: "a" } };

test("알려진 푸시 서버 구독과 0~4시간 지연만 받음", () => {
  expect(parseSchedule({ subscription: sub, delay: 600 })).toEqual({ sub, delay: 600 });
  expect(parseSchedule({ subscription: { ...sub, endpoint: "https://evil.example.com/x" }, delay: 600 })).toBeNull();
  expect(parseSchedule({ subscription: { ...sub, endpoint: "http://fcm.googleapis.com/x" }, delay: 600 })).toBeNull();
  expect(parseSchedule({ subscription: { ...sub, endpoint: "https://fcm.googleapis.com.evil.io/x" }, delay: 600 })).toBeNull();
  expect(parseSchedule({ subscription: sub, delay: 0 })).toBeNull();
  expect(parseSchedule({ subscription: sub, delay: MAX_DELAY_SEC + 1 })).toBeNull();
  expect(parseSchedule({ subscription: { endpoint: sub.endpoint }, delay: 600 })).toBeNull();
  expect(parseSchedule(null)).toBeNull();
});

test("취소는 메시지 id 문자열만", () => {
  expect(parseMessageId({ id: "msg_abc-1" })).toBe("msg_abc-1");
  expect(parseMessageId({ id: "../x" })).toBeNull();
  expect(parseMessageId({})).toBeNull();
});
