// game.js — 크라운 & 가십: 마녀의 성 3D 인테리어 빌딩 & 멀티 체인 합성(Merge) 게임
// Galaxy S25 최적화 2-Screen 구조 (🏰 마녀의 성 꾸미기 화면 ↔ 🔮 아이콘 합성 보드 페이지),
// 퀘스트별 스토리 컷신, 전세계 명절 기준 기한 한정 팝업 이벤트, 5분당 1개(최대 100개) 번개(⚡) 경제 시스템

const COLS = 7;
const ROWS = 8;
const TOTAL_CELLS = COLS * ROWS; // 56칸

// Gossip Harbor 번개(⚡) 자연 충전 상한 및 주기 (100개 상한, 5분=300초당 1개 충전)
const NATURAL_ENERGY_CAP = 100;
const ENERGY_REGEN_SEC = 300; // 5분 (300초)

const CHAINS = {
  potion: {
    id: "potion",
    name: "비전 물약 체인",
    css: "chain-potion",
    generator: { name: "마법 가마솥", desc: "탭하면 물약 재료(⚡1)와 22% 확률로 희귀 보석 원석을 생성합니다." },
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
    name: "⚡ 번개(Lightning) 경제 체인",
    css: "chain-energy",
    isCollectible: true,
    items: [
      { level: 1, name: "작은 번개 조각 (+5⚡)", rewardType: "energy", amount: 5 },
      { level: 2, name: "번개 에너지 구슬 (+15⚡)", rewardType: "energy", amount: 15 },
      { level: 3, name: "번개 폭풍 결정 (+40⚡)", rewardType: "energy", amount: 40 },
      { level: 4, name: "로얄 번개 코어 (+100⚡)", rewardType: "energy", amount: 100 },
    ],
  },
};

// 전세계 공통 명절 기준 기한 한정 팝업 이벤트 정의 (당일 5일 전 ~ 당일 24:00 종료)
const HOLIDAY_EVENTS = [
  {
    id: "halloween",
    icon: "🎃",
    name: "할로윈 마법 호박제",
    month: 10,
    day: 31, // 10월 26일(5일 전) ~ 10월 31일 당일 끝까지
    periodLabel: "할로윈 5일 전(10/26) ~ 당일(10/31 24:00)",
    genName: "호박 마법 가마솥",
    items: [
      { level: 1, name: "유령 사탕", energyReward: 6, mainChain: "potion", mainLv: 1 },
      { level: 2, name: "잭오랜턴 호박", energyReward: 15, mainChain: "herb", mainLv: 2 },
      { level: 3, name: "마녀 고깔모자", energyReward: 35, mainChain: "bakery", mainLv: 3 },
      { level: 4, name: "영혼 호박 등불", energyReward: 65, mainChain: "grimoire", mainLv: 3 },
      { level: 5, name: "할로윈 호박왕관", energyReward: 120, mainChain: "gem", mainLv: 4 },
    ],
  },
  {
    id: "christmas",
    icon: "🎄",
    name: "크리스마스 성탄 마법제",
    month: 12,
    day: 25, // 12월 20일(5일 전) ~ 12월 25일 당일 끝까지
    periodLabel: "크리스마스 5일 전(12/20) ~ 당일(12/25 24:00)",
    genName: "성탄 선물 벽난로",
    items: [
      { level: 1, name: "민트 지팡이사탕", energyReward: 6, mainChain: "tea", mainLv: 1 },
      { level: 2, name: "진저브레드 쿠키", energyReward: 15, mainChain: "bakery", mainLv: 2 },
      { level: 3, name: "성탄 루돌프 방울", energyReward: 35, mainChain: "potion", mainLv: 3 },
      { level: 4, name: "눈꽃 오르골 등불", energyReward: 65, mainChain: "herb", mainLv: 3 },
      { level: 5, name: "산타의 황금왕관", energyReward: 120, mainChain: "gem", mainLv: 4 },
    ],
  },
  {
    id: "newyear",
    icon: "🧧",
    name: "신년 & 설날 복주머니 축제",
    month: 1,
    day: 1, // 12월 27일(5일 전) ~ 1월 1일 당일 끝까지
    periodLabel: "신년 5일 전(12/27) ~ 당일(01/01 24:00)",
    genName: "황금 복주머니 화로",
    items: [
      { level: 1, name: "행운 엽전사탕", energyReward: 6, mainChain: "potion", mainLv: 1 },
      { level: 2, name: "비단 복주머니", energyReward: 15, mainChain: "tea", mainLv: 2 },
      { level: 3, name: "청사초롱 등불", energyReward: 35, mainChain: "grimoire", mainLv: 3 },
      { level: 4, name: "일월오봉도 부적", energyReward: 65, mainChain: "bakery", mainLv: 3 },
      { level: 5, name: "태양의 신년왕관", energyReward: 120, mainChain: "gem", mainLv: 4 },
    ],
  },
  {
    id: "valentine",
    icon: "🍫",
    name: "발렌타인 로얄 쇼콜라제",
    month: 2,
    day: 14, // 2월 9일(5일 전) ~ 2월 14일 당일 끝까지
    periodLabel: "발렌타인 5일 전(02/09) ~ 당일(02/14 24:00)",
    genName: "로즈 쇼콜라 분수",
    items: [
      { level: 1, name: "하트 트러플", energyReward: 6, mainChain: "bakery", mainLv: 1 },
      { level: 2, name: "루비 프랄린", energyReward: 15, mainChain: "tea", mainLv: 2 },
      { level: 3, name: "큐피드 마카롱", energyReward: 35, mainChain: "herb", mainLv: 3 },
      { level: 4, name: "로즈 크리스탈함", energyReward: 65, mainChain: "potion", mainLv: 3 },
      { level: 5, name: "쇼콜라 여왕왕관", energyReward: 120, mainChain: "gem", mainLv: 4 },
    ],
  },
];

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
  { name: "퀸 (Quinn)", face: "🕵️‍♀️", line: "하버 오션카페와 마녀의 공방을 멋지게 리모델링해 봐요!" },
  { name: "루시안 공작", face: "🧛‍♂️", line: "특제 활력비약과 향긋한 홍차의 조합이 훌륭하군." },
  { name: "올리비아", face: "👧", line: "화덕 오븐에서 갓 구운 크루아상이랑 케이크 냄새가 너무 좋아요!" },
  { name: "해리슨", face: "🧔‍♂️", line: "별빛로드를 밝힐 마도서와 따뜻한 에스프레소 부탁하네!" },
  { name: "카르멘", face: "👩‍🎨", line: "[🏰 성으로 가기]를 눌러 마녀의 성 전체를 둘러보고 가구를 배치해 보세요!" },
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
  return "item_" + uidSeq++ + "_" + Math.floor(Math.random() * 1000);
}

