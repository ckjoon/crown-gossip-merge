import { test, expect } from "vitest";
import { expressionFor } from "../../src/core/rules/expressions";

test("대사 분위기로 표정 고르기 (걱정 > 놀람 > 기쁨 > 기본)", () => {
  expect(expressionFor("큰일이야, 서가가 무너졌어…")).toBe("worried");
  expect(expressionFor("하지만 아직 단서가 부족해!")).toBe("worried");
  expect(expressionFor("이게 정말 흑요석 폭약이라고?")).toBe("surprised");
  expect(expressionFor("드디어 가마솥이 다시 끓어오르기 시작했어!")).toBe("happy");
  expect(expressionFor("서가부터 확인해보자.")).toBe("neutral");
});
