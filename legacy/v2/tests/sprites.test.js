const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGlobal } = require("./helpers/load-global");

const S = loadGlobal("sprites.js", "GameSprites");

// 그라데이션 id에는 레벨 번호가 들어가므로 id를 지우고 실제 그림만 비교한다
function shape(svg) {
  return svg.replace(/id="[^"]*"/g, "").replace(/url\(#[^)]*\)/g, "url()");
}

for (const chain of ["potion", "grimoire", "herb", "bakery", "tea", "gem"]) {
  test(`${chain} 체인 Lv.1~8은 모두 서로 다른 그림`, () => {
    const seen = new Map();
    for (let lv = 1; lv <= 8; lv++) {
      const svg = S.getItemSVG(chain, lv, false);
      assert.ok(svg.startsWith("<svg"), `${chain} Lv.${lv} SVG 아님`);
      const key = shape(svg);
      assert.ok(!seen.has(key), `${chain} Lv.${lv}가 Lv.${seen.get(key)}와 같은 그림`);
      seen.set(key, lv);
    }
  });
}