const state = {
  activeScreen: "merge", // "merge" (합성 보드 화면) | "castle" (마녀의 성 꾸미기 화면)
  playerLv: 1,
  xp: 0,
  maxEnergy: NATURAL_ENERGY_CAP, // 자동 충전 최대치 100⚡ 고정
  energy: 100,
  energyCountdown: ENERGY_REGEN_SEC, // 300초(5분) 카운트다운
  coins: 350,
  stars: 4,
  selectedIdx: null,
  board: new Array(TOTAL_CELLS).fill(null),
  bag: [],
  orders: [],
  lastTapCell: null,
  lastTapTime: 0,
  isLoaded: false,
  // 명절 팝업 이벤트 상태 (5x5=25칸 미니 합성 보드)
  eventState: {
    activeHolidayId: "halloween",
    board: new Array(25).fill(null),
    selectedIdx: null,
    targetLv: 3,
    freeSpawns: 12,
    completedCount: 0,
  },
};

// 현재 진행 중인 스토리 컷신 상태
const cutsceneState = {
  active: false,
  spot: null,
  themeTitle: "",
  dialogues: [],
  stepIdx: 0,
  giveBonusOnFinish: false,
};

// 안드로이드 Chrome 공식 WebAPK 설치 프롬프트 저장
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

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
  initHolidayEventBoard();

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
  state.maxEnergy = NATURAL_ENERGY_CAP; // 자연 회복 상한 100⚡ 고정
  if (!state.eventState || !Array.isArray(state.eventState.board) || state.eventState.board.length !== 25) {
    initHolidayEventBoard();
  }
  state.isLoaded = true;

  bindUIEvents();
  setupPointerDragEngine();

  // Three.js 3D 아이소메트릭 마녀의 성 & 인테리어 엔진 초기화
  if (window.Interior3DEngine) {
    Interior3DEngine.init("three-canvas-mount", "three-pins-overlay", {
      getStars: () => state.stars,
      onSelectRoomFromMap: (themeKey) => {
        selectCastleThemeTab(themeKey);
      },
      onRenovate: (spot, wasAlreadyDone, currentThemeObj) => {
        if (!wasAlreadyDone) {
          state.stars = Math.max(0, state.stars - spot.cost);
          state.coins += 100;
          state.energy += 20;
          gainXP(35);
          floatText(`🎉 [${spot.name}] 시공 완료! +100🪙 +20⚡`, window.innerWidth / 2, 160, "#10b981");
        } else {
          floatText(`🎨 [${spot.name}] 스타일 변경 완료!`, window.innerWidth / 2, 160, "#c084fc");
        }
        sfx.serve();
        setDialogue("🔨 " + spot.name, spot.story);
        renderAll();

        // ★ Gossip Harbor 스타일: 퀘스트 완료 시 해당 퀘스트와 관련된 스토리 컷신 자동 실행!
        setTimeout(() => {
          openStoryCutscene(spot, currentThemeObj ? currentThemeObj.title : "🏰 마녀의 성", !wasAlreadyDone);
        }, 720);
      },
    });

    if (savedInterior && savedInterior.interiorRooms) {
      Interior3DEngine.importRoomsState(savedInterior.interiorRooms, savedInterior.currentThemeKey);
      const activeKey = savedInterior.currentThemeKey || "alchemy";
      document.querySelectorAll(".theme-tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.theme === activeKey);
      });
    }
  }

  renderAll();
  renderCodexModal();
  updateHolidayCountdowns();

  // 1초 주기로 번개(⚡) 5분(300초) 자동 충전 타이머 & 명절 이벤트 남은 시간 업데이트
  setInterval(() => {
    if (state.energy < NATURAL_ENERGY_CAP) {
      state.energyCountdown--;
      if (state.energyCountdown <= 0) {
        state.energy = Math.min(NATURAL_ENERGY_CAP, state.energy + 1);
        state.energyCountdown = ENERGY_REGEN_SEC;
        triggerAutoSave();
      }
    } else {
      state.energyCountdown = ENERGY_REGEN_SEC;
    }
    updateTopBarUI();
    updateHolidayCountdowns();
  }, 1000);
}

// 화면 전환 함수: "castle" (🏰 마녀의 성 꾸미기 화면) ↔ "merge" (🔮 아이콘 합성 보드 화면)
function switchScreen(targetScreen) {
  state.activeScreen = targetScreen;
  const castleView = document.getElementById("view-castle");
  const mergeView = document.getElementById("view-merge");

  if (targetScreen === "castle") {
    castleView.classList.remove("hidden");
    mergeView.classList.add("hidden");
    if (window.Interior3DEngine) {
      setTimeout(() => {
        Interior3DEngine.handleResize();
        Interior3DEngine.updatePinsDOM();
        updateCastleViewUI();
      }, 30);
    }
  } else {
    castleView.classList.add("hidden");
    mergeView.classList.remove("hidden");
  }
  sfx.tap();
  renderAll();
}

