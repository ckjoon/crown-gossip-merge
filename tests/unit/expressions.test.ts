import { test, expect } from "vitest";
import { expressionFor } from "../../src/core/rules/expressions";

test("대사 분위기로 표정 고르기 (걱정 > 놀람 > 기쁨 > 기본)", () => {
  expect(expressionFor("큰일이야, 서가가 무너졌어…")).toBe("worried");
  expect(expressionFor("하지만 아직 단서가 부족해!")).toBe("worried");
  expect(expressionFor("이게 정말 흑요석 폭약이라고?")).toBe("surprised");
  expect(expressionFor("드디어 가마솥이 다시 끓어오르기 시작했어!")).toBe("happy");
  expect(expressionFor("서가부터 확인해보자.")).toBe("neutral");
});

import { ALL_SPOTS_IN_ORDER } from "../../src/core/rules/rooms";

test("실제 스토리 대사로 4가지 표정이 모두 나온다", () => {
  const seen = new Set(ALL_SPOTS_IN_ORDER.flatMap((e) => e.spot.dialogues.map((d) => expressionFor(d.line))));
  expect([...seen].sort()).toEqual(["happy", "neutral", "surprised", "worried"]);
});

test("놀라운 소식·위험 대사는 기쁜 표정이 아님", () => {
  expect(expressionFor("누군가 성에 침입했던 거예요!")).toBe("worried");
  expect(expressionFor("이 장부가 찢겨 나갔잖아?!")).toBe("surprised");
  expect(expressionFor("그런데... 이상한 흔적이 있어요")).toBe("worried");
});
