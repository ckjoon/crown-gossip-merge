import { test, expect } from "vitest";
import { getItemSVG, getCrateSVG, getEventSVG } from "../../src/views/art/sprites";

// 그라데이션 id에는 레벨 번호가 들어가므로 id를 지우고 실제 그림만 비교한다
function shape(svg: string) {
  return svg.replace(/id="[^"]*"/g, "").replace(/url\(#[^)]*\)/g, "url()");
}

for (const chain of ["potion", "grimoire", "herb", "bakery", "tea", "gem"]) {
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
  for (const c of ["potion", "grimoire", "herb", "bakery", "tea", "gem", "combo", "coin", "energy"])
    for (let l = 1; l <= 8; l++) chk(`item:${c}:${l}`, getItemSVG(c, l, false));
  for (const c of ["potion", "grimoire", "herb", "bakery", "tea"]) for (let l = 1; l <= 3; l++) chk(`gen:${c}:${l}`, getItemSVG(c, l, true));
  for (let l = 1; l <= 5; l++) chk(`event:${l}`, getEventSVG(l, false));
  chk("eventGen", getEventSVG(1, true));
  chk("crate", getCrateSVG());
  expect(bad).toEqual([]);
});
