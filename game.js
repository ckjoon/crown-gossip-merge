// game.js — 크라운 & 가십: 3D 인테리어 빌딩 & 멀티 체인 조합(Merge & Combination) 게임
// Three.js + GSAP 3D 인테리어 엔진 및 GameSprites 커스텀 SVG 렌더러 연동

const COLS = 7;
const ROWS = 8;
const TOTAL_CELLS = COLS * ROWS; // 56칸

const CHAINS = {
  potion: {
    id: "potion",
    name: "비전 물약 체인",
    css: "chain-potion",
    generator: { name: "마법 가마솥", desc: "탭하면 물약 재료(⚡1)와 20% 확률로 희귀 보석 원석을 생성합니다." },
    rareDropChain: "gem",
    rareChance: 0.22,
    items: [
      { level: 1, name: "마나 이슬", sell: 2 },
      { level: 2, name: "초급 마나물약", sell: 5 },
      { level: 3, name: "달빛 플라스크", sell: 12 },
      { level: 4, name: "자수정 비약", sell: 28 },
      { level: 5, name: "성운 엘릭서", sell: 65 },
      { level: 6, name: "신성 날개비약", sell: 150 },
    ],
  },
  grimoire: {
    id: "grimoire",
    name: "고대 마도서 체인",
    css: "chain-grimoire",
    generator: { name: "고대 마법책장", desc: "탭하면 마력 깃펜과 봉인된 주문서 재료(⚡1)를 생성합니다." },
    items: [
      { level: 1, name: "마력 깃펜", sell: 2 },
      { level: 2, name: "봉인 주문서", sell: 5 },
      { level: 3, name: "화염 마도서", sell: 12 },
      { level: 4, name: "심연 백과사전", sell: 28 },
      { level: 5, name: "예언의 마도서", sell: 65 },
      { level: 6, name: "태고 신화비석", sell: 150 },
    ],
  },
  herb: {
    id: "herb",
    name: "달빛 마법식물 체인",
    css: "chain-herb",
    generator: { name: "달빛 온실화분", desc: "탭하면 신비한 식물 포자와 달버섯(⚡1)을 생성합니다." },
    items: [
      { level: 1, name: "야광 포자", sell: 2 },
      { level: 2, name: "몽환 달버섯", sell: 5 },
      { level: 3, name: "만드라고라", sell: 12 },
      { level: 4, name: "영혼 꽃나비", sell: 28 },
      { level: 5, name: "불사조의 알", sell: 65 },
      { level: 6, name: "스타 드래곤", sell: 150 },
    ],
  },
  bakery: {
    id: "bakery",
    name: "화로 베이커리 체인",
    css: "chain-bakery",
    generator: { name: "마법 화로오븐", desc: "탭하면 갓 구운 베이커리 반죽과 크루아상(⚡1)을 생성합니다." },
    items: [
      { level: 1, name: "밀가루 반죽", sell: 2 },
      { level: 2, name: "버터 크루아상", sell: 5 },
      { level: 3, name: "베리 타르트", sell: 12 },
      { level: 4, name: "달빛 마카롱", sell: 28 },
      { level: 5, name: "쇼트케이크", sell: 65 },
      { level: 6, name: "로얄 3단케이크", sell: 150 },
    ],
  },
  tea: {
    id: "tea",
    name: "연금술 티 & 카페 체인",
    css: "chain-tea",
    generator: { name: "황실 티포트", desc: "탭하면 향긋한 찻잎과 에스프레소 음료 재료(⚡1)를 생성합니다." },
    items: [
      { level: 1, name: "향긋한 찻잎", sell: 2 },
      { level: 2, name: "캐모마일 티", sell: 5 },
      { level: 3, name: "에스프레소", sell: 12 },
      { level: 4, name: "오로라 밀크티", sell: 28 },
      { level: 5, name: "황실 티세트", sell: 70 },
    ],
  },
  gem: {
    id: "gem",
    name: "별빛 세공보석 체인 (가마솥 부산물)",
    css: "chain-gem",
    items: [
      { level: 1, name: "원석 파편", sell: 4 },
      { level: 2, name: "사파이어", sell: 10 },
      { level: 3, name: "문스톤 결정", sell: 25 },
      { level: 4, name: "태양석 브로치", sell: 60 },
      { level: 5, name: "여왕의 티아라", sell: 160 },
    ],
  },
  combo: {
    id: "combo",
    name: "⚗️ 이종 재료 스페셜 조합품",
    css: "chain-combo",
    items: [
      { level: 1, name: "특제 활력비약", sell: 35, recipeText: "초급 마나물약(Lv.2) + 몽환 달버섯(Lv.2)" },
      { level: 2, name: "모닝 브런치세트", sell: 50, recipeText: "버터 크루아상(Lv.2) + 에스프레소(Lv.3)" },
      { level: 3, name: "마력 각인룬스톤", sell: 55, recipeText: "봉인 주문서(Lv.2) + 사파이어(Lv.2)" },
    ],
  },
  coin: {
    id: "coin",
    name: "황금 금화 체인",
    css: "chain-coin",
    isCollectible: true,
    items: [
      { level: 1, name: "청동 주화 (+15🪙)", rewardType: "coins", amount: 15 },
      { level: 2, name: "금화 더미 (+45🪙)", rewardType: "coins", amount: 45 },
      { level: 3, name: "왕실 보물상자 (+130🪙)", rewardType: "coins", amount: 130 },
    ],
  },
  energy: {
    id: "energy",
    name: "마나 번개 체인",
    css: "chain-energy",
    isCollectible: true,
    items: [
      { level: 1, name: "마나 스파크 (+10⚡)", rewardType: "energy", amount: 10 },
      { level: 2, name: "마나 크리스탈 (+30⚡)", rewardType: "energy", amount: 30 },
      { level: 3, name: "태고 마나코어 (+80⚡)", rewardType: "energy", amount: 80 },
    ],
  },
};

// 이종 재료 조합(Cross-Chain Combination) 레시피 테이블
const CROSS_RECIPES = [
  {
    a: { chain: "potion", level: 2 },
    b: { chain: "herb", level: 2 },
    result: { chain: "combo", level: 1 },
  },
  {
    a: { chain: "bakery", level: 2 },
    b: { chain: "tea", level: 3 },
    result: { chain: "combo", level: 2 },
  },
  {
    a: { chain: "grimoire", level: 2 },
    b: { chain: "gem", level: 2 },
    result: { chain: "combo", level: 3 },
  },
];

const CUSTOMERS = [
  { name: "퀸 (Quinn)", face: "🕵️‍♀️", line: "하버 테라스와 연금술 공방을 모두 멋지게 리모델링해 봐요!" },
  { name: "루시안 공작", face: "🧛‍♂️", line: "특제 활력비약과 향긋한 홍차의 조합이 훌륭하군." },
  { name: "올리비아", face: "👧", line: "화덕 오븐에서 갓 구운 크루아상이랑 케이크 냄새가 너무 좋아요!" },
  { name: "해리슨", face: "🧔‍♂️", line: "별빛로드를 밝힐 마도서와 따뜻한 에스프레소 부탁하네!" },
  { name: "카르멘", face: "👩‍🎨", line: "3가지 인테리어 스타일 중 마음에 드는 디자인으로 가구를 배치해 보세요!" },
];

