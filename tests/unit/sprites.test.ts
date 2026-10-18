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
