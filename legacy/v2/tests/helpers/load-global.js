// 브라우저 전역(window.X) 패턴의 스크립트를 Node vm에서 읽어 해당 전역 객체를 돌려주는 테스트 헬퍼
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadGlobal(files, globalName) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const file of [].concat(files)) {
    const code = fs.readFileSync(path.join(__dirname, "..", "..", file), "utf8");
    vm.runInContext(code, ctx, { filename: file });
  }
  return ctx.window[globalName];
}

// 정해진 순서의 난수를 돌려주는 가짜 rng (값이 떨어지면 마지막 값을 반복)
function seqRng(values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

// vm 컨텍스트의 객체는 프로토타입이 달라 deepStrictEqual이 실패하므로, 반환값을 호스트의 일반 객체로 복제
function plain(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

function loadGlobalPlain(files, globalName) {
  const api = loadGlobal(files, globalName);
  const out = {};
  for (const [k, v] of Object.entries(api)) {
    out[k] = typeof v === "function" ? (...args) => plain(v(...args)) : plain(v);
  }
  return out;
}

module.exports = { loadGlobal, loadGlobalPlain, seqRng };