// 사운드 엔진
class SoundEngine {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }
  tone(freq, dur = 0.1, type = "sine", vol = 0.12, delay = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }
  tap() {
    this.tone(560, 0.06, "triangle", 0.08);
  }
  spawn() {
    this.tone(440, 0.07, "sine", 0.1, 0);
    this.tone(660, 0.09, "sine", 0.12, 0.04);
  }
  merge(lv = 2, isCombo = false) {
    const base = 360 + lv * 55;
    this.tone(base, 0.1, "triangle", 0.14, 0);
    this.tone(base * 1.25, 0.14, "sine", 0.16, 0.06);
    if (isCombo) {
      this.tone(base * 1.5, 0.22, "triangle", 0.18, 0.12);
    }
  }
  serve() {
    this.tone(523.25, 0.1, "sine", 0.14, 0);
    this.tone(659.25, 0.1, "sine", 0.14, 0.07);
    this.tone(783.99, 0.12, "sine", 0.15, 0.14);
    this.tone(1046.5, 0.25, "triangle", 0.18, 0.21);
  }
  warn() {
    this.tone(190, 0.14, "sawtooth", 0.08, 0);
  }
}

const sfx = new SoundEngine();

let uidSeq = 1;
function newUid() {
  return "item_" + uidSeq++;
}

const state = {
  playerLv: 1,
  xp: 0,
  maxEnergy: 100,
  energy: 100,
  energyCountdown: 15,
  coins: 350,
  stars: 4,
  selectedIdx: null,
  board: new Array(TOTAL_CELLS).fill(null),
  bag: [],
  orders: [],
  lastTapCell: null,
  lastTapTime: 0,
  roomExpanded: false,
  isLoaded: false,
};

function getRequiredXP(lv) {
  return 50 + (lv - 1) * 20;
}

const drag = {
  active: false,
  isDragging: false,
  sourceIdx: null,
  startX: 0,
  startY: 0,
  ghostEl: null,
  hoverIdx: null,
};

async function init() {
  buildInitialBoard();
  initCustomerOrders();

  // 로컬 DB(IndexedDB + LocalStorage)에서 기존 진행도 복원 및 스키마 병합
  let savedInterior = null;
  if (window.GameDB) {
    const record = await GameDB.loadProgress();
    if (record) {
      const res = GameDB.mergeWithDefaultState(state, record, CHAINS, TOTAL_CELLS);
      if (res && res.merged) {
        savedInterior = res;
      }
    }
  }
  state.maxEnergy = 100 + (state.playerLv - 1) * 10;
  state.isLoaded = true;

  bindUIEvents();
  setupPointerDragEngine();

  // Three.js 3D 아이소메트릭 인테리어 엔진 초기화
  if (window.Interior3DEngine) {
    Interior3DEngine.init("three-canvas-mount", "three-pins-overlay", {
      getStars: () => state.stars,
      onRenovate: (spot, wasAlreadyDone) => {
        if (!wasAlreadyDone) {
          state.stars = Math.max(0, state.stars - spot.cost);
          state.coins += 100;
          state.energy = Math.min(state.maxEnergy + 50, state.energy + 25);
          gainXP(35);
          floatText(`🎉 [${spot.name}] 시공 완료! +100🪙 +25⚡`, window.innerWidth / 2, 190, "#10b981");
        } else {
          floatText(`🎨 [${spot.name}] 스타일 변경 완료!`, window.innerWidth / 2, 190, "#c084fc");
        }
        sfx.serve();
        setDialogue("🔨 인테리어 연출", spot.story);
        renderAll();
      },
    });

    if (savedInterior && savedInterior.interiorRooms) {
      Interior3DEngine.importRoomsState(savedInterior.interiorRooms, savedInterior.currentThemeKey);
      document.querySelectorAll(".theme-tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.theme === (savedInterior.currentThemeKey || "alchemy"));
      });
    }
  }

  renderAll();
  renderCodexModal();

  setInterval(() => {
    if (state.energy < state.maxEnergy) {
      state.energyCountdown--;
      if (state.energyCountdown <= 0) {
        state.energy = Math.min(state.maxEnergy, state.energy + 1);
        state.energyCountdown = 15;
        triggerAutoSave();
      }
    } else {
      state.energyCountdown = 15;
    }
    updateTopBarUI();
  }, 1000);
}

// 5대 생성기(가마솥, 책장, 화분, 화로오븐, 티포트) + 거미줄(🕸️) + 외곽 봉인상자(📦) 배치
function buildInitialBoard() {
  state.board.fill(null);
  const allCoreChains = ["potion", "grimoire", "herb", "bakery", "tea"];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const isOuter = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
      const isInnerRing = r === 1 || r === ROWS - 2 || c === 1 || c === COLS - 2;

      if (isOuter) {
        const ch = allCoreChains[(r + c) % allCoreChains.length];
        state.board[idx] = {
          uid: newUid(),
          state: "crate",
          isGenerator: false,
          chain: ch,
          level: (r + c) % 2 === 0 ? 2 : 3,
        };
      } else if (isInnerRing) {
        const ch = allCoreChains[(r * 2 + c) % allCoreChains.length];
        state.board[idx] = {
          uid: newUid(),
          state: "cobweb",
          isGenerator: false,
          chain: ch,
          level: (r + c) % 3 === 0 ? 2 : 1,
        };
      }
    }
  }

  // 중앙 오픈 공간에 5종류의 핵심 생성기 배치!
  placeTile(2, 2, { isGenerator: true, chain: "potion", level: 1, state: "active" }); // 🔥 마법 가마솥
  placeTile(2, 4, { isGenerator: true, chain: "grimoire", level: 1, state: "active" }); // 🦉 고대 책장
  placeTile(3, 3, { isGenerator: true, chain: "herb", level: 1, state: "active" }); // 🪴 달빛 화분
  placeTile(5, 2, { isGenerator: true, chain: "bakery", level: 1, state: "active" }); // 🧁 화로 오븐
  placeTile(5, 4, { isGenerator: true, chain: "tea", level: 1, state: "active" }); // 🫖 황실 티포트

  // 시작하자마자 합치기와 이종 조합(Combination)을 테스트할 수 있는 재료 배치
  placeTile(2, 3, { isGenerator: false, chain: "potion", level: 1, state: "active" });
  placeTile(3, 2, { isGenerator: false, chain: "potion", level: 1, state: "active" });
  placeTile(3, 4, { isGenerator: false, chain: "herb", level: 2, state: "active" });
  placeTile(4, 2, { isGenerator: false, chain: "bakery", level: 2, state: "active" });
  placeTile(4, 4, { isGenerator: false, chain: "tea", level: 3, state: "active" });

  state.selectedIdx = 2 * COLS + 2;
}

function placeTile(r, c, props) {
  state.board[r * COLS + c] = { uid: newUid(), ...props };
}

function getItemMeta(chain, level) {
  const ch = CHAINS[chain];
  if (!ch) return { name: "미확인", css: "", maxLv: 1 };
  const item = ch.items[Math.min(level - 1, ch.items.length - 1)];
  return {
    ...item,
    chainName: ch.name,
    css: ch.css,
    maxLv: ch.items.length,
    isCollectible: !!ch.isCollectible,
  };
}

