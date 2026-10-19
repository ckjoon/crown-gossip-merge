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

test("모든 초상화는 XML로 올바름 (data URL 이미지로 그려짐)", () => {
  const bad: string[] = [];
  for (const id of Object.keys(CHARACTERS))
    for (const ex of EXPRESSIONS) {
      const body = getPortraitSVG(id, ex).replace(/<!--[\s\S]*?-->/g, "");
      for (const m of body.matchAll(/<([a-zA-Z][^\s/>]*)([^>]*)>/g)) {
        const rest = m[2].replace(/\s[a-zA-Z_:][-\w:.]*\s*=\s*("[^"]*"|'[^']*')/g, "").replace(/\/$/, "").trim();
        if (rest) bad.push(`${id}/${ex}: <${m[1]}> ${rest}`);
      }
    }
  expect(bad).toEqual([]);
});

// ---- v3.6: 3D 모델에서 구운 초상화 ----
import fs from "node:fs";
import { BAKED_PORTRAITS, bakedPortraitUrl } from "../../src/views/art/portraitManifest";

test("17명 모두 표정 4종 초상화 그림이 구워져 있고 합계 1MB 미만", () => {
  expect([...BAKED_PORTRAITS].sort()).toEqual(Object.keys(CHARACTERS).sort());
  let total = 0;
  for (const id of BAKED_PORTRAITS)
    for (const ex of EXPRESSIONS) {
      const file = "public" + bakedPortraitUrl(id, ex);
      expect(fs.existsSync(file), file).toBe(true);
      total += fs.statSync(file).size;
    }
  expect(total).toBeLessThan(1_000_000);
});
