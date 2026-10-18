import { test, expect } from "vitest";
import { getPortraitSVG, PORTRAIT_IDS, EXPRESSIONS } from "../../src/views/art/portraits";
import { CHARACTERS } from "../../src/core/rules/characters";

test("모든 캐릭터에 초상화가 있고 portraitKey가 연결됨", () => {
  expect(PORTRAIT_IDS.sort()).toEqual(Object.keys(CHARACTERS).sort());
  for (const ch of Object.values(CHARACTERS)) expect(ch.portraitKey).toBe(ch.id);
});

test("17명 × 4표정: 유효한 SVG이고 표정끼리 서로 다름", () => {
  for (const id of PORTRAIT_IDS) {
    const set = new Set<string>();
    for (const ex of EXPRESSIONS) {
      const svg = getPortraitSVG(id, ex);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      set.add(svg);
    }
    expect(set.size, id).toBe(4);
  }
});

test("캐릭터끼리 기본 표정이 서로 다름", () => {
  const all = PORTRAIT_IDS.map((id) => getPortraitSVG(id, "neutral"));
  expect(new Set(all).size).toBe(PORTRAIT_IDS.length);
});