// 이종 재료 조합(Cross-Chain Combination) 가능 여부 확인
function findCrossRecipe(itemA, itemB) {
  if (!itemA || !itemB || itemA.isGenerator || itemB.isGenerator) return null;
  for (const rec of CROSS_RECIPES) {
    const matchForward =
      itemA.chain === rec.a.chain &&
      itemA.level === rec.a.level &&
      itemB.chain === rec.b.chain &&
      itemB.level === rec.b.level;
    const matchReverse =
      itemA.chain === rec.b.chain &&
      itemA.level === rec.b.level &&
      itemB.chain === rec.a.chain &&
      itemB.level === rec.a.level;
    if (matchForward || matchReverse) {
      return rec.result;
    }
  }
  return null;
}

function findNearestEmptyCell(originIdx) {
  const empty = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (!state.board[i]) empty.push(i);
  }
  if (empty.length === 0) return -1;
  if (originIdx === null || originIdx === undefined) {
    return empty[Math.floor(Math.random() * empty.length)];
  }
  const or = Math.floor(originIdx / COLS);
  const oc = originIdx % COLS;
  empty.sort((a, b) => {
    const da = Math.hypot(Math.floor(a / COLS) - or, (a % COLS) - oc);
    const db = Math.hypot(Math.floor(b / COLS) - or, (b % COLS) - oc);
    return da - db;
  });
  return empty[0];
}

// 손님 주문 시스템
function initCustomerOrders() {
  state.orders = [
    // 첫 번째 주문: 바로 이종 조합이나 기본 머지로 달성 가능
    createOrder(0, [{ chain: "combo", level: 2 }]), // 크루아상(Lv2) + 에스프레소(Lv3) 조합 브런치!
    createOrder(1, [
      { chain: "potion", level: 2 },
      { chain: "herb", level: 1 },
    ]),
    createOrder(2, [
      { chain: "grimoire", level: 2 },
      { chain: "bakery", level: 2 },
    ]),
  ];
}

function createOrder(slotIdx, customReqs = null) {
  const cust = CUSTOMERS[(state.playerLv + slotIdx) % CUSTOMERS.length];
  const core = ["potion", "grimoire", "herb", "bakery", "tea"];
  let reqs = customReqs;

  if (!reqs) {
    // 25% 확률로 스페셜 이종 조합(combo) 메뉴 주문!
    if (Math.random() < 0.25) {
      const cmbLv = Math.floor(Math.random() * 3) + 1;
      reqs = [{ chain: "combo", level: cmbLv }];
    } else {
      const c1 = core[Math.floor(Math.random() * core.length)];
      const maxLv = Math.min(5, 2 + Math.floor(state.playerLv / 2));
      const lv1 = Math.max(2, Math.floor(Math.random() * maxLv) + 1);
      reqs = [{ chain: c1, level: lv1 }];

      if (Math.random() < 0.55) {
        const c2 = core[Math.floor(Math.random() * core.length)];
        const lv2 = Math.max(1, lv1 - 1);
        reqs.push({ chain: c2, level: lv2 });
      }
    }
  }

  const baseVal = reqs.reduce((s, r) => s + (r.chain === "combo" ? 45 : Math.pow(2, r.level) * 9), 0);
  return {
    id: newUid(),
    customer: cust,
    reqs,
    coins: baseVal + 20,
    stars: reqs.some((r) => r.chain === "combo" || r.level >= 4) ? 2 : 1,
  };
}

function computeWantedMap() {
  const wantedBoardUids = new Set();
  const orderStatus = [];

  for (const ord of state.orders) {
    const tempUsed = new Set();
    const reqFulfilled = [];
    const matchedIndices = [];

    for (const req of ord.reqs) {
      let foundIdx = -1;
      for (let i = 0; i < TOTAL_CELLS; i++) {
        const it = state.board[i];
        if (
          it &&
          it.state === "active" &&
          !it.isGenerator &&
          !tempUsed.has(it.uid) &&
          it.chain === req.chain &&
          it.level === req.level
        ) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx !== -1) {
        const uid = state.board[foundIdx].uid;
        tempUsed.add(uid);
        wantedBoardUids.add(uid);
        reqFulfilled.push(true);
        matchedIndices.push(foundIdx);
      } else {
        reqFulfilled.push(false);
      }
    }

    orderStatus.push({
      allReady: reqFulfilled.every(Boolean),
      reqFulfilled,
      matchedIndices,
    });
  }

  return { wantedBoardUids, orderStatus };
}

function serveOrder(orderIdx, event) {
  const { orderStatus } = computeWantedMap();
  const st = orderStatus[orderIdx];
  const ord = state.orders[orderIdx];
  if (!st || !st.allReady || !ord) {
    sfx.warn();
    return;
  }

  for (const cellIdx of st.matchedIndices) {
    state.board[cellIdx] = null;
    if (state.selectedIdx === cellIdx) state.selectedIdx = null;
  }

  state.coins += ord.coins;
  state.stars += ord.stars;
  gainXP(25);
  sfx.serve();

  setDialogue(ord.customer.face + " " + ord.customer.name, ord.customer.line);
  floatText(
    `🎉 주문 전달! +${ord.coins}🪙 +${ord.stars}🌟`,
    event ? event.clientX : window.innerWidth / 2,
    event ? event.clientY : 160,
    "#10b981"
  );

  state.orders[orderIdx] = createOrder(orderIdx);
  renderAll();
}

let lvBannerTimer = null;

function showLevelUpBanner(newLv, rewardCoins, rewardEnergy) {
  const banner = document.getElementById("levelup-banner");
  const titleEl = document.getElementById("lv-banner-title");
  const subEl = document.getElementById("lv-banner-sub");
  if (!banner) return;

  titleEl.textContent = `👑 연금술사 레벨 업! Lv.${newLv} 달성!`;
  subEl.textContent = `보상: +${rewardCoins}🪙 · +${rewardEnergy}⚡ · 최대 에너지 ${state.maxEnergy} 증가!`;
  banner.classList.remove("hidden");

  if (lvBannerTimer) clearTimeout(lvBannerTimer);
  lvBannerTimer = setTimeout(() => {
    banner.classList.add("hidden");
  }, 3400);
}

function gainXP(amount) {
  state.xp += amount;
  let leveledUp = false;

  while (state.xp >= getRequiredXP(state.playerLv)) {
    state.xp -= getRequiredXP(state.playerLv);
    state.playerLv++;
    state.maxEnergy = 100 + (state.playerLv - 1) * 10;

    const rewardCoins = 40 * state.playerLv;
    const rewardEnergy = 30;
    state.coins += rewardCoins;
    state.stars += 1;
    state.energy = Math.min(state.maxEnergy + 60, state.energy + rewardEnergy);

    // 보드에 레벨업 보너스 선물(금화 더미 또는 마나 크리스탈) 스폰
    const giftCell = findNearestEmptyCell(27);
    if (giftCell !== -1) {
      state.board[giftCell] = {
        uid: newUid(),
        state: "active",
        isGenerator: false,
        chain: state.playerLv % 2 === 0 ? "coin" : "energy",
        level: 2,
        justSpawned: true,
      };
    }

    leveledUp = true;
    showLevelUpBanner(state.playerLv, rewardCoins, rewardEnergy);
  }

  if (leveledUp) {
    sfx.serve();
  }
}

