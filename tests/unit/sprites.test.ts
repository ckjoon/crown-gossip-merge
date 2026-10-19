import { test, expect } from "vitest";
import { getItemSVG, getCrateSVG, getEventSVG } from "../../src/views/art/sprites";

// 그라데이션 id에는 레벨 번호가 들어가므로 id를 지우고 실제 그림만 비교한다
function shape(svg: string) {
  return svg.replace(/id="[^"]*"/g, "").replace(/url\(#[^)]*\)/g, "url()");
}

for (const chain of ["potion", "grimoire", "herb", "bakery", "tea", "gem", "candle", "silk"]) {
  test(`${chain} 체인 Lv.1~8은 모두 서로 다른 그림`, () => {
    const seen = new Map<string, number>();
    for (let lv = 1; lv <= 8; lv++) {
      const svg = getItemSVG(chain, lv, false);
      expect(svg.startsWith("<svg")).toBe(true);
      const key = shape(svg);
      expect(seen.has(key), `${chain} Lv.${lv} == Lv.${seen.get(key)}`).toBe(false);
      seen.set(key, lv);
    }
  });
}

test("생성기·상자·이벤트 그림", () => {
  expect(getItemSVG("potion", 3, true)).toContain("<svg");
  expect(getCrateSVG()).toContain("<svg");
  expect(getEventSVG(5, false)).toContain("<svg");
});

test("스티커 스타일: 모든 아이템에 외곽선, Lv.5+ 오라, Lv.7+ 반짝이", () => {
  expect(getItemSVG("tea", 1, false)).toContain('filter="url(#stk)"');
  expect(getItemSVG("tea", 4, false)).not.toContain("data-aura");
  expect(getItemSVG("tea", 5, false)).toContain("data-aura");
  expect(getItemSVG("tea", 6, false)).not.toContain("data-sparkle");
  expect(getItemSVG("tea", 7, false)).toContain("data-sparkle");
  expect(getItemSVG("potion", 2, true)).toContain('filter="url(#stk)"');
});

// 보드는 SVG를 data URL 이미지(XML 파서)로 굽는다 — 값 없는 속성 같은 HTML식 표기는 디코딩 실패로 빈 칸이 된다
function xmlAttrErrors(svg: string): string[] {
  const errs: string[] = [];
  const body = svg.replace(/<!--[\s\S]*?-->/g, "");
  for (const m of body.matchAll(/<([a-zA-Z][^\s/>]*)([^>]*)>/g)) {
    const rest = m[2].replace(/\s[a-zA-Z_:][-\w:.]*\s*=\s*("[^"]*"|'[^']*')/g, "").replace(/\/$/, "").trim();
    if (rest) errs.push(`<${m[1]}> ${rest}`);
  }
  return errs;
}

test("모든 보드 그림은 XML로 올바름 (값 없는 속성 없음)", () => {
  const bad: string[] = [];
  const chk = (k: string, s: string) => xmlAttrErrors(s).forEach((e) => bad.push(`${k}: ${e}`));
  for (const c of ["potion", "grimoire", "herb", "bakery", "tea", "gem", "combo", "coin", "energy", "candle", "silk"])
    for (let l = 1; l <= 8; l++) chk(`item:${c}:${l}`, getItemSVG(c, l, false));
  for (const c of ["potion", "grimoire", "herb", "bakery", "tea", "candle", "silk"]) for (let l = 1; l <= 3; l++) chk(`gen:${c}:${l}`, getItemSVG(c, l, true));
  for (let l = 1; l <= 5; l++) chk(`event:${l}`, getEventSVG(l, false));
  chk("eventGen", getEventSVG(1, true));
  chk("crate", getCrateSVG());
  expect(bad).toEqual([]);
});

test("새 체인 생성기 ★1~3은 서로 다른 그림이고 다른 체인 생성기와도 다름", () => {
  for (const c of ["candle", "silk"]) {
    const shapes = [1, 2, 3].map((l) => shape(getItemSVG(c, l, true)));
    expect(new Set(shapes).size).toBe(3);
    expect(shapes).not.toContain(shape(getItemSVG("potion", 1, true)));
  }
});

// v3.9: 생성기는 등급이 오를수록 화려하게 — ★ 장식 없음, ★★ 반짝이, ★★★ 오라·왕관 (모든 생성기 체인)
test("생성기 등급 장식", () => {
  for (const c of ["potion", "grimoire", "herb", "bakery", "tea", "candle", "silk"]) {
    expect(getItemSVG(c, 1, true)).not.toContain("data-sparkle");
    expect(getItemSVG(c, 2, true)).toContain("data-sparkle");
    expect(getItemSVG(c, 2, true)).not.toContain("data-crown");
    expect(getItemSVG(c, 3, true)).toContain("data-crown");
    expect(getItemSVG(c, 3, true)).toContain("data-aura");
  }
});