function selectCastleThemeTab(themeKey) {
  document.querySelectorAll(".theme-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.theme === themeKey);
  });
  if (window.Interior3DEngine) {
    Interior3DEngine.switchTheme(themeKey);
    updateCastleViewUI();
    triggerAutoSave();
  }
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

  // 중앙 오픈 공간에 5종류의 핵심 생성기 배치
  placeTile(2, 2, { isGenerator: true, chain: "potion", level: 1, state: "active" });
  placeTile(2, 4, { isGenerator: true, chain: "grimoire", level: 1, state: "active" });
  placeTile(3, 3, { isGenerator: true, chain: "herb", level: 1, state: "active" });
  placeTile(5, 2, { isGenerator: true, chain: "bakery", level: 1, state: "active" });
  placeTile(5, 4, { isGenerator: true, chain: "tea", level: 1, state: "active" });

  // 시작 재료 및 번개(⚡) 아이템 배치
  placeTile(2, 3, { isGenerator: false, chain: "potion", level: 1, state: "active" });
  placeTile(3, 2, { isGenerator: false, chain: "potion", level: 1, state: "active" });
  placeTile(3, 4, { isGenerator: false, chain: "herb", level: 2, state: "active" });
  placeTile(4, 2, { isGenerator: false, chain: "bakery", level: 2, state: "active" });
  placeTile(4, 4, { isGenerator: false, chain: "tea", level: 3, state: "active" });
  placeTile(4, 3, { isGenerator: false, chain: "energy", level: 1, state: "active" });

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
    createOrder(0, [{ chain: "combo", level: 2 }]),
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

  // 주문 완료 시 인게임 번개(⚡) 조각 보너스 드롭!
  const bonusCell = findNearestEmptyCell(27);
  if (bonusCell !== -1) {
    state.board[bonusCell] = {
      uid: newUid(),
      state: "active",
      isGenerator: false,
      chain: "energy",
      level: 1,
      justSpawned: true,
    };
  }

  setDialogue(ord.customer.face + " " + ord.customer.name, ord.customer.line);
  floatText(
    `🎉 주문 완료! +${ord.coins}🪙 +${ord.stars}🌟 +번개조각⚡`,
    event ? event.clientX : window.innerWidth / 2,
    event ? event.clientY : 160,
    "#10b981"
  );

  state.orders[orderIdx] = createOrder(orderIdx);
  renderAll();
}

// ============================================================================
// 🎬 Gossip Harbor 스타일 퀘스트 완료 스토리 컷신 엔진
// ============================================================================
function openStoryCutscene(spot, themeTitle, giveBonus = false) {
  const modal = document.getElementById("modal-story-cutscene");
  if (!modal || !spot) return;

  const lines =
    Array.isArray(spot.dialogues) && spot.dialogues.length > 0
      ? spot.dialogues
      : [{ speaker: "대마녀 셀레네", face: "🧙‍♀️", line: spot.story }];

  cutsceneState.active = true;
  cutsceneState.spot = spot;
  cutsceneState.themeTitle = themeTitle;
  cutsceneState.dialogues = lines;
  cutsceneState.stepIdx = 0;
  cutsceneState.giveBonusOnFinish = giveBonus;

  modal.classList.remove("hidden");
  renderCutsceneStep();
}

function renderCutsceneStep() {
  const d = cutsceneState.dialogues[cutsceneState.stepIdx];
  if (!d) return;

  document.getElementById("cutscene-zone-badge").textContent = cutsceneState.themeTitle;
  document.getElementById("cutscene-spot-name").textContent = `✨ [${cutsceneState.spot.name}] 스토리 에피소드`;
  document.getElementById("cutscene-avatar").textContent = d.face || "🧙‍♀️";
  document.getElementById("cutscene-speaker").textContent = d.speaker || "대마녀 셀레네";
  document.getElementById("cutscene-line").textContent = `"${d.line}"`;

  const total = cutsceneState.dialogues.length;
  const cur = cutsceneState.stepIdx + 1;
  document.getElementById("cutscene-step-indicator").textContent = `스토리 대화 ${cur} / ${total}`;

  const nextBtn = document.getElementById("btn-cutscene-next");
  if (cur < total) {
    nextBtn.textContent = "다음 대화 ▶";
  } else {
    nextBtn.textContent = cutsceneState.giveBonusOnFinish ? "스토리 완료 & +15⚡ 받기 ✔" : "스토리 닫기 ✔";
  }
}

function closeOrAdvanceCutscene(skipAll = false) {
  if (!cutsceneState.active) return;
  sfx.tap();

  if (!skipAll && cutsceneState.stepIdx < cutsceneState.dialogues.length - 1) {
    cutsceneState.stepIdx++;
    renderCutsceneStep();
    return;
  }

  document.getElementById("modal-story-cutscene").classList.add("hidden");
  if (cutsceneState.giveBonusOnFinish) {
    state.energy += 15;
    sfx.serve();
    floatText("🎬 퀘스트 스토리 감상 보상! +15⚡ 번개 획득!", window.innerWidth / 2, 180, "#38bdf8");
  }
  cutsceneState.active = false;
  renderAll();
}

// ============================================================================
// 🎃 전세계 공통 명절 기준 기한 한정 팝업 이벤트 엔진 (5x5 이벤트 합성 보드)
// ============================================================================
function getActiveHolidayConfig() {
  return HOLIDAY_EVENTS.find((h) => h.id === state.eventState.activeHolidayId) || HOLIDAY_EVENTS[0];
}