// 생성기 작동
function triggerGenerator(cellIdx, clientX, clientY) {
  const gen = state.board[cellIdx];
  if (!gen || !gen.isGenerator) return;

  if (state.energy < 1) {
    sfx.warn();
    floatText("⚡ 에너지가 부족합니다! 상단 + 버튼으로 충전하세요!", clientX, clientY, "#ef4444");
    return;
  }

  const targetIdx = findNearestEmptyCell(cellIdx);
  if (targetIdx === -1) {
    sfx.warn();
    floatText("보드가 가득 찼습니다! 재료를 합치거나 보관함에 넣으세요!", clientX, clientY, "#f59e0b");
    return;
  }

  state.energy -= 1;
  sfx.spawn();

  const chDef = CHAINS[gen.chain];
  let spawnChain = gen.chain;
  let spawnLv = Math.random() < 0.18 ? 2 : 1;

  if (chDef.rareDropChain && Math.random() < chDef.rareChance) {
    spawnChain = chDef.rareDropChain;
    spawnLv = 1;
  }

  state.board[targetIdx] = {
    uid: newUid(),
    state: "active",
    isGenerator: false,
    chain: spawnChain,
    level: spawnLv,
    justSpawned: true,
  };

  renderAll();
}

function crackAdjacentCrates(centerIdx) {
  const r = Math.floor(centerIdx / COLS);
  const c = centerIdx % COLS;
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      const nIdx = nr * COLS + nc;
      const neighbor = state.board[nIdx];
      if (neighbor && neighbor.state === "crate") {
        neighbor.state = "cobweb";
        neighbor.justSpawned = true;
      }
    }
  }
}

// 드래그 앤 드롭 합치기 & 이종 재료 조합(Cross-Chain Combination) 실행!
function executeBoardDrop(srcIdx, dstIdx, clientX, clientY) {
  if (srcIdx === null || dstIdx === null || srcIdx === dstIdx) return;
  const src = state.board[srcIdx];
  const dst = state.board[dstIdx];
  if (!src || src.state !== "active") return;

  // 1. 빈 칸으로 이동
  if (!dst) {
    state.board[dstIdx] = src;
    state.board[srcIdx] = null;
    state.selectedIdx = dstIdx;
    sfx.tap();
    renderAll();
    return;
  }

  if (dst.state === "crate") {
    sfx.warn();
    floatText("📦 봉인 상자는 주변 거미줄 타일을 합치면 열립니다!", clientX, clientY, "#fbbf24");
    return;
  }

  // 2. 이종 재료 조합 레시피(Cross-Chain Combination) 체크!
  const crossResult = findCrossRecipe(src, dst);
  if (crossResult) {
    const wasCobweb = dst.state === "cobweb";
    state.board[srcIdx] = null;
    state.board[dstIdx] = {
      uid: newUid(),
      state: "active",
      isGenerator: false,
      chain: crossResult.chain,
      level: crossResult.level,
      justSpawned: true,
    };
    if (wasCobweb) crackAdjacentCrates(dstIdx);

    const resMeta = getItemMeta(crossResult.chain, crossResult.level);
    sfx.merge(4, true);
    gainXP(12);
    state.selectedIdx = dstIdx;
    floatText(`⚗️ 스페셜 조합 완성! [${resMeta.name}]`, clientX, clientY, "#38bdf8");
    renderAll();
    return;
  }

  // 3. 동일 아이템 레벨업 합치기 (Merge)
  const meta = getItemMeta(src.chain, src.level);
  if (
    !src.isGenerator &&
    !dst.isGenerator &&
    src.chain === dst.chain &&
    src.level === dst.level &&
    src.level < meta.maxLv
  ) {
    const nextLv = src.level + 1;
    const nextMeta = getItemMeta(src.chain, nextLv);
    const wasCobweb = dst.state === "cobweb";

    state.board[srcIdx] = null;
    state.board[dstIdx] = {
      uid: newUid(),
      state: "active",
      isGenerator: false,
      chain: src.chain,
      level: nextLv,
      justSpawned: true,
    };

    if (wasCobweb) {
      crackAdjacentCrates(dstIdx);
      floatText(`🕸️ 봉인 해제 & [${nextMeta.name}]!`, clientX, clientY, "#10b981");
    } else {
      floatText(`✨ ${nextMeta.name} (Lv.${nextLv})`, clientX, clientY, "#fbbf24");
    }

    // Lv.4 이상 달성 시 보너스 주화나 에너지 드롭
    if (nextLv >= 4 && Math.random() < 0.65) {
      const bonusCell = findNearestEmptyCell(dstIdx);
      if (bonusCell !== -1) {
        state.board[bonusCell] = {
          uid: newUid(),
          state: "active",
          isGenerator: false,
          chain: Math.random() < 0.7 ? "coin" : "energy",
          level: 1,
          justSpawned: true,
        };
      }
    }

    sfx.merge(nextLv, false);
    gainXP(5);
    state.selectedIdx = dstIdx;
    renderAll();
    return;
  }

  // 4. 일반 활성 아이템끼리 자리 교체
  if (dst.state === "active") {
    state.board[dstIdx] = src;
    state.board[srcIdx] = dst;
    state.selectedIdx = dstIdx;
    sfx.tap();
    renderAll();
  } else {
    sfx.warn();
    floatText("🕸️ 같은 재료(또는 조합 레시피 재료)를 드래그해야 합쳐집니다!", clientX, clientY, "#94a3b8");
  }
}

function collectBoardItem(cellIdx, clientX, clientY) {
  const it = state.board[cellIdx];
  if (!it || it.state !== "active") return;
  const meta = getItemMeta(it.chain, it.level);
  if (!meta.isCollectible) return;

  state.board[cellIdx] = null;
  if (state.selectedIdx === cellIdx) state.selectedIdx = null;

  if (meta.rewardType === "coins") {
    state.coins += meta.amount;
    sfx.serve();
    floatText(`+${meta.amount}🪙 획득!`, clientX, clientY, "#fbbf24");
  } else {
    state.energy = Math.min(200, state.energy + meta.amount);
    sfx.serve();
    floatText(`+${meta.amount}⚡ 충전!`, clientX, clientY, "#38bdf8");
  }
  renderAll();
}