// 명절 당일 5일 전부터 당일 23:59:59까지의 남은 시간 계산
function getHolidayRemainingText(holiday) {
  const now = new Date();
  const year = now.getFullYear();
  const endOfHoliday = new Date(year, holiday.month - 1, holiday.day, 23, 59, 59);
  const startOfWindow = new Date(endOfHoliday.getTime() - 5 * 24 * 60 * 60 * 1000);

  const diffMs = endOfHoliday.getTime() - now.getTime();
  if (now >= startOfWindow && diffMs > 0) {
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diffMs / (1000 * 60)) % 60);
    const s = Math.floor((diffMs / 1000) % 60);
    return `진행중 · 남은시간 ${d}일 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  // 만약 해당 날짜 주간이 아닐 때도 상시 체험 가능하도록 5일 타이머 표시
  const cycleSec = 5 * 86400 - (Math.floor(Date.now() / 1000) % (5 * 86400));
  const d = Math.floor(cycleSec / 86400);
  const h = Math.floor((cycleSec % 86400) / 3600);
  const m = Math.floor((cycleSec % 3600) / 60);
  const s = cycleSec % 60;
  return `명절 이벤트 가동중 · 종료까지 ${d}일 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateHolidayCountdowns() {
  const h = getActiveHolidayConfig();
  const remText = getHolidayRemainingText(h);

  const bannerTitle = document.getElementById("banner-event-title");
  const bannerTimer = document.getElementById("banner-event-timer");
  const topBtn = document.getElementById("btn-open-event");
  if (bannerTitle) bannerTitle.textContent = `${h.icon} ${h.name} 진행중!`;
  if (bannerTimer) bannerTimer.textContent = remText.split("·")[1] ? remText.split("·")[1].trim() : "D-5";
  if (topBtn) topBtn.textContent = h.icon;

  const modalPeriod = document.getElementById("event-modal-period");
  if (modalPeriod) {
    modalPeriod.textContent = `기간: ${h.periodLabel} · ${remText}`;
  }
}

function initHolidayEventBoard() {
  const b = new Array(25).fill(null);
  // 중앙(12번 칸)에 명절 이벤트 생성기 배치
  b[12] = { uid: newUid(), isGenerator: true, level: 1 };
  // 시작 이벤트 아이템 배치
  b[6] = { uid: newUid(), isGenerator: false, level: 1 };
  b[7] = { uid: newUid(), isGenerator: false, level: 1 };
  b[11] = { uid: newUid(), isGenerator: false, level: 2 };
  b[13] = { uid: newUid(), isGenerator: false, level: 2 };
  state.eventState.board = b;
  state.eventState.selectedIdx = 6;
  state.eventState.targetLv = 3;
  state.eventState.freeSpawns = 12;
}

function renderHolidayEventModal() {
  const h = getActiveHolidayConfig();
  document.getElementById("event-modal-title").textContent = `${h.icon} ${h.name} (기한 한정 이벤트)`;
  updateHolidayCountdowns();

  // 상단 명절 탭 렌더링
  const schedBar = document.getElementById("holiday-schedule-bar");
  schedBar.innerHTML = HOLIDAY_EVENTS.map(
    (ev) => `
    <button class="holiday-chip ${ev.id === h.id ? "active" : ""}" data-ev="${ev.id}">
      ${ev.icon} ${ev.name}
    </button>
  `
  ).join("");

  schedBar.querySelectorAll(".holiday-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.eventState.activeHolidayId = btn.dataset.ev;
      sfx.tap();
      renderHolidayEventModal();
      renderAll();
    });
  });

  // 미션 타겟 표시
  const targetLv = state.eventState.targetLv || 3;
  const targetMeta = h.items[Math.min(targetLv - 1, h.items.length - 1)];
  document.getElementById("event-mission-title").textContent =
    `🎯 명절 미션: [${targetMeta.name} (Lv.${targetLv})] 합성하기`;
  document.getElementById("ev-req-svg").innerHTML = GameSprites.getEventSVG(targetLv, false);

  const hasTargetOnBoard = state.eventState.board.some((it) => it && !it.isGenerator && it.level >= targetLv);
  const claimBtn = document.getElementById("btn-claim-event-order");
  claimBtn.disabled = !hasTargetOnBoard;
  const rewardBolt = targetLv * 15;
  claimBtn.innerHTML = hasTargetOnBoard
    ? `🎁 미션 완료!<br/><small>+${rewardBolt}⚡ &amp; 본게임 재료</small>`
    : `Lv.${targetLv} 필요<br/><small>+${rewardBolt}⚡ &amp; 본게임 재료</small>`;

  // 무료 소환 횟수 표시
  document.getElementById("ev-free-spawns").textContent =
    state.eventState.freeSpawns > 0 ? `(무료 ${state.eventState.freeSpawns}회)` : `(⚡1 소모)`;

  // 5x5 이벤트 보드 렌더링
  const grid = document.getElementById("event-board-grid");
  grid.innerHTML = "";

  for (let i = 0; i < 25; i++) {
    const cell = document.createElement("div");
    cell.className = `ev-cell ${state.eventState.selectedIdx === i ? "ev-selected" : ""}`;
    const it = state.eventState.board[i];

    if (it) {
      const tile = document.createElement("div");
      if (it.isGenerator) {
        tile.className = "gh-tile is-generator";
        tile.innerHTML = `
          <div class="tile-svg-wrap">${GameSprites.getEventSVG(1, true)}</div>
          <span class="tile-label">${h.genName}</span>
          <span class="gen-bolt-badge">${h.icon}</span>
        `;
      } else {
        const meta = h.items[Math.min(it.level - 1, h.items.length - 1)];
        tile.className = "gh-tile chain-grimoire";
        tile.innerHTML = `
          <div class="tile-svg-wrap">${GameSprites.getEventSVG(it.level, false)}</div>
          <span class="tile-label">${meta.name}</span>
          <span class="tile-lv-pill">Lv.${it.level}</span>
        `;
      }
      cell.appendChild(tile);
    }

    cell.addEventListener("click", (e) => handleEventCellClick(i, e));
    grid.appendChild(cell);
  }
}

function handleEventCellClick(idx, e) {
  const b = state.eventState.board;
  const clicked = b[idx];
  const prevIdx = state.eventState.selectedIdx;
  const h = getActiveHolidayConfig();

  // 생성기 클릭 시 즉시 소환
  if (clicked && clicked.isGenerator) {
    state.eventState.selectedIdx = idx;
    spawnHolidayEventItem(e);
    return;
  }

  // 이전에 선택된 아이템이 있고, 다른 칸의 같은 레벨 아이템을 클릭하면 즉시 합성(Merge)!
  if (prevIdx !== null && prevIdx !== idx && b[prevIdx] && !b[prevIdx].isGenerator) {
    const src = b[prevIdx];
    if (!clicked) {
      b[idx] = src;
      b[prevIdx] = null;
      state.eventState.selectedIdx = idx;
      sfx.tap();
      renderHolidayEventModal();
      triggerAutoSave();
      return;
    }
    if (!clicked.isGenerator && clicked.level === src.level && src.level < h.items.length) {
      const nextLv = src.level + 1;
      b[prevIdx] = null;
      b[idx] = { uid: newUid(), isGenerator: false, level: nextLv };
      state.eventState.selectedIdx = idx;

      // 이벤트 합성 시 즉시 본 게임 번개(⚡) 보너스 지급!
      const instantBolt = nextLv * 3;
      state.energy += instantBolt;
      sfx.merge(nextLv, true);
      floatText(
        `${h.icon} 이벤트 Lv.${nextLv} 합성! 본 게임 번개 +${instantBolt}⚡ 획득!`,
        e.clientX,
        e.clientY,
        "#fde047"
      );
      renderHolidayEventModal();
      renderAll();
      return;
    }
  }

  state.eventState.selectedIdx = idx;
  sfx.tap();
  renderHolidayEventModal();
}

function spawnHolidayEventItem(e) {
  const emptyIndices = [];
  state.eventState.board.forEach((it, idx) => {
    if (!it) emptyIndices.push(idx);
  });
  if (emptyIndices.length === 0) {
    sfx.warn();
    floatText("이벤트 보드가 가득 찼습니다! 같은 아이콘을 탭해 합치세요!", e.clientX, e.clientY, "#ef4444");
    return;
  }

  if (state.eventState.freeSpawns > 0) {
    state.eventState.freeSpawns--;
  } else {
    if (state.energy < 1) {
      sfx.warn();
      floatText("⚡ 번개가 부족합니다!", e.clientX, e.clientY, "#ef4444");
      return;
    }
    state.energy -= 1;
  }

  const targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  state.eventState.board[targetIdx] = {
    uid: newUid(),
    isGenerator: false,
    level: Math.random() < 0.2 ? 2 : 1,
  };
  state.eventState.selectedIdx = targetIdx;
  sfx.spawn();
  renderHolidayEventModal();
  renderAll();
}

function claimHolidayMissionOrder(e) {
  const h = getActiveHolidayConfig();
  const targetLv = state.eventState.targetLv || 3;
  const foundIdx = state.eventState.board.findIndex((it) => it && !it.isGenerator && it.level >= targetLv);
  if (foundIdx === -1) {
    sfx.warn();
    return;
  }

  const item = state.eventState.board[foundIdx];
  const meta = h.items[Math.min(item.level - 1, h.items.length - 1)];
  state.eventState.board[foundIdx] = null;

  // 1. 본 게임 번개(⚡) 지급
  const boltGain = targetLv * 15;
  state.energy += boltGain;

  // 2. 본 게임 고급 재료를 메인 보드(또는 보관함)로 전송!
  sendRewardItemToMainGame(meta.mainChain, meta.mainLv);

  state.eventState.completedCount = (state.eventState.completedCount || 0) + 1;
  state.eventState.targetLv = (state.eventState.completedCount % 3) + 3; // Lv.3 ~ Lv.5 순환
  state.eventState.freeSpawns += 4;

  sfx.serve();
  const mainMeta = getItemMeta(meta.mainChain, meta.mainLv);
  floatText(
    `🎃 이벤트 미션 달성! +${boltGain}⚡ & 본게임 [${mainMeta.name}] 획득!`,
    e.clientX,
    e.clientY,
    "#10b981"
  );
  renderHolidayEventModal();
  renderAll();
}

function collectSelectedHolidayItemToMain(e) {
  const idx = state.eventState.selectedIdx;
  const it = idx !== null ? state.eventState.board[idx] : null;
  if (!it || it.isGenerator) {
    sfx.warn();
    floatText("전환할 명절 아이템을 먼저 선택하세요!", e.clientX, e.clientY, "#fbbf24");
    return;
  }

  const h = getActiveHolidayConfig();
  const meta = h.items[Math.min(it.level - 1, h.items.length - 1)];
  state.eventState.board[idx] = null;
  state.eventState.selectedIdx = null;

  state.energy += meta.energyReward;
  sendRewardItemToMainGame(meta.mainChain, meta.mainLv);

  const mainMeta = getItemMeta(meta.mainChain, meta.mainLv);
  sfx.serve();
  floatText(
    `⚡ +${meta.energyReward}번개 & 본게임 [${mainMeta.name}] 전송 완료!`,
    e.clientX,
    e.clientY,
    "#38bdf8"
  );
  renderHolidayEventModal();
  renderAll();
}