// 포인터 드래그 엔진
function setupPointerDragEngine() {
  const gridEl = document.getElementById("board-grid");

  gridEl.addEventListener("pointerdown", (e) => {
    const cellEl = e.target.closest(".gh-cell");
    if (!cellEl) return;
    const idx = parseInt(cellEl.dataset.index, 10);
    const item = state.board[idx];
    if (!item) {
      state.selectedIdx = null;
      renderAll();
      return;
    }

    drag.active = true;
    drag.isDragging = false;
    drag.sourceIdx = idx;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.hoverIdx = null;
  });

  window.addEventListener("pointermove", (e) => {
    if (!drag.active || drag.sourceIdx === null) return;
    const item = state.board[drag.sourceIdx];
    if (!item || item.state !== "active") return;

    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (!drag.isDragging && dist >= 7) {
      drag.isDragging = true;
      state.selectedIdx = drag.sourceIdx;
      createDragGhost(item, e.clientX, e.clientY);
      highlightCompatibleTargets(item);
    }

    if (drag.isDragging && drag.ghostEl) {
      drag.ghostEl.style.left = `${e.clientX}px`;
      drag.ghostEl.style.top = `${e.clientY}px`;

      const underEl = document.elementFromPoint(e.clientX, e.clientY);
      const cellEl = underEl ? underEl.closest(".gh-cell") : null;
      const newHover = cellEl ? parseInt(cellEl.dataset.index, 10) : null;

      if (newHover !== drag.hoverIdx) {
        document.querySelectorAll(".gh-cell.cell-drop-target").forEach((el) => el.classList.remove("cell-drop-target"));
        drag.hoverIdx = newHover;
        if (cellEl) cellEl.classList.add("cell-drop-target");
      }
    }
  });

  const endDrag = (e) => {
    if (!drag.active) return;
    const srcIdx = drag.sourceIdx;
    const wasDragging = drag.isDragging;
    const dstIdx = drag.hoverIdx;

    cleanupDragVisuals();
    drag.active = false;
    drag.isDragging = false;
    drag.sourceIdx = null;
    drag.hoverIdx = null;

    if (wasDragging) {
      if (dstIdx !== null && dstIdx !== srcIdx) {
        executeBoardDrop(srcIdx, dstIdx, e.clientX, e.clientY);
      } else {
        renderAll();
      }
    } else {
      handleCellTap(srcIdx, e.clientX, e.clientY);
    }
  };

  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

function handleCellTap(idx, clientX, clientY) {
  const item = state.board[idx];
  if (!item) return;

  const now = Date.now();
  const isDoubleTap = state.lastTapCell === idx && now - state.lastTapTime < 350;
  state.lastTapCell = idx;
  state.lastTapTime = now;

  if (item.isGenerator && item.state === "active") {
    state.selectedIdx = idx;
    triggerGenerator(idx, clientX, clientY);
    return;
  }

  const meta = getItemMeta(item.chain, item.level);
  if (item.state === "active" && meta.isCollectible && (isDoubleTap || state.selectedIdx === idx)) {
    collectBoardItem(idx, clientX, clientY);
    return;
  }

  state.selectedIdx = idx;
  sfx.tap();
  renderAll();
}

function createDragGhost(item, x, y) {
  const layer = document.getElementById("drag-layer");
  layer.innerHTML = "";

  const srcTile = document.querySelector(`.gh-cell[data-index="${drag.sourceIdx}"] .gh-tile`);
  if (srcTile) srcTile.classList.add("dragging-source");

  const meta = getItemMeta(item.chain, item.level);
  const ghost = document.createElement("div");
  ghost.className = `gh-tile ${item.isGenerator ? "is-generator" : meta.css} drag-ghost`;
  const svgArt = GameSprites.getItemSVG(item.chain, item.level, item.isGenerator);
  const label = item.isGenerator ? CHAINS[item.chain].generator.name : meta.name;

  ghost.innerHTML = `
    <div class="tile-svg-wrap">${svgArt}</div>
    <span class="tile-label">${label}</span>
  `;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  layer.appendChild(ghost);
  drag.ghostEl = ghost;
}

// 드래그 시작 시 같은 레벨 합치기 대상(분홍) & 이종 조합 레시피 대상(하늘색 ⚗️조합!) 동시 하이라이트!
function highlightCompatibleTargets(dragItem) {
  if (dragItem.isGenerator) return;
  const meta = getItemMeta(dragItem.chain, dragItem.level);

  document.querySelectorAll(".gh-cell").forEach((cellEl) => {
    const idx = parseInt(cellEl.dataset.index, 10);
    if (idx === drag.sourceIdx) return;
    const target = state.board[idx];
    if (!target || target.state === "crate" || target.isGenerator) return;

    // 1. 동일 아이템 합치기 가능
    if (target.chain === dragItem.chain && target.level === dragItem.level && dragItem.level < meta.maxLv) {
      cellEl.classList.add("cell-merge-hint");
    }
    // 2. 이종 재료 조합(Cross-Combination) 가능
    else if (findCrossRecipe(dragItem, target) !== null) {
      cellEl.classList.add("cell-combo-hint");
    }
  });
}

function cleanupDragVisuals() {
  document.getElementById("drag-layer").innerHTML = "";
  drag.ghostEl = null;
  document.querySelectorAll(".gh-cell").forEach((el) => {
    el.classList.remove("cell-merge-hint", "cell-combo-hint", "cell-drop-target");
  });
}

// 자동 DB 저장 (IndexedDB + LocalStorage)
let saveIndicatorTimer = null;
function triggerAutoSave() {
  if (!state.isLoaded || !window.GameDB) return;
  const roomState = window.Interior3DEngine ? Interior3DEngine.exportRoomsState() : null;
  const payload = {
    playerLv: state.playerLv,
    xp: state.xp,
    maxEnergy: state.maxEnergy,
    energy: state.energy,
    coins: state.coins,
    stars: state.stars,
    board: state.board,
    bag: state.bag,
    orders: state.orders,
    interiorRooms: roomState ? roomState.rooms : null,
    currentThemeKey: roomState ? roomState.currentThemeKey : "alchemy",
  };
  GameDB.saveProgress(payload);

  const ind = document.getElementById("save-status-indicator");
  if (ind) {
    ind.textContent = "💾 DB 자동저장됨";
    ind.style.opacity = "1";
    if (saveIndicatorTimer) clearTimeout(saveIndicatorTimer);
    saveIndicatorTimer = setTimeout(() => {
      ind.style.opacity = "0.65";
    }, 1200);
  }
}

// 전체 UI 렌더링
function renderAll() {
  updateTopBarUI();
  updateRoomStatusUI();
  const { wantedBoardUids, orderStatus } = computeWantedMap();
  renderOrdersUI(orderStatus);
  renderBoardUI(wantedBoardUids);
  renderInspectorUI();
  document.getElementById("bag-count").textContent = `${state.bag.length}/6`;
  if (window.Interior3DEngine) {
    Interior3DEngine.updatePinsDOM();
  }
  triggerAutoSave();
}

function updateTopBarUI() {
  document.getElementById("player-lv").textContent = state.playerLv;
  const reqXP = getRequiredXP(state.playerLv);
  const xpPct = Math.min(100, Math.round((state.xp / reqXP) * 100));
  const xpTextEl = document.getElementById("xp-text");
  const xpFillEl = document.getElementById("xp-fill");
  if (xpTextEl) xpTextEl.textContent = `${state.xp}/${reqXP} XP`;
  if (xpFillEl) xpFillEl.style.width = `${xpPct}%`;

  document.getElementById("res-energy").textContent = state.energy;
  document.getElementById("energy-timer").textContent =
    state.energy >= state.maxEnergy ? `MAX(${state.maxEnergy})` : `${state.energyCountdown}s`;
  document.getElementById("res-coins").textContent = state.coins;
  document.getElementById("res-stars").textContent = state.stars;
}

function updateRoomStatusUI() {
  if (!window.Interior3DEngine) return;
  const stats = Interior3DEngine.getProgressStats();
  document.getElementById("room-title-label").textContent = stats.themeTitle;
  document.getElementById("room-prog-badge").textContent = `${stats.done} / ${stats.total} 복구됨`;
}

function renderOrdersUI(orderStatus) {
  const strip = document.getElementById("orders-strip");
  strip.innerHTML = "";

  state.orders.forEach((ord, idx) => {
    const st = orderStatus[idx];
    const card = document.createElement("div");
    card.className = `gh-order-card ${st.allReady ? "order-complete" : ""}`;

    const reqBoxesHtml = ord.reqs
      .map((req, rIdx) => {
        const meta = getItemMeta(req.chain, req.level);
        const fulfilled = st.reqFulfilled[rIdx];
        const svgArt = GameSprites.getItemSVG(req.chain, req.level, false);
        return `
          <div class="order-req-box ${fulfilled ? "fulfilled" : ""}" title="${meta.name} (Lv.${req.level})">
            ${fulfilled ? '<span class="req-check">✔</span>' : ""}
            <div class="order-req-svg">${svgArt}</div>
            <span class="req-lv">${req.chain === "combo" ? "조합" : "Lv." + req.level}</span>
          </div>
        `;
      })
      .join("");

    card.innerHTML = `
      <div class="order-cust-row">
        <div class="cust-avatar-wrap">
          <div class="cust-avatar">${ord.customer.face}</div>
          <div class="cust-name">${ord.customer.name}</div>
        </div>
        <span class="order-reward-tag">+${ord.coins}🪙 +${ord.stars}🌟</span>
      </div>
      <div class="order-items-row">
        <div class="order-req-list">${reqBoxesHtml}</div>
        ${st.allReady ? `<button class="gh-serve-btn">완성!</button>` : ""}
      </div>
    `;

    const serveBtn = card.querySelector(".gh-serve-btn");
    if (serveBtn) {
      serveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        serveOrder(idx, e);
      });
    }

    strip.appendChild(card);
  });
}

function renderBoardUI(wantedBoardUids) {
  const gridEl = document.getElementById("board-grid");
  gridEl.innerHTML = "";

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const isAlt = (r + c) % 2 === 1;
    const item = state.board[i];
    const isWanted = item && wantedBoardUids.has(item.uid);

    const cell = document.createElement("div");
    cell.className = `gh-cell ${isAlt ? "cell-alt" : ""} ${isWanted ? "cell-wanted" : ""} ${
      state.selectedIdx === i ? "cell-selected" : ""
    }`;
    cell.dataset.index = i;

    if (item) {
      const tile = document.createElement("div");

      if (item.state === "crate") {
        tile.className = `gh-tile is-crate ${item.justSpawned ? "pop-spawn" : ""}`;
        tile.innerHTML = `
          <div class="tile-svg-wrap">${GameSprites.getCrateSVG()}</div>
          <span class="tile-label">봉인 상자</span>
        `;
      } else if (item.isGenerator) {
        const genInfo = CHAINS[item.chain].generator;
        tile.className = `gh-tile is-generator ${item.justSpawned ? "pop-spawn" : ""}`;
        tile.innerHTML = `
          <div class="tile-svg-wrap">${GameSprites.getItemSVG(item.chain, 1, true)}</div>
          <span class="tile-label">${genInfo.name}</span>
          <span class="gen-bolt-badge">⚡</span>
        `;
      } else {
        const meta = getItemMeta(item.chain, item.level);
        tile.className = `gh-tile ${meta.css} ${item.state === "cobweb" ? "is-cobweb" : ""} ${
          item.justSpawned ? "pop-spawn" : ""
        }`;
        tile.innerHTML = `
          ${isWanted ? '<span class="wanted-check-badge">✔</span>' : ""}
          <div class="tile-svg-wrap">${GameSprites.getItemSVG(item.chain, item.level, false)}</div>
          <span class="tile-label">${meta.name}</span>
          <span class="tile-lv-pill">${item.chain === "combo" ? "★" : "Lv." + item.level}</span>
          ${item.state === "cobweb" ? '<div class="cobweb-net">🕸️</div>' : ""}
        `;
      }

      item.justSpawned = false;
      cell.appendChild(tile);
    }

    gridEl.appendChild(cell);
  }
}

function renderInspectorUI() {
  const iconEl = document.getElementById("insp-icon");
  const nameEl = document.getElementById("insp-name");
  const lvEl = document.getElementById("insp-lv");
  const descEl = document.getElementById("insp-desc");
  const actionsEl = document.getElementById("insp-actions");
  actionsEl.innerHTML = "";

  const item = state.selectedIdx !== null ? state.board[state.selectedIdx] : null;
  if (!item) {
    iconEl.innerHTML = GameSprites.getItemSVG("potion", 3, false);
    nameEl.textContent = "타일을 탭하거나 드래그해 조합하세요";
    lvEl.textContent = "안내";
    descEl.textContent = "5종의 생성기(⚡)에서 재료를 뽑아 합치고, 위쪽 3D 공간의 가구 핀(🔨)을 눌러 인테리어를 완성하세요!";
    return;
  }

  if (item.state === "crate") {
    iconEl.innerHTML = GameSprites.getCrateSVG();
    nameEl.textContent = "봉인된 고대 상자";
    lvEl.textContent = "잠김";
    descEl.textContent = "인접한 거미줄(🕸️) 타일을 드래그해 합치면 상자가 깨지며 새로운 재료가 드러납니다.";
    return;
  }

  if (item.isGenerator) {
    const gen = CHAINS[item.chain].generator;
    iconEl.innerHTML = GameSprites.getItemSVG(item.chain, 1, true);
    nameEl.textContent = gen.name;
    lvEl.textContent = "생성기";
    descEl.textContent = gen.desc;

    const btn = document.createElement("button");
    btn.className = "insp-btn spawn-btn";
    btn.textContent = "⚡ 재료 생성";
    btn.addEventListener("click", (e) => triggerGenerator(state.selectedIdx, e.clientX, e.clientY));
    actionsEl.appendChild(btn);
    return;
  }

  const meta = getItemMeta(item.chain, item.level);
  iconEl.innerHTML = GameSprites.getItemSVG(item.chain, item.level, false);
  nameEl.textContent = meta.name;
  lvEl.textContent = item.state === "cobweb" ? `Lv.${item.level} (거미줄)` : `Lv.${item.level}/${meta.maxLv}`;

  if (item.state === "cobweb") {
    descEl.textContent = "같은 레벨의 활성 재료를 드래그해 합치거나 좌측 [🕸️해제] 버튼으로 즉시 풀 수 있습니다.";
    return;
  }

  if (meta.isCollectible) {
    descEl.textContent = "탭하여 즉시 획득하거나, 같은 단계끼리 합쳐 최대 Lv.3 보상으로 키우세요!";
    const colBtn = document.createElement("button");
    colBtn.className = "insp-btn sell-btn";
    colBtn.textContent = "즉시 수집";
    colBtn.addEventListener("click", (e) => collectBoardItem(state.selectedIdx, e.clientX, e.clientY));
    actionsEl.appendChild(colBtn);
    return;
  }

  const crossHint = CROSS_RECIPES.find(
    (r) =>
      (r.a.chain === item.chain && r.a.level === item.level) ||
      (r.b.chain === item.chain && r.b.level === item.level)
  );
  if (crossHint) {
    const partner =
      crossHint.a.chain === item.chain && crossHint.a.level === item.level ? crossHint.b : crossHint.a;
    const partnerMeta = getItemMeta(partner.chain, partner.level);
    const resMeta = getItemMeta(crossHint.result.chain, crossHint.result.level);
    descEl.textContent = `⚗️조합 팁: [${partnerMeta.name} Lv.${partner.level}]와 합치면 스페셜 [${resMeta.name}] 탄생!`;
  } else if (meta.recipeText) {
    descEl.textContent = `조합식: ${meta.recipeText}`;
  } else {
    descEl.textContent = `${meta.chainName} · 같은 재료끼리 드래그하여 상위 단계로 합치세요.`;
  }

  const bagBtn = document.createElement("button");
  bagBtn.className = "insp-btn store-btn";
  bagBtn.textContent = "🎒보관";
  bagBtn.addEventListener("click", (e) => {
    if (state.bag.length >= 6) {
      sfx.warn();
      floatText("보관함이 가득 찼습니다!", e.clientX, e.clientY, "#ef4444");
      return;
    }
    state.bag.push(item);
    state.board[state.selectedIdx] = null;
    state.selectedIdx = null;
    sfx.tap();
    renderAll();
  });
  actionsEl.appendChild(bagBtn);

  const sellBtn = document.createElement("button");
  sellBtn.className = "insp-btn sell-btn";
  sellBtn.textContent = `+${meta.sell}🪙판매`;
  sellBtn.addEventListener("click", (e) => {
    state.coins += meta.sell;
    state.board[state.selectedIdx] = null;
    state.selectedIdx = null;
    sfx.tap();
    floatText(`+${meta.sell}🪙 판매`, e.clientX, e.clientY, "#fbbf24");
    renderAll();
  });
  actionsEl.appendChild(sellBtn);
}