function sendRewardItemToMainGame(chain, level) {
  const emptyCell = findNearestEmptyCell(27);
  const newItem = {
    uid: newUid(),
    state: "active",
    isGenerator: false,
    chain,
    level,
    justSpawned: true,
  };
  if (emptyCell !== -1) {
    state.board[emptyCell] = newItem;
  } else if (state.bag.length < 6) {
    state.bag.push(newItem);
  }
}

let lvBannerTimer = null;

function showLevelUpBanner(newLv, rewardCoins, rewardEnergy) {
  const banner = document.getElementById("levelup-banner");
  const titleEl = document.getElementById("lv-banner-title");
  const subEl = document.getElementById("lv-banner-sub");
  if (!banner) return;

  titleEl.textContent = `👑 연금술사 레벨 업! Lv.${newLv} 달성!`;
  subEl.textContent = `보상: +${rewardCoins}🪙 · +${rewardEnergy}⚡ · +1🌟 지급 완료!`;
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
    state.maxEnergy = NATURAL_ENERGY_CAP; // 자연 회복 한도는 100⚡ 고정

    const rewardCoins = 40 * state.playerLv;
    const rewardEnergy = 30;
    state.coins += rewardCoins;
    state.stars += 1;
    state.energy += rewardEnergy;

    // 보드에 레벨업 보너스 선물(금화 더미 또는 번개 구슬) 스폰
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
    floatText("⚡ 번개가 부족합니다! 5분마다 충전되거나 이벤트/번개아이템으로 얻으세요!", clientX, clientY, "#ef4444");
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

// 드래그 앤 드롭 합치기 & 이종 재료 조합 실행
function executeBoardDrop(srcIdx, dstIdx, clientX, clientY) {
  if (srcIdx === null || dstIdx === null || srcIdx === dstIdx) return;
  const src = state.board[srcIdx];
  const dst = state.board[dstIdx];
  if (!src || src.state !== "active") return;

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

  // 이종 재료 조합 레시피(Cross-Chain Combination) 체크
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

  // 동일 아이템 레벨업 합치기 (Merge)
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

    // Lv.3 이상 합성 시 인게임 번개(⚡) 또는 금화 조각 드롭!
    if (nextLv >= 3 && Math.random() < 0.55) {
      const bonusCell = findNearestEmptyCell(dstIdx);
      if (bonusCell !== -1) {
        state.board[bonusCell] = {
          uid: newUid(),
          state: "active",
          isGenerator: false,
          chain: Math.random() < 0.55 ? "energy" : "coin",
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
    state.energy += meta.amount;
    sfx.serve();
    floatText(`+${meta.amount}⚡ 번개 획득!`, clientX, clientY, "#38bdf8");
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

function highlightCompatibleTargets(dragItem) {
  if (dragItem.isGenerator) return;
  const meta = getItemMeta(dragItem.chain, dragItem.level);

  document.querySelectorAll(".gh-cell").forEach((cellEl) => {
    const idx = parseInt(cellEl.dataset.index, 10);
    if (idx === drag.sourceIdx) return;
    const target = state.board[idx];
    if (!target || target.state === "crate" || target.isGenerator) return;

    if (target.chain === dragItem.chain && target.level === dragItem.level && dragItem.level < meta.maxLv) {
      cellEl.classList.add("cell-merge-hint");
    } else if (findCrossRecipe(dragItem, target) !== null) {
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
    maxEnergy: NATURAL_ENERGY_CAP,
    energy: state.energy,
    energyCountdown: state.energyCountdown,
    coins: state.coins,
    stars: state.stars,
    board: state.board,
    bag: state.bag,
    orders: state.orders,
    eventState: state.eventState,
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
  const { wantedBoardUids, orderStatus } = computeWantedMap();
  renderOrdersUI(orderStatus);
  renderBoardUI(wantedBoardUids);
  renderInspectorUI();
  updateCastleViewUI(orderStatus);

  document.getElementById("bag-count").textContent = `${state.bag.length}/6`;
  if (window.Interior3DEngine && state.activeScreen === "castle") {
    Interior3DEngine.updatePinsDOM();
  }
  triggerAutoSave();
}

function formatMMSS(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
  // 번개 100개까지는 5분(05:00)마다 1개씩 자동 충전
  document.getElementById("energy-timer").textContent =
    state.energy >= NATURAL_ENERGY_CAP ? `MAX(100)` : formatMMSS(state.energyCountdown);
  document.getElementById("res-coins").textContent = state.coins;
  document.getElementById("res-stars").textContent = state.stars;
}

// 🏰 마녀의 성 화면 UI (오른쪽 하단 현재 섹션 아이콘 버튼 + 퀘스트 카드 리스트) 업데이트
function updateCastleViewUI(orderStatus = null) {
  if (!window.Interior3DEngine) return;
  const stats = Interior3DEngine.getProgressStats();
  document.getElementById("room-title-label").textContent = stats.themeTitle;
  document.getElementById("room-prog-badge").textContent = `${stats.done} / ${stats.total} 복구됨`;

  const currentRoom = stats.allThemes[stats.currentThemeKey] || stats.allThemes.alchemy;

  // ★ 오른쪽 하단(Bottom-Right) 섹션 아이콘 버튼 업데이트 (예: 🔮 마녀의 공방 / 🏖️ 하버 오션카페 / 🌿 보타니컬 온실 / 👑 황실 대연회장) ★
  const fabIconEl = document.getElementById("fab-section-icon");
  const fabTitleEl = document.getElementById("fab-section-title");
  if (fabIconEl) fabIconEl.textContent = currentRoom.sectionIcon || "🔮";
  if (fabTitleEl) fabTitleEl.textContent = currentRoom.shortName ? currentRoom.shortName.replace(/^[^\s]+\s/, "") : "마녀의 공방";

  // 주문 완성 여부 배지 표시
  if (orderStatus) {
    const anyOrderReady = orderStatus.some((st) => st.allReady);
    const fabBadge = document.getElementById("fab-order-badge");
    if (fabBadge) fabBadge.classList.toggle("hidden", !anyOrderReady);
  }

  // 합성 화면의 [🏰 성으로 가기] 버튼 알림 배지 업데이트
  const canRenovateAny = stats.nextSpot && state.stars >= stats.nextSpot.cost;
  const castleDot = document.getElementById("castle-ready-dot");
  if (castleDot) castleDot.classList.toggle("hidden", !canRenovateAny);

  // 성 하단 퀘스트 스트립 렌더링
  const totalProgEl = document.getElementById("castle-total-prog");
  if (totalProgEl) {
    totalProgEl.textContent = `마녀의 성 전체 ${stats.totalCastleDone}/${stats.totalCastleSpots}`;
  }
  const zoneNameEl = document.getElementById("castle-quest-zone-name");
  if (zoneNameEl) {
    zoneNameEl.textContent = `📜 ${currentRoom.shortName} 퀘스트 (완료 시 스토리 컷신 오픈)`;
  }

  const stripEl = document.getElementById("castle-quest-strip");
  if (!stripEl) return;
  stripEl.innerHTML = "";

  currentRoom.spots.forEach((spot) => {
    const canAfford = state.stars >= spot.cost;
    const card = document.createElement("div");
    card.className = `castle-quest-card ${
      spot.done ? "quest-done" : canAfford ? "quest-ready" : "quest-locked"
    }`;

    card.innerHTML = `
      <div class="cq-name">${spot.name}</div>
      <div class="cq-btn-tag">
        ${spot.done ? "💬 스토리" : `🔨 🌟${spot.cost}`}
      </div>
    `;

    card.addEventListener("click", () => {
      if (spot.done) {
        openStoryCutscene(spot, currentRoom.title, false);
      } else {
        Interior3DEngine.focusOnSpotForDesign(spot);
      }
    });

    stripEl.appendChild(card);
  });
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
    nameEl.textContent = "타일을 탭하거나 드래그해 합성하세요";
    lvEl.textContent = "안내";
    descEl.textContent = "좌측 하단 [🏰 성으로 가기]를 누르면 마녀의 성을 꾸밀 수 있습니다!";
    return;
  }

  if (item.state === "crate") {
    iconEl.innerHTML = GameSprites.getCrateSVG();
    nameEl.textContent = "봉인된 고대 상자";
    lvEl.textContent = "잠김";
    descEl.textContent = "인접한 거미줄(🕸️) 타일을 합치면 상자가 열립니다.";
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
    btn.textContent = "⚡ 생성";
    btn.addEventListener("click", (e) => triggerGenerator(state.selectedIdx, e.clientX, e.clientY));
    actionsEl.appendChild(btn);
    return;
  }

  const meta = getItemMeta(item.chain, item.level);
  iconEl.innerHTML = GameSprites.getItemSVG(item.chain, item.level, false);
  nameEl.textContent = meta.name;
  lvEl.textContent = item.state === "cobweb" ? `Lv.${item.level}(거미줄)` : `Lv.${item.level}/${meta.maxLv}`;

  if (item.state === "cobweb") {
    descEl.textContent = "같은 레벨의 활성 재료를 드래그해 합치거나 [🕸️해제] 버튼으로 푸세요.";
    return;
  }

  if (meta.isCollectible) {
    descEl.textContent = `탭하여 즉시 획득하거나 같은 단계끼리 합쳐 최대 Lv.${meta.maxLv} 보상으로 키우세요!`;
    const colBtn = document.createElement("button");
    colBtn.className = "insp-btn sell-btn";
    colBtn.textContent = "수집";
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
    descEl.textContent = `⚗️조합: [${partnerMeta.name} Lv.${partner.level}]와 합치면 [${resMeta.name}] 탄생!`;
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
  sellBtn.textContent = `+${meta.sell}🪙`;
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

// 플레이어 레벨 & 번개 경제 안내 모달
function renderLevelModal() {
  const body = document.getElementById("level-modal-body");
  if (!body) return;
  const reqXP = getRequiredXP(state.playerLv);
  const pct = Math.min(100, Math.round((state.xp / reqXP) * 100));

  let milestonesHtml = "";
  for (let lv = 2; lv <= Math.max(8, state.playerLv + 3); lv++) {
    const unlocked = state.playerLv >= lv;
    const coinBonus = 40 * lv;
    milestonesHtml += `
      <div class="codex-card" style="display:flex;align-items:center;justify-content:space-between;background:${
        unlocked ? "#f3e8ff" : "#ffffff"
      };border-color:${unlocked ? "#a855f7" : "#cbd5e1"}">
        <div>
          <strong style="font-size:12.5px;color:#3b0764">👑 레벨 ${lv} 달성 혜택</strong>
          <p style="font-size:11px;color:#475569;margin-top:2px">
            보상: <b>+${coinBonus}🪙 코인 · +30⚡ 번개 · +1🌟 마력별 · 레벨업 선물상자</b>
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
      <p style="font-size:11px;color:#e9d5ff;line-height:1.4">
        ⚡ <b>번개(Lightning) 경제 시스템</b>: 최대 <b>100개</b>까지 <b>5분마다 1개씩</b> 자동 충전됩니다.<br/>
        보드 위에서 번개 조각(Lv.1~4)을 합성하거나, 손님 주문 완료, 퀘스트 스토리 감상, 명절 팝업 이벤트에서 추가 번개를 획득할 수 있습니다!
      </p>
    </div>
    ${milestonesHtml}
  `;
}

// 도감 모달
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
  const sp1 = document.getElementById("speaker-tag");
  const tx1 = document.getElementById("dialogue-text");
  const sp2 = document.getElementById("castle-speaker-tag");
  const tx2 = document.getElementById("castle-dialogue-text");
  if (sp1) sp1.textContent = speaker + ":";
  if (tx1) tx1.textContent = text;
  if (sp2) sp2.textContent = speaker + ":";
  if (tx2) tx2.textContent = text;
}

// 동시에 여러 플로팅 텍스트가 뜰 때 세로 위치를 계단식 분리하여 절대 겹치지 않게 처리
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
  const safeY = Math.max(65, (y || 220) - 10 - slotOffset);

  el.style.left = `${safeX}px`;
  el.style.top = `${safeY}px`;
  layer.appendChild(el);

  setTimeout(() => {
    activeFloatCount = Math.max(0, activeFloatCount - 1);
    el.remove();
  }, 1050);
}

function bindUIEvents() {
  // ★ 1. [🏰 성으로 가기] 버튼 -> 마녀의 성 꾸미기 화면(View A)으로 전환!
  document.getElementById("btn-go-castle").addEventListener("click", () => {
    switchScreen("castle");
  });

  // 상단 마력별(🌟) 배지 클릭 시에도 마녀의 성 화면으로 이동 후 다음 가구 포커스!
  document.getElementById("btn-next-reno").addEventListener("click", () => {
    if (state.activeScreen !== "castle") {
      switchScreen("castle");
      setTimeout(() => {
        if (window.Interior3DEngine) Interior3DEngine.triggerNextSpot();
      }, 120);
    } else if (window.Interior3DEngine) {
      Interior3DEngine.triggerNextSpot();
    }
  });

  // ★ 2. 마녀의 성 화면 오른쪽 하단(Bottom-Right) 섹션 아이콘 버튼 -> 합성 페이지(View B)로 전환!
  document.getElementById("btn-enter-merge").addEventListener("click", () => {
    switchScreen("merge");
  });

  // 3. 마녀의 성 구역 탭 전환 (성 전체지도 / 마녀의 공방 / 하버 오션카페 / 보타니컬 온실 / 황실 대연회장)
  document.querySelectorAll(".theme-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      sfx.tap();
      selectCastleThemeTab(tab.dataset.theme);
    });
  });

  // 4. 스토리 컷신 모달 컨트롤
  document.getElementById("btn-cutscene-next").addEventListener("click", () => {
    closeOrAdvanceCutscene(false);
  });
  document.getElementById("btn-skip-cutscene").addEventListener("click", () => {
    closeOrAdvanceCutscene(true);
  });

  // 5. 전세계 명절 팝업 이벤트 모달 오픈 & 컨트롤
  const openEventModal = () => {
    sfx.tap();
    renderHolidayEventModal();
    document.getElementById("modal-holiday-event").classList.remove("hidden");
  };
  document.getElementById("btn-open-event").addEventListener("click", openEventModal);
  document.getElementById("btn-banner-event").addEventListener("click", openEventModal);
  document.getElementById("btn-event-spawn").addEventListener("click", (e) => spawnHolidayEventItem(e));
  document.getElementById("btn-claim-event-order").addEventListener("click", (e) => claimHolidayMissionOrder(e));
  document.getElementById("btn-event-collect-selected").addEventListener("click", (e) =>
    collectSelectedHolidayItemToMain(e)
  );

  // 6. 레벨 모달 오픈
  document.getElementById("btn-open-level").addEventListener("click", () => {
    renderLevelModal();
    document.getElementById("modal-level").classList.remove("hidden");
  });

  // 7. 로컬 DB & 안드로이드 공식 앱 설치 모달
  document.getElementById("btn-open-db").addEventListener("click", async () => {
    if (window.GameDB) {
      const code = await GameDB.exportBackupString();
      document.getElementById("backup-code-box").value = code;
    }
    document.getElementById("modal-db").classList.remove("hidden");
  });

  document.getElementById("btn-install-pwa").addEventListener("click", async (e) => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === "accepted") {
        deferredInstallPrompt = null;
        floatText("📲 공식 웹앱 설치가 시작되었습니다!", e.clientX, e.clientY, "#10b981");
      }
    } else {
      floatText("크롬 우측 상단 메뉴(⋮) ➔ [홈 화면에 추가 / 앱 설치]를 눌러주세요!", e.clientX, e.clientY, "#38bdf8");
    }
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

  // 8. 번개 충전 버튼 (30코인으로 +25⚡ 또는 비상 무료 보충)
  document.getElementById("btn-refill-energy").addEventListener("click", (e) => {
    if (state.coins >= 25) {
      state.coins -= 25;
      state.energy += 30;
      sfx.serve();
      floatText("⚡ 번개 +30 충전! (-25🪙)", e.clientX, e.clientY, "#38bdf8");
    } else {
      state.energy += 15;
      sfx.serve();
      floatText("⚡ 마녀의 축복! 무료 번개 +15 충전!", e.clientX, e.clientY, "#38bdf8");
    }
    renderAll();
  });

  // 9. 거미줄 즉시 해제 부스터
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

  // 10. 보드 정렬
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

  // 11. 사운드 토글
  const sndBtn = document.getElementById("btn-toggle-sound");
  sndBtn.addEventListener("click", () => {
    sfx.enabled = !sfx.enabled;
    sndBtn.textContent = sfx.enabled ? "🔊" : "🔇";
  });

  // 12. 도감/가방/모달 닫기
  document.getElementById("btn-open-codex").addEventListener("click", () => {
    document.getElementById("modal-codex").classList.remove("hidden");
  });
  document.getElementById("btn-open-bag").addEventListener("click", () => {
    renderBagModal();
    document.getElementById("modal-bag").classList.remove("hidden");
  });
  document.querySelectorAll(".gh-close-btn").forEach((btn) => {
    if (!btn.dataset.close) return;
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.close).classList.add("hidden");
    });
  });
}

window.addEventListener("DOMContentLoaded", init);