// 플레이어 레벨 & 성장 보상 모달 렌더링
function renderLevelModal() {
  const body = document.getElementById("level-modal-body");
  if (!body) return;
  const reqXP = getRequiredXP(state.playerLv);
  const pct = Math.min(100, Math.round((state.xp / reqXP) * 100));

  let milestonesHtml = "";
  for (let lv = 2; lv <= Math.max(8, state.playerLv + 3); lv++) {
    const unlocked = state.playerLv >= lv;
    const maxCap = 100 + (lv - 1) * 10;
    const coinBonus = 40 * lv;
    milestonesHtml += `
      <div class="codex-card" style="display:flex;align-items:center;justify-content:space-between;background:${
        unlocked ? "#f3e8ff" : "#ffffff"
      };border-color:${unlocked ? "#a855f7" : "#cbd5e1"}">
        <div>
          <strong style="font-size:12.5px;color:#3b0764">👑 레벨 ${lv} 달성 혜택</strong>
          <p style="font-size:11px;color:#475569;margin-top:2px">
            최대 에너지 한도 <b>⚡${maxCap}</b> · 보상 <b>+${coinBonus}🪙 +30⚡ +1🌟 +선물상자</b>
          </p>
        </div>
        <span style="font-size:11px;font-weight:900;padding:4px 8px;border-radius:8px;background:${
          unlocked ? "#10b981" : "#e2e8f0"
        };color:${unlocked ? "#fff" : "#64748b"}">
          ${unlocked ? "✔ 달성완료" : `Lv.${lv}`}
        </span>
      </div>
    `;
  }

  body.innerHTML = `
    <div class="codex-card" style="background:linear-gradient(135deg,#3b0764,#5b21b6);color:#fff;border-color:#fde047">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <strong style="font-size:15px;color:#fde047">👑 현재 연금술사 레벨: Lv.${state.playerLv}</strong>
        <span style="font-size:12px;font-weight:800">${state.xp} / ${reqXP} XP (${pct}%)</span>
      </div>
      <div style="height:10px;background:rgba(0,0,0,0.4);border-radius:99px;overflow:hidden;margin-bottom:6px">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#38bdf8,#fde047)"></div>
      </div>
      <p style="font-size:11px;color:#e9d5ff">
        현재 최대 에너지 자동회복 한도: <b>⚡ ${state.maxEnergy}</b><br/>
        (재료를 합칠 때 +5 XP, 이종 조합 시 +12 XP, 손님 주문 완료 시 +25 XP, 3D 인테리어 시공 시 +35 XP 획득!)
      </p>
    </div>
    ${milestonesHtml}
  `;
}

// 도감 모달 (일반 체인 + 이종 조합 레시피 안내)
function renderCodexModal() {
  const body = document.getElementById("codex-body");
  body.innerHTML = "";

  const comboCard = document.createElement("div");
  comboCard.className = "codex-card";
  comboCard.style.background = "#fefce8";
  comboCard.style.borderColor = "#f59e0b";
  comboCard.innerHTML = `
    <h4>⚗️ 스페셜 이종 재료 조합(Cross-Combination) 레시피</h4>
    <p style="font-size:11px;color:#475569;margin-bottom:6px">서로 다른 체인의 특정 재료를 드래그해 겹치면 새로운 스페셜 메뉴가 조합됩니다!</p>
    <div style="display:flex;flex-direction:column;gap:4px;font-size:11.5px;font-weight:700;color:#1e293b">
      <div>1️⃣ 초급 마나물약(Lv.2) + 몽환 달버섯(Lv.2) ➔ 🌟 특제 활력비약</div>
      <div>2️⃣ 버터 크루아상(Lv.2) + 에스프레소(Lv.3) ➔ 🍽️ 모닝 브런치세트</div>
      <div>3️⃣ 봉인 주문서(Lv.2) + 사파이어(Lv.2) ➔ 🔮 마력 각인룬스톤</div>
    </div>
  `;
  body.appendChild(comboCard);

  for (const [key, ch] of Object.entries(CHAINS)) {
    if (key === "combo") continue;
    const card = document.createElement("div");
    card.className = "codex-card";
    const flowHtml = ch.items
      .map(
        (it, idx) => `
        <div class="codex-node">
          <div class="codex-svg-mini">${GameSprites.getItemSVG(key, it.level, false)}</div>
          <strong style="font-size:9.5px">${it.name}</strong>
          <small style="font-size:8.5px;color:#64748b">Lv.${it.level}</small>
        </div>
        ${idx < ch.items.length - 1 ? '<span style="color:#94a3b8;font-weight:900">➔</span>' : ""}
      `
      )
      .join("");

    card.innerHTML = `
      <h4>${ch.name} ${ch.generator ? `(생성기: ${ch.generator.name})` : ""}</h4>
      <div class="codex-flow">${flowHtml}</div>
    `;
    body.appendChild(card);
  }
}

function renderBagModal() {
  const grid = document.getElementById("bag-grid");
  grid.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    const slot = document.createElement("div");
    slot.className = "bag-slot";
    const it = state.bag[i];
    if (it) {
      const meta = getItemMeta(it.chain, it.level);
      const tile = document.createElement("div");
      tile.className = `gh-tile ${meta.css}`;
      tile.style.width = "68px";
      tile.style.height = "62px";
      tile.innerHTML = `
        <div class="tile-svg-wrap">${GameSprites.getItemSVG(it.chain, it.level, false)}</div>
        <span class="tile-label">${meta.name}</span>
      `;
      slot.appendChild(tile);
      slot.addEventListener("click", (e) => {
        const emptyIdx = findNearestEmptyCell(27);
        if (emptyIdx === -1) {
          sfx.warn();
          floatText("보드에 빈 칸이 없습니다!", e.clientX, e.clientY, "#ef4444");
          return;
        }
        state.bag.splice(i, 1);
        state.board[emptyIdx] = it;
        state.selectedIdx = emptyIdx;
        sfx.tap();
        renderBagModal();
        renderAll();
      });
    } else {
      slot.innerHTML = `<span style="color:#94a3b8;font-size:11px">빈 슬롯</span>`;
    }
    grid.appendChild(slot);
  }
}

function setDialogue(speaker, text) {
  document.getElementById("speaker-tag").textContent = speaker + ":";
  document.getElementById("dialogue-text").textContent = text;
}

// 동시에 여러 플로팅 텍스트가 뜰 때 세로 위치를 자동으로 계단식 분리하여 절대 겹치지 않게 처리!
let activeFloatCount = 0;
function floatText(text, x, y, color = "#fbbf24") {
  const layer = document.getElementById("fx-layer");
  const el = document.createElement("div");
  el.className = "fx-float-text";
  el.textContent = text;
  el.style.color = color;

  const slotOffset = (activeFloatCount % 4) * 34;
  activeFloatCount++;

  const safeX = Math.max(110, Math.min(window.innerWidth - 110, x || window.innerWidth / 2));
  const safeY = Math.max(70, (y || 220) - 10 - slotOffset);

  el.style.left = `${safeX}px`;
  el.style.top = `${safeY}px`;
  layer.appendChild(el);

  setTimeout(() => {
    activeFloatCount = Math.max(0, activeFloatCount - 1);
    el.remove();
  }, 1050);
}

function bindUIEvents() {
  // 3D 테마 룸 전환 탭
  document.querySelectorAll(".theme-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".theme-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      sfx.tap();
      if (window.Interior3DEngine) {
        Interior3DEngine.switchTheme(tab.dataset.theme);
        updateRoomStatusUI();
        triggerAutoSave();
      }
    });
  });

  // 3D 인테리어 룸 확대/축소 버튼
  const expandBtn = document.getElementById("btn-expand-3d");
  expandBtn.addEventListener("click", () => {
    state.roomExpanded = !state.roomExpanded;
    const vp = document.getElementById("interior-viewport");
    vp.classList.toggle("expanded", state.roomExpanded);
    expandBtn.textContent = state.roomExpanded ? "🔽 룸 축소" : "🔍 룸 확대";
    if (window.Interior3DEngine) {
      Interior3DEngine.setExpandedView(state.roomExpanded);
    }
  });

  // 상단 별(인테리어) 버튼 클릭 시 다음 복구할 가구로 카메라 줌인!
  document.getElementById("btn-next-reno").addEventListener("click", () => {
    if (window.Interior3DEngine) {
      Interior3DEngine.triggerNextSpot();
    }
  });

  // 레벨 모달 오픈
  document.getElementById("btn-open-level").addEventListener("click", () => {
    renderLevelModal();
    document.getElementById("modal-level").classList.remove("hidden");
  });

  // 로컬 DB & 백업 모달 오픈
  document.getElementById("btn-open-db").addEventListener("click", async () => {
    if (window.GameDB) {
      const code = await GameDB.exportBackupString();
      document.getElementById("backup-code-box").value = code;
    }
    document.getElementById("modal-db").classList.remove("hidden");
  });

  document.getElementById("btn-export-save").addEventListener("click", async (e) => {
    if (!window.GameDB) return;
    triggerAutoSave();
    const code = await GameDB.exportBackupString();
    const box = document.getElementById("backup-code-box");
    box.value = code;
    box.select();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    sfx.serve();
    floatText("📤 백업 코드가 복사되었습니다!", e.clientX, e.clientY, "#10b981");
  });

  document.getElementById("btn-import-save").addEventListener("click", async (e) => {
    if (!window.GameDB) return;
    const box = document.getElementById("backup-code-box");
    const ok = await GameDB.importBackupString(box.value);
    if (ok) {
      sfx.serve();
      floatText("📥 백업 데이터 복원 성공! 새로고침합니다...", e.clientX, e.clientY, "#10b981");
      setTimeout(() => window.location.reload(), 600);
    } else {
      sfx.warn();
      floatText("⚠️ 올바른 백업 코드가 아닙니다!", e.clientX, e.clientY, "#ef4444");
    }
  });

  // 에너지 충전
  document.getElementById("btn-refill-energy").addEventListener("click", (e) => {
    state.energy = Math.min(state.maxEnergy + 100, state.energy + 45);
    sfx.serve();
    floatText("⚡ 에너지 +45 충전!", e.clientX, e.clientY, "#38bdf8");
    renderAll();
  });

  // 거미줄 즉시 해제 부스터
  document.getElementById("btn-unlock-web").addEventListener("click", (e) => {
    if (state.coins < 20) {
      sfx.warn();
      floatText("🪙 20코인이 필요합니다!", e.clientX, e.clientY, "#ef4444");
      return;
    }
    let targetIdx =
      state.selectedIdx !== null &&
      state.board[state.selectedIdx] &&
      state.board[state.selectedIdx].state === "cobweb"
        ? state.selectedIdx
        : state.board.findIndex((it) => it && it.state === "cobweb");

    if (targetIdx === -1) {
      sfx.warn();
      floatText("해제할 거미줄 타일이 없습니다!", e.clientX, e.clientY, "#94a3b8");
      return;
    }
    state.coins -= 20;
    state.board[targetIdx].state = "active";
    crackAdjacentCrates(targetIdx);
    state.selectedIdx = targetIdx;
    sfx.merge(3, true);
    floatText("🕸️ 거미줄 즉시 해제!", e.clientX, e.clientY, "#10b981");
    renderAll();
  });

  // 보드 정렬
  document.getElementById("btn-sort-board").addEventListener("click", (e) => {
    const indices = [];
    const items = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const it = state.board[i];
      if (!it) {
        indices.push(i);
      } else if (it.state === "active" && !it.isGenerator) {
        indices.push(i);
        items.push(it);
      }
    }
    items.sort((a, b) => (a.chain !== b.chain ? a.chain.localeCompare(b.chain) : b.level - a.level));
    for (let k = 0; k < indices.length; k++) {
      state.board[indices[k]] = items[k] || null;
    }
    sfx.tap();
    floatText("🧹 재료 정렬 완료!", e.clientX, e.clientY, "#38bdf8");
    renderAll();
  });

  // 사운드 토글
  const sndBtn = document.getElementById("btn-toggle-sound");
  sndBtn.addEventListener("click", () => {
    sfx.enabled = !sfx.enabled;
    sndBtn.textContent = sfx.enabled ? "🔊" : "🔇";
  });

  // 모달 열기/닫기
  document.getElementById("btn-open-codex").addEventListener("click", () => {
    document.getElementById("modal-codex").classList.remove("hidden");
  });
  document.getElementById("btn-open-bag").addEventListener("click", () => {
    renderBagModal();
    document.getElementById("modal-bag").classList.remove("hidden");
  });
  document.querySelectorAll(".gh-close-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.close).classList.add("hidden");
    });
  });
}

window.addEventListener("DOMContentLoaded", init);
