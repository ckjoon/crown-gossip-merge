// game.js — 크라운 & 가십: 마녀의 성 3D 인테리어 빌딩 & 멀티 체인 합성(Merge) 게임
// v2.4.0: 생성기 합성 진화(Lv.1➔Lv.2➔Lv.3 성질 변화), 퀘스트 재료 조합법 표시, 명절 이벤트 드래그 합성 버그 수정,
//         마녀의 공방 3D/탭 잘림 해결, 통합 설정(⚙️) 메뉴 및 버전 업데이트 히스토리 팝업 시스템

const APP_VERSION = "v2.4.0";

// 버전별 개발 Progression 및 업데이트 히스토리 기록
const VERSION_HISTORY = [
  {
    version: "v2.4.0",
    date: "2026-10-18",
    badge: "LATEST",
    title: "생성기 합성 진화 & 퀘스트 조합법 가이드 & 이벤트 드래그 패치",
    changes: [
      "🔥 [생성기 합성 & 성질 진화] 마법 가마솥·책장·화분·오븐·티포트 같은 생성기도 레벨업이나 퀘스트 완료 보상으로 파츠를 얻어 합치면(Lv.1➔Lv.2➔Lv.3) 외형과 생성 성질(고급 재료 직배출·이종 조합 재료 동시 생성·완제품 연성)이 진화합니다!",
      "🧪 [퀘스트 재료 조합법 안내] 손님 주문(Quest) 카드 하단에 어떤 생성기나 이종 재료 조합식이 필요한지 즉시 표시되며, 주문 카드를 탭하면 상세 조합법을 안내합니다.",
      "🎃 [할로윈/명절 이벤트 합성 버그 수정] 5x5 이벤트 보드에서 드래그 앤 드롭(Drag & Drop) 및 연속 탭 합성이 모두 완벽하게 동작하도록 수정했습니다.",
      "📐 [마녀의 공방 화면 잘림 해결] Galaxy S25 세로 비율에서 3D 마녀의 공방 좌우 시야와 상단 탭이 잘리지 않도록 카메라 시야각(Frustum)과 탭 레이아웃을 최적화했습니다.",
      "⚙️ [통합 설정 메뉴 & 버전 팝업] 사운드·DB 백업·앱 설치·패치노트를 우측 상단 [⚙️ 설정] 메뉴로 통합하고, 버전 업데이트 시 새로운 내용을 알려주는 팝업을 추가했습니다.",
      "⚖️ [번개/금화 드롭 확률 밸런스 조정] 합성 시 무작위로 떨어지던 번개·동전 확률을 대폭 낮춰(Lv.4 이상 12%) 보드 플레이에 집중할 수 있도록 개선했습니다.",
    ],
  },
  {
    version: "v2.3.0",
    date: "2026-10-18",
    badge: "MAJOR",
    title: "마녀의 성 2-Screen 분리 & 명절 이벤트 & 번개 100개 경제",
    changes: [
      "🏰 [성으로 가기 ↔ 섹션 아이콘 합성 페이지] '성으로 가기' 화면과 '아이콘 합성' 페이지를 분리하고, 성 화면 오른쪽 하단에 현재 구역 아이콘(🔮/🏖️/🌿/👑) 합성 진입 버튼을 배치했습니다.",
      "🎬 [퀘스트 완료 스토리 컷신] 가구 복구 퀘스트를 1개씩 깰 때마다 캐릭터 대화 스토리 컷신이 연출됩니다.",
      "⚡ [번개 100개 자동 충전 경제] 최대 100개까지 5분(05:00)마다 1개씩 자동 충전되는 Gossip Harbor 표준 번개 경제를 도입했습니다.",
      "🛡️ [안드로이드 보안 규격 패치] Google WebAPK 표준 아이콘 분리 및 HTTPS 보안 헤더를 적용했습니다.",
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-10-18",
    badge: "CORE",
    title: "연금술사 레벨 시스템 & IndexedDB 영구 저장소 & PWA",
    changes: [
      "👑 플레이어 레벨 및 경험치(XP) 성장 시스템과 전용 상단 레벨업 축하 배너를 추가했습니다.",
      "💾 IndexedDB + LocalStorage 이중 영구 저장소(db.js)를 구축하여 앱 업데이트 시에도 진행도가 보존됩니다.",
      "🎨 모든 체인의 Lv.1~Lv.6 아이콘을 서로 다른 고유 커스텀 SVG 일러스트로 전면 교체했습니다.",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-10-18",
    badge: "INIT",
    title: "Three.js 3D 인테리어 디오라마 & 멀티 체인 합성 엔진 출시",
    changes: [
      "🏛️ Three.js + GSAP 기반 3D 아이소메트릭 인테리어 공간 복구 및 3가지 가구 스타일 선택 시스템을 구축했습니다.",
      "⚗️ 5대 생성기 체인과 이종 재료 스페셜 조합(Cross-Combination) 시스템을 구현했습니다.",
    ],
  },
];

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
    shortGen: "🔥가마솥",
    css: "chain-potion",
    generator: {
      name: "마법 가마솥",
      desc: "탭하면 물약 재료(⚡1)와 보석 원석을 생성합니다. 같은 가마솥끼리 합성하면 성질이 진화합니다!",
      tiers: [
        {
          level: 1,
          name: "수습 마법 가마솥",
          desc: "[Lv.1 기본 성질] 물약 재료(Lv.1~2)와 20% 확률로 보석 원석(Lv.1)을 생성합니다. 가마솥 2개를 합치면 황금 가마솥으로 진화합니다!",
        },
        {
          level: 2,
          name: "황금 연금술 가마솥",
          desc: "[Lv.2 진화 성질] 고농축 물약(Lv.2~3) 배출률이 대폭 오르고, 세공된 사파이어(Lv.2) 및 활력비약 조합용 달버섯을 함께 연성합니다!",
        },
        {
          level: 3,
          name: "태고의 성배 가마솥",
          desc: "[Lv.3 신화 성질] 상급 비약(Lv.2~4)과 문스톤 보석을 생성하며, 20% 확률로 완제품 [특제 활력비약]을 즉시 연성합니다!",
        },
      ],
    },
    rareDropChain: "gem",
    rareChance: 0.2,
    items: [
      { level: 1, name: "마나 이슬", sell: 2 },
      { level: 2, name: "초급 마나물약", sell: 5 },
      { level: 3, name: "달빛 플라스크", sell: 12 },
      { level: 4, name: "자수정 비약", sell: 28 },
      { level: 5, name: "성운 엘릭서", sell: 65 },
      { level: 6, name: "신성 날개비약", sell: 150 },
      { level: 7, name: "시간의 모래 비약", sell: 340 },
      { level: 8, name: "마녀왕의 불로약", sell: 780 },
    ],
  },
  grimoire: {
    id: "grimoire",
    name: "고대 마도서 체인",
    shortGen: "🦉책장",
    css: "chain-grimoire",
    generator: {
      name: "고대 마법책장",
      desc: "탭하면 마도서 재료(⚡1)를 생성합니다. 책장끼리 합성하면 성질이 진화합니다!",
      tiers: [
        {
          level: 1,
          name: "고대 마법책장",
          desc: "[Lv.1 기본 성질] 마력 깃펜(Lv.1)과 봉인 주문서(Lv.2)를 생성합니다.",
        },
        {
          level: 2,
          name: "비전 아카이브 서가",
          desc: "[Lv.2 진화 성질] 주문서와 화염 마도서(Lv.2~3)를 생성하며, 룬스톤 조합용 사파이어(Lv.2)를 추가 배출합니다!",
        },
        {
          level: 3,
          name: "신화 아카식 서고",
          desc: "[Lv.3 신화 성질] 고위 마도서(Lv.2~4) 및 완제품 [마력 각인룬스톤]을 직접 배출합니다!",
        },
      ],
    },
    items: [
      { level: 1, name: "마력 깃펜", sell: 2 },
      { level: 2, name: "봉인 주문서", sell: 5 },
      { level: 3, name: "화염 마도서", sell: 12 },
      { level: 4, name: "심연 백과사전", sell: 28 },
      { level: 5, name: "예언의 마도서", sell: 65 },
      { level: 6, name: "태고 신화비석", sell: 150 },
      { level: 7, name: "금단의 고문서", sell: 340 },
      { level: 8, name: "셀레네의 창세록", sell: 780 },
    ],
  },
  herb: {
    id: "herb",
    name: "달빛 마법식물 체인",
    shortGen: "🪴화분",
    css: "chain-herb",
    generator: {
      name: "달빛 온실화분",
      desc: "탭하면 마법식물 재료(⚡1)를 생성합니다. 화분끼리 합성하면 성질이 진화합니다!",
      tiers: [
        {
          level: 1,
          name: "달빛 온실화분",
          desc: "[Lv.1 기본 성질] 야광 포자(Lv.1)와 몽환 달버섯(Lv.2)을 생성합니다.",
        },
        {
          level: 2,
          name: "에메랄드 테라리움",
          desc: "[Lv.2 진화 성질] 달버섯과 만드라고라(Lv.2~3)를 생성하며, 활력비약 조합용 초급 마나물약을 공명 생성합니다!",
        },
        {
          level: 3,
          name: "세계수의 성소 화단",
          desc: "[Lv.3 신화 성질] 희귀 환수 식물(Lv.2~4) 및 완제품 [특제 활력비약]을 직접 배출합니다!",
        },
      ],
    },
    items: [
      { level: 1, name: "야광 포자", sell: 2 },
      { level: 2, name: "몽환 달버섯", sell: 5 },
      { level: 3, name: "만드라고라", sell: 12 },
      { level: 4, name: "영혼 꽃나비", sell: 28 },
      { level: 5, name: "불사조의 알", sell: 65 },
      { level: 6, name: "스타 드래곤", sell: 150 },
      { level: 7, name: "월광 세계수", sell: 340 },
      { level: 8, name: "생명의 세계수", sell: 780 },
    ],
  },
  bakery: {
    id: "bakery",
    name: "화로 베이커리 체인",
    shortGen: "🧁오븐",
    css: "chain-bakery",
    generator: {
      name: "마법 화로오븐",
      desc: "탭하면 베이커리 재료(⚡1)를 생성합니다. 오븐끼리 합성하면 성질이 진화합니다!",
      tiers: [
        {
          level: 1,
          name: "마법 화로오븐",
          desc: "[Lv.1 기본 성질] 밀가루 반죽(Lv.1)과 버터 크루아상(Lv.2)을 구워냅니다.",
        },
        {
          level: 2,
          name: "황금 파티시에 화덕",
          desc: "[Lv.2 진화 성질] 크루아상과 베리 타르트(Lv.2~3)를 구워내며, 브런치 조합용 에스프레소(Lv.3)를 함께 배출합니다!",
        },
        {
          level: 3,
          name: "로얄 블랑제리 신화오븐",
          desc: "[Lv.3 신화 성질] 고급 디저트(Lv.2~4) 및 완제품 [모닝 브런치세트]를 즉시 배출합니다!",
        },
      ],
    },
    items: [
      { level: 1, name: "밀가루 반죽", sell: 2 },
      { level: 2, name: "버터 크루아상", sell: 5 },
      { level: 3, name: "베리 타르트", sell: 12 },
      { level: 4, name: "달빛 마카롱", sell: 28 },
      { level: 5, name: "쇼트케이크", sell: 65 },
      { level: 6, name: "로얄 3단케이크", sell: 150 },
      { level: 7, name: "왕실 디저트 타워", sell: 340 },
      { level: 8, name: "황금 축제 케이크", sell: 780 },
    ],
  },
  tea: {
    id: "tea",
    name: "연금술 티 & 카페 체인",
    shortGen: "🫖티포트",
    css: "chain-tea",
    generator: {
      name: "황실 티포트",
      desc: "탭하면 차/커피 재료(⚡1)를 생성합니다. 티포트끼리 합성하면 성질이 진화합니다!",
      tiers: [
        {
          level: 1,
          name: "황실 티포트",
          desc: "[Lv.1 기본 성질] 향긋한 찻잎(Lv.1)과 캐모마일 티(Lv.2)를 우려냅니다.",
        },
        {
          level: 2,
          name: "오로라 바리스타 포트",
          desc: "[Lv.2 진화 성질] 에스프레소(Lv.3)와 밀크티를 빠르게 추출하며 브런치용 크루아상을 함께 제공합니다!",
        },
        {
          level: 3,
          name: "여왕의 신화 티메이커",
          desc: "[Lv.3 신화 성질] 최고급 음료(Lv.2~4)와 완제품 [모닝 브런치세트]를 즉시 생성합니다!",
        },
      ],
    },
    items: [
      { level: 1, name: "향긋한 찻잎", sell: 2 },
      { level: 2, name: "캐모마일 티", sell: 5 },
      { level: 3, name: "에스프레소", sell: 12 },
      { level: 4, name: "오로라 밀크티", sell: 28 },
      { level: 5, name: "황실 티세트", sell: 70 },
      { level: 6, name: "금빛 애프터눈티", sell: 160 },
      { level: 7, name: "별무리 찻주전자 세트", sell: 360 },
      { level: 8, name: "여왕의 만찬 티파티", sell: 820 },
    ],
  },
  gem: {
    id: "gem",
    name: "마법 광석 체인 (가마솥 부산물)",
    shortGen: "⛏️가마솥부산물",
    css: "chain-gem",
    items: [
      { level: 1, name: "광석 파편", sell: 4 },
      { level: 2, name: "사파이어", sell: 10 },
      { level: 3, name: "문스톤 결정", sell: 25 },
      { level: 4, name: "태양석 브로치", sell: 60 },
      { level: 5, name: "여왕의 티아라", sell: 160 },
      { level: 6, name: "왕관 보석함", sell: 380 },
      { level: 7, name: "별의 왕홀", sell: 900 },
      { level: 8, name: "마녀 여왕의 왕관", sell: 2100 },
    ],
  },
  combo: {
    id: "combo",
    name: "⚗️ 이종 재료 스페셜 조합품",
    shortGen: "⚗️이종조합",
    css: "chain-combo",
    items: [
      {
        level: 1,
        name: "특제 활력비약",
        sell: 35,
        shortRecipe: "⚗️물약Lv2+달버섯Lv2",
        recipeText: "🔥초급 마나물약(Lv.2) + 🪴몽환 달버섯(Lv.2) 드래그 조합",
      },
      {
        level: 2,
        name: "모닝 브런치세트",
        sell: 50,
        shortRecipe: "⚗️크루아상Lv2+커피Lv3",
        recipeText: "🧁버터 크루아상(Lv.2) + 🫖에스프레소(Lv.3) 드래그 조합",
      },
      {
        level: 3,
        name: "마력 각인룬스톤",
        sell: 55,
        shortRecipe: "⚗️주문서Lv2+사파이어Lv2",
        recipeText: "🦉봉인 주문서(Lv.2) + 💎사파이어(Lv.2) 드래그 조합",
      },
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
    day: 31,
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
    day: 25,
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
    day: 1,
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
    day: 14,
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
  { name: "카르멘", face: "👩‍🎨", line: "가마솥 같은 생성기도 2개를 합치면 황금 생성기로 진화한답니다!" },
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
  activeScreen: "merge", // "merge" | "castle"
  playerLv: 1,
  xp: 0,
  maxEnergy: NATURAL_ENERGY_CAP,
  energy: 100,
  energyCountdown: ENERGY_REGEN_SEC,
  coins: 350,
  stars: 4,
  selectedIdx: null,
  board: new Array(TOTAL_CELLS).fill(null),
  bag: [],
  orders: [],
  lastTapCell: null,
  lastTapTime: 0,
  soundEnabled: true,
  cauldronPartGranted: true,
  lastSeenVersion: APP_VERSION,
  isLoaded: false,
  eventState: {
    activeHolidayId: "halloween",
    board: new Array(25).fill(null),
    selectedIdx: null,
    targetLv: 3,
    freeSpawns: 12,
    completedCount: 0,
  },
};

const cutsceneState = {
  active: false,
  spot: null,
  themeTitle: "",
  dialogues: [],
  stepIdx: 0,
  giveBonusOnFinish: false,
};

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function getRequiredXP(lv) {
  return 50 + (lv - 1) * 20;
}

function getGeneratorTierMeta(chain, level = 1) {
  const ch = CHAINS[chain];
  if (!ch || !ch.generator) return { name: "생성기", desc: "", maxGenLv: 3 };
  const tiers = ch.generator.tiers || [];
  const tier = tiers[Math.min(Math.max(1, level) - 1, tiers.length - 1)] || {
    level: 1,
    name: ch.generator.name,
    desc: ch.generator.desc,
  };
  return {
    ...tier,
    maxGenLv: tiers.length || 3,
  };
}

// 퀘스트(주문) 요구 아이템의 출처/조합법 요약 텍스트 반환
function getRequirementRecipeSummary(req) {
  const meta = getItemMeta(req.chain, req.level);
  if (req.chain === "combo") {
    return meta.shortRecipe || meta.recipeText || "⚗️이종조합";
  }
  const ch = CHAINS[req.chain];
  const shortGen = ch && ch.shortGen ? ch.shortGen : "생성기";
  return `${shortGen}➔${meta.name}(Lv.${req.level})`;
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

const evDrag = {
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

  let savedInterior = null;
  let previousSeenVersion = null;
  if (window.GameDB) {
    const record = await GameDB.loadProgress();
    if (record) {
      const res = GameDB.mergeWithDefaultState(state, record, CHAINS, TOTAL_CELLS);
      if (res && res.merged) {
        savedInterior = res;
        previousSeenVersion = res.lastSeenVersion;
      }
    }
  }
  state.maxEnergy = NATURAL_ENERGY_CAP;
  sfx.enabled = state.soundEnabled !== false;

  if (!state.eventState || !Array.isArray(state.eventState.board) || state.eventState.board.length !== 25) {
    initHolidayEventBoard();
  }
  state.isLoaded = true;

  bindUIEvents();
  setupPointerDragEngine();
  setupEventBoardPointerDrag();

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

          // ★ 퀘스트 완료 시 생성기 진화 파츠(Lv.1 생성기) 보너스 지급! (합성하여 생성기 성질 진화 가능)
          const genPartChain = getGeneratorChainForTheme(currentThemeObj ? currentThemeObj.id : "alchemy");
          grantGeneratorEvolutionPart(genPartChain, `퀘스트 완료 보상`);

          floatText(`🎉 [${spot.name}] 시공 완료! +100🪙 +20⚡ +생성기파츠!`, window.innerWidth / 2, 160, "#10b981");
        } else {
          floatText(`🎨 [${spot.name}] 스타일 변경 완료!`, window.innerWidth / 2, 160, "#c084fc");
        }
        sfx.serve();
        setDialogue("🔨 " + spot.name, spot.story);
        renderAll();

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
  renderChangelogModal();
  updateHolidayCountdowns();
  updateSoundButtonUI();

  // ★ 버전이 올라갔을 때(또는 첫 방문 시) 어떤 새로운 내용이 추가되었는지 알려주는 버전 팝업 자동 표시!
  if (previousSeenVersion !== APP_VERSION) {
    state.lastSeenVersion = APP_VERSION;
    triggerAutoSave();
    setTimeout(() => {
      document.getElementById("modal-changelog").classList.remove("hidden");
    }, 350);
  }

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

function getGeneratorChainForTheme(themeId) {
  if (themeId === "alchemy") return "potion";
  if (themeId === "harbor") return "bakery";
  if (themeId === "garden") return "herb";
  if (themeId === "banquet") return "grimoire";
  return "potion";
}

function grantGeneratorEvolutionPart(chain, reasonText) {
  const emptyIdx = findNearestEmptyCell(24);
  const newGenPart = {
    uid: newUid(),
    state: "active",
    isGenerator: true,
    chain,
    level: 1,
    justSpawned: true,
  };
  const genMeta = getGeneratorTierMeta(chain, 1);
  if (emptyIdx !== -1) {
    state.board[emptyIdx] = newGenPart;
    setDialogue(
      "🔥 생성기 진화 파츠 획득",
      `${reasonText}으로 [${genMeta.name} Lv.1]을 획득했습니다! 같은 생성기끼리 드래그해 합치면 상위 성질로 진화합니다!`
    );
  } else if (state.bag.length < 6) {
    state.bag.push(newGenPart);
    setDialogue(
      "🎒 보관함 지급",
      `보드가 가득 차서 [${genMeta.name} Lv.1] 진화 파츠가 보관함(🎒)으로 지급되었습니다!`
    );
  }
}

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

// 초기 보드: 5대 생성기 + 가마솥 합성 진화를 즉시 체험할 수 있는 보조 가마솥(Lv.1) 배치!
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

  // 중앙 오픈 공간에 5종류의 핵심 생성기 배치 (+ 가마솥 합성 진화 체험용 보조 가마솥 Lv.1 1개 추가 배치!)
  placeTile(2, 2, { isGenerator: true, chain: "potion", level: 1, state: "active" }); // 🔥 마법 가마솥 Lv.1
  placeTile(2, 3, { isGenerator: true, chain: "potion", level: 1, state: "active" }); // 🔥 두 번째 마법 가마솥 Lv.1 (합성하면 Lv.2 황금 연금술 가마솥으로 진화!)
  placeTile(2, 4, { isGenerator: true, chain: "grimoire", level: 1, state: "active" });
  placeTile(3, 3, { isGenerator: true, chain: "herb", level: 1, state: "active" });
  placeTile(5, 2, { isGenerator: true, chain: "bakery", level: 1, state: "active" });
  placeTile(5, 4, { isGenerator: true, chain: "tea", level: 1, state: "active" });

  // 시작 재료 배치
  placeTile(3, 2, { isGenerator: false, chain: "potion", level: 2, state: "active" });
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

  // 주문 완료 시 번개 조각 드롭은 과도하지 않게 15% 확률로만 등장
  let bonusMsg = "";
  if (Math.random() < 0.15) {
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
      bonusMsg = " +번개조각⚡";
    }
  }

  setDialogue(ord.customer.face + " " + ord.customer.name, ord.customer.line);
  floatText(
    `🎉 주문 완료! +${ord.coins}🪙 +${ord.stars}🌟${bonusMsg}`,
    event ? event.clientX : window.innerWidth / 2,
    event ? event.clientY : 160,
    "#10b981"
  );

  state.orders[orderIdx] = createOrder(orderIdx);
  renderAll();
}

// 주문 카드를 클릭했을 때 필요한 재료의 조합법/생성기를 하단 대화창 및 보드 하이라이트로 친절히 안내!
function explainOrderRecipe(ord) {
  sfx.tap();
  const descriptions = ord.reqs.map((req) => {
    const meta = getItemMeta(req.chain, req.level);
    if (req.chain === "combo") {
      return `[${meta.name}] = ${meta.recipeText}`;
    }
    const ch = CHAINS[req.chain];
    return `[${meta.name} Lv.${req.level}] = ${ch.generator ? ch.generator.name : ch.name}에서 생성 후 합성`;
  });

  setDialogue("💡 퀘스트 조합 가이드", descriptions.join(" / "));

  // 해당 체인의 생성기를 찾아 선택 표시
  const firstReq = ord.reqs[0];
  const targetGenChain =
    firstReq.chain === "combo"
      ? firstReq.level === 1
        ? "potion"
        : firstReq.level === 2
        ? "bakery"
        : "grimoire"
      : firstReq.chain;
  const genIdx = state.board.findIndex((it) => it && it.isGenerator && it.chain === targetGenChain);
  if (genIdx !== -1) {
    state.selectedIdx = genIdx;
    renderAll();
  }
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
// 🎃 전세계 공통 명절 기준 기한 한정 팝업 이벤트 엔진 (드래그&드롭 + 탭 합성 완벽 지원!)
// ============================================================================
function getActiveHolidayConfig() {
  return HOLIDAY_EVENTS.find((h) => h.id === state.eventState.activeHolidayId) || HOLIDAY_EVENTS[0];
}

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
  b[12] = { uid: newUid(), isGenerator: true, level: 1 };
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

  const targetLv = state.eventState.targetLv || 3;
  const targetMeta = h.items[Math.min(targetLv - 1, h.items.length - 1)];
  document.getElementById("event-mission-title").textContent =
    `🎯 명절 미션: [${targetMeta.name} (Lv.${targetLv})] 합성하기`;
  document.getElementById("ev-req-svg").innerHTML = GameSprites.getEventSVG(targetLv, false);

  const hasTargetOnBoard = state.eventState.board.some((it) => it && !it.isGenerator && intLv(it.level) >= targetLv);
  const claimBtn = document.getElementById("btn-claim-event-order");
  claimBtn.disabled = !hasTargetOnBoard;
  const rewardBolt = targetLv * 15;
  claimBtn.innerHTML = hasTargetOnBoard
    ? `🎁 미션 완료!<br/><small>+${rewardBolt}⚡ &amp; 본게임 재료</small>`
    : `Lv.${targetLv} 필요<br/><small>+${rewardBolt}⚡ &amp; 본게임 재료</small>`;

  document.getElementById("ev-free-spawns").textContent =
    state.eventState.freeSpawns > 0 ? `(무료 ${state.eventState.freeSpawns}회)` : `(⚡1 소모)`;

  const grid = document.getElementById("event-board-grid");
  grid.innerHTML = "";

  const selItem =
    state.eventState.selectedIdx !== null ? state.eventState.board[state.eventState.selectedIdx] : null;

  for (let i = 0; i < 25; i++) {
    const it = state.eventState.board[i];
    const isCompat =
      selItem &&
      !selItem.isGenerator &&
      it &&
      !it.isGenerator &&
      i !== state.eventState.selectedIdx &&
      intLv(it.level) === intLv(selItem.level) &&
      intLv(it.level) < h.items.length;

    const cell = document.createElement("div");
    cell.className = `ev-cell ${state.eventState.selectedIdx === i ? "ev-selected" : ""} ${
      isCompat ? "ev-merge-hint" : ""
    }`;
    cell.dataset.evIndex = i;

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
        const lv = intLv(it.level);
        const meta = h.items[Math.min(lv - 1, h.items.length - 1)];
        tile.className = "gh-tile chain-grimoire";
        tile.innerHTML = `
          <div class="tile-svg-wrap">${GameSprites.getEventSVG(lv, false)}</div>
          <span class="tile-label">${meta.name}</span>
          <span class="tile-lv-pill">Lv.${lv}</span>
        `;
      }
      cell.appendChild(tile);
    }

    grid.appendChild(cell);
  }
}

function intLv(v) {
  return Math.max(1, parseInt(v, 10) || 1);
}

// 🎃 이벤트 5x5 보드 전용 포인터 드래그 앤 드롭 & 탭 합성 엔진 (드래그해도, 탭해도 100% 합성됨!)
function setupEventBoardPointerDrag() {
  const gridEl = document.getElementById("event-board-grid");
  if (!gridEl) return;

  gridEl.addEventListener("pointerdown", (e) => {
    const cellEl = e.target.closest(".ev-cell");
    if (!cellEl) return;
    const idx = parseInt(cellEl.dataset.evIndex, 10);
    const item = state.eventState.board[idx];
    if (!item) {
      // 빈 칸을 탭했을 때 이전에 선택된 아이템이 있으면 이동
      if (state.eventState.selectedIdx !== null) {
        const prev = state.eventState.board[state.eventState.selectedIdx];
        if (prev && !prev.isGenerator) {
          state.eventState.board[idx] = prev;
          state.eventState.board[state.eventState.selectedIdx] = null;
          state.eventState.selectedIdx = idx;
          sfx.tap();
          renderHolidayEventModal();
          triggerAutoSave();
        }
      }
      return;
    }

    evDrag.active = true;
    evDrag.isDragging = false;
    evDrag.sourceIdx = idx;
    evDrag.startX = e.clientX;
    evDrag.startY = e.clientY;
    evDrag.hoverIdx = null;
  });

  window.addEventListener("pointermove", (e) => {
    if (!evDrag.active || evDrag.sourceIdx === null) return;
    const item = state.eventState.board[evDrag.sourceIdx];
    if (!item) return;

    const dist = Math.hypot(e.clientX - evDrag.startX, e.clientY - evDrag.startY);
    if (!evDrag.isDragging && dist >= 6) {
      evDrag.isDragging = true;
      state.eventState.selectedIdx = evDrag.sourceIdx;
      createEventDragGhost(item, e.clientX, e.clientY);
    }

    if (evDrag.isDragging && evDrag.ghostEl) {
      evDrag.ghostEl.style.left = `${e.clientX}px`;
      evDrag.ghostEl.style.top = `${e.clientY}px`;

      const underEl = document.elementFromPoint(e.clientX, e.clientY);
      const cellEl = underEl ? underEl.closest(".ev-cell") : null;
      evDrag.hoverIdx = cellEl ? parseInt(cellEl.dataset.evIndex, 10) : null;
    }
  });

  const endEvDrag = (e) => {
    if (!evDrag.active) return;
    const srcIdx = evDrag.sourceIdx;
    const wasDragging = evDrag.isDragging;
    const dstIdx = evDrag.hoverIdx;

    document.getElementById("drag-layer").innerHTML = "";
    evDrag.ghostEl = null;
    evDrag.active = false;
    evDrag.isDragging = false;
    evDrag.sourceIdx = null;
    evDrag.hoverIdx = null;

    if (wasDragging) {
      if (dstIdx !== null && dstIdx !== srcIdx) {
        executeEventMergeOrMove(srcIdx, dstIdx, e.clientX, e.clientY);
      } else {
        renderHolidayEventModal();
      }
    } else {
      handleEventCellTap(srcIdx, e);
    }
  };

  window.addEventListener("pointerup", endEvDrag);
  window.addEventListener("pointercancel", endEvDrag);
}

function createEventDragGhost(item, x, y) {
  const layer = document.getElementById("drag-layer");
  layer.innerHTML = "";
  const h = getActiveHolidayConfig();
  const lv = intLv(item.level);
  const meta = h.items[Math.min(lv - 1, h.items.length - 1)];

  const ghost = document.createElement("div");
  ghost.className = `gh-tile ${item.isGenerator ? "is-generator" : "chain-grimoire"} drag-ghost`;
  ghost.innerHTML = `
    <div class="tile-svg-wrap">${GameSprites.getEventSVG(lv, item.isGenerator)}</div>
    <span class="tile-label">${item.isGenerator ? h.genName : meta.name}</span>
  `;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  layer.appendChild(ghost);
  evDrag.ghostEl = ghost;
}

function executeEventMergeOrMove(srcIdx, dstIdx, clientX, clientY) {
  const b = state.eventState.board;
  const src = b[srcIdx];
  const dst = b[dstIdx];
  const h = getActiveHolidayConfig();
  if (!src) return;

  if (!dst) {
    b[dstIdx] = src;
    b[srcIdx] = null;
    state.eventState.selectedIdx = dstIdx;
    sfx.tap();
    renderHolidayEventModal();
    triggerAutoSave();
    return;
  }

  const srcLv = intLv(src.level);
  const dstLv = intLv(dst.level);

  // 동일 레벨 이벤트 아이템끼리 합성!
  if (!src.isGenerator && !dst.isGenerator && srcLv === dstLv && srcLv < h.items.length) {
    const nextLv = srcLv + 1;
    b[srcIdx] = null;
    b[dstIdx] = { uid: newUid(), isGenerator: false, level: nextLv };
    state.eventState.selectedIdx = dstIdx;

    const instantBolt = nextLv * 3;
    state.energy += instantBolt;
    const nextMeta = h.items[Math.min(nextLv - 1, h.items.length - 1)];
    sfx.merge(nextLv, true);
    floatText(
      `${h.icon} [${nextMeta.name} Lv.${nextLv}] 합성 성공! +${instantBolt}⚡`,
      clientX,
      clientY,
      "#fde047"
    );
    renderHolidayEventModal();
    renderAll();
    return;
  }

  // 자리 교체
  b[dstIdx] = src;
  b[srcIdx] = dst;
  state.eventState.selectedIdx = dstIdx;
  sfx.tap();
  renderHolidayEventModal();
  triggerAutoSave();
}

function handleEventCellTap(idx, e) {
  const b = state.eventState.board;
  const clicked = b[idx];
  const prevIdx = state.eventState.selectedIdx;
  const h = getActiveHolidayConfig();

  if (clicked && clicked.isGenerator) {
    state.eventState.selectedIdx = idx;
    spawnHolidayEventItem(e);
    return;
  }

  if (prevIdx !== null && prevIdx !== idx && b[prevIdx] && !b[prevIdx].isGenerator) {
    const src = b[prevIdx];
    if (
      clicked &&
      !clicked.isGenerator &&
      intLv(clicked.level) === intLv(src.level) &&
      intLv(src.level) < h.items.length
    ) {
      executeEventMergeOrMove(prevIdx, idx, e.clientX, e.clientY);
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
    floatText("이벤트 보드가 가득 찼습니다! 같은 아이콘을 드래그해 합치세요!", e.clientX, e.clientY, "#ef4444");
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
  const foundIdx = state.eventState.board.findIndex((it) => it && !it.isGenerator && intLv(it.level) >= targetLv);
  if (foundIdx === -1) {
    sfx.warn();
    return;
  }

  const item = state.eventState.board[foundIdx];
  const meta = h.items[Math.min(intLv(item.level) - 1, h.items.length - 1)];
  state.eventState.board[foundIdx] = null;

  const boltGain = targetLv * 15;
  state.energy += boltGain;
  sendRewardItemToMainGame(meta.mainChain, meta.mainLv);

  state.eventState.completedCount = (state.eventState.completedCount || 0) + 1;
  state.eventState.targetLv = (state.eventState.completedCount % 3) + 3;
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
  const meta = h.items[Math.min(intLv(it.level) - 1, h.items.length - 1)];
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

function showLevelUpBanner(newLv, rewardCoins, rewardEnergy, genName) {
  const banner = document.getElementById("levelup-banner");
  const titleEl = document.getElementById("lv-banner-title");
  const subEl = document.getElementById("lv-banner-sub");
  if (!banner) return;

  titleEl.textContent = `👑 연금술사 레벨 업! Lv.${newLv} 달성!`;
  subEl.textContent = `보상: +${rewardCoins}🪙 · +${rewardEnergy}⚡ · [${genName} Lv.1] 진화 파츠 지급!`;
  banner.classList.remove("hidden");

  if (lvBannerTimer) clearTimeout(lvBannerTimer);
  lvBannerTimer = setTimeout(() => {
    banner.classList.add("hidden");
  }, 3600);
}

function gainXP(amount) {
  state.xp += amount;
  let leveledUp = false;

  while (state.xp >= getRequiredXP(state.playerLv)) {
    state.xp -= getRequiredXP(state.playerLv);
    state.playerLv++;
    state.maxEnergy = NATURAL_ENERGY_CAP;

    const rewardCoins = 40 * state.playerLv;
    const rewardEnergy = 25;
    state.coins += rewardCoins;
    state.stars += 1;
    state.energy += rewardEnergy;

    // ★ 레벨업 시 생성기 진화 파츠(Lv.1 생성기)를 보드/가방에 지급하여 생성기 합성을 통한 성질 변화 지원!
    const coreGenOrder = ["potion", "grimoire", "herb", "bakery", "tea"];
    const rewardGenChain = coreGenOrder[(state.playerLv - 2) % coreGenOrder.length];
    grantGeneratorEvolutionPart(rewardGenChain, `Lv.${state.playerLv} 레벨업 보상`);
    const genMeta = getGeneratorTierMeta(rewardGenChain, 1);

    leveledUp = true;
    showLevelUpBanner(state.playerLv, rewardCoins, rewardEnergy, genMeta.name);
  }

  if (leveledUp) {
    sfx.serve();
  }
}

// ★ 생성기 작동: 생성기의 합성 진화 레벨(Lv.1 / Lv.2 / Lv.3)에 따라 배출 성질이 완전히 달라짐!
function triggerGenerator(cellIdx, clientX, clientY) {
  const gen = state.board[cellIdx];
  if (!gen || !gen.isGenerator) return;

  if (state.energy < 1) {
    sfx.warn();
    floatText("⚡ 번개가 부족합니다! 5분마다 충전되거나 이벤트로 얻으세요!", clientX, clientY, "#ef4444");
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

  const genLv = Math.max(1, gen.level || 1);
  const chDef = CHAINS[gen.chain];
  let spawnChain = gen.chain;
  let spawnLv = 1;

  if (genLv === 1) {
    // [Lv.1 기본 생성기 성질]: Lv.1(82%) 또는 Lv.2(18%) 생성 + 가마솥은 20% 보석 원석(Lv.1)
    spawnLv = Math.random() < 0.18 ? 2 : 1;
    if (chDef.rareDropChain && Math.random() < chDef.rareChance) {
      spawnChain = chDef.rareDropChain;
      spawnLv = 1;
    }
  } else if (genLv === 2) {
    // [Lv.2 진화 생성기 성질]: 고급 재료(Lv.2~3) 대폭 상승 + 이종 조합 파트너 재료나 2단계 사파이어 보석 배출!
    const roll = Math.random();
    if (roll < 0.22) {
      // 이종 조합용 파트너 재료 자동 공명 생성!
      if (gen.chain === "potion") {
        spawnChain = "herb";
        spawnLv = 2;
      } else if (gen.chain === "herb") {
        spawnChain = "potion";
        spawnLv = 2;
      } else if (gen.chain === "bakery") {
        spawnChain = "tea";
        spawnLv = 3;
      } else if (gen.chain === "tea") {
        spawnChain = "bakery";
        spawnLv = 2;
      } else {
        spawnChain = "gem";
        spawnLv = 2;
      }
      floatText(`✨ Lv.2 각성 효과! 조합 파트너 재료 공명 생성!`, clientX, clientY, "#34d399");
    } else if (chDef.rareDropChain && roll < 0.42) {
      spawnChain = chDef.rareDropChain;
      spawnLv = 2; // 원석이 아닌 Lv.2 사파이어 즉시 배출!
    } else {
      spawnLv = Math.random() < 0.35 ? 3 : 2;
    }
  } else {
    // [Lv.3 신화 생성기 성질]: Lv.2~4 상급 재료 배출 + 20% 확률로 스페셜 이종 조합 완제품 즉시 연성!
    const roll = Math.random();
    if (roll < 0.2) {
      spawnChain = "combo";
      spawnLv = gen.chain === "potion" || gen.chain === "herb" ? 1 : gen.chain === "bakery" || gen.chain === "tea" ? 2 : 3;
      floatText(`👑 Lv.3 신화 성질 발동! 스페셜 조합품 직접 연성!`, clientX, clientY, "#fde047");
    } else if (chDef.rareDropChain && roll < 0.42) {
      spawnChain = chDef.rareDropChain;
      spawnLv = 3; // Lv.3 문스톤 결정 즉시 배출!
    } else {
      spawnLv = Math.random() < 0.3 ? 4 : Math.random() < 0.7 ? 3 : 2;
    }
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

// 드래그 앤 드롭 합치기 (일반 재료 합성 + 이종 재료 조합 + ★생성기 합성 진화★)
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

  // ★ 1. 같은 생성기끼리 드래그 합성하여 상위 성질 생성기(Lv.1 ➔ Lv.2 ➔ Lv.3)로 진화!
  if (
    src.isGenerator &&
    dst.isGenerator &&
    src.chain === dst.chain &&
    (src.level || 1) === (dst.level || 1) &&
    (src.level || 1) < 3
  ) {
    const nextGenLv = (src.level || 1) + 1;
    const nextGenMeta = getGeneratorTierMeta(src.chain, nextGenLv);
    state.board[srcIdx] = null;
    state.board[dstIdx] = {
      uid: newUid(),
      state: "active",
      isGenerator: true,
      chain: src.chain,
      level: nextGenLv,
      justSpawned: true,
    };
    sfx.serve();
    gainXP(25);
    state.selectedIdx = dstIdx;
    setDialogue("🔥 생성기 합성 진화 성공!", `${nextGenMeta.name}(Lv.${nextGenLv})으로 진화하여 새로운 성질을 획득했습니다!`);
    floatText(`🔥 생성기 진화! [${nextGenMeta.name} Lv.${nextGenLv}]`, clientX, clientY, "#fde047");
    renderAll();
    return;
  }

  // 2. 이종 재료 조합 레시피(Cross-Chain Combination) 체크
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

    // ★ 번개/돈 무작위 드롭 확률 대폭 축소: Lv.4 이상 고단계 합성 시에만 12% 확률로 드롭 (distracting 방지!)
    if (nextLv >= 4 && Math.random() < 0.12) {
      const bonusCell = findNearestEmptyCell(dstIdx);
      if (bonusCell !== -1) {
        state.board[bonusCell] = {
          uid: newUid(),
          state: "active",
          isGenerator: false,
          chain: Math.random() < 0.5 ? "energy" : "coin",
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

// 메인 보드 포인터 드래그 엔진
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
  const label = item.isGenerator ? getGeneratorTierMeta(item.chain, item.level).name : meta.name;

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
  document.querySelectorAll(".gh-cell").forEach((cellEl) => {
    const idx = parseInt(cellEl.dataset.index, 10);
    if (idx === drag.sourceIdx) return;
    const target = state.board[idx];
    if (!target || target.state === "crate") return;

    // 1. 같은 생성기끼리 합성 진화 하이라이트
    if (dragItem.isGenerator) {
      if (
        target.isGenerator &&
        target.chain === dragItem.chain &&
        (target.level || 1) === (dragItem.level || 1) &&
        (dragItem.level || 1) < 3
      ) {
        cellEl.classList.add("cell-merge-hint");
      }
      return;
    }

    if (target.isGenerator) return;
    const meta = getItemMeta(dragItem.chain, dragItem.level);

    // 2. 일반 아이템 동일 레벨 합성 하이라이트
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
    soundEnabled: sfx.enabled,
    cauldronPartGranted: state.cauldronPartGranted,
    lastSeenVersion: state.lastSeenVersion || APP_VERSION,
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
  document.getElementById("energy-timer").textContent =
    state.energy >= NATURAL_ENERGY_CAP ? `MAX(100)` : formatMMSS(state.energyCountdown);
  document.getElementById("res-coins").textContent = state.coins;
  document.getElementById("res-stars").textContent = state.stars;

  const verLabel = document.getElementById("top-version-label");
  if (verLabel) verLabel.textContent = APP_VERSION;
  const setVerText = document.getElementById("settings-version-text");
  if (setVerText) setVerText.textContent = APP_VERSION;
}

function updateCastleViewUI(orderStatus = null) {
  if (!window.Interior3DEngine) return;
  const stats = Interior3DEngine.getProgressStats();
  document.getElementById("room-title-label").textContent = stats.themeTitle;
  document.getElementById("room-prog-badge").textContent = `${stats.done} / ${stats.total} 복구됨`;

  const currentRoom = stats.allThemes[stats.currentThemeKey] || stats.allThemes.alchemy;

  const fabIconEl = document.getElementById("fab-section-icon");
  const fabTitleEl = document.getElementById("fab-section-title");
  if (fabIconEl) fabIconEl.textContent = currentRoom.sectionIcon || "🔮";
  if (fabTitleEl) {
    fabTitleEl.textContent = currentRoom.shortName ? currentRoom.shortName.replace(/^[^\s]+\s/, "") : "마녀의 공방";
  }

  if (orderStatus) {
    const anyOrderReady = orderStatus.some((st) => st.allReady);
    const fabBadge = document.getElementById("fab-order-badge");
    if (fabBadge) fabBadge.classList.toggle("hidden", !anyOrderReady);
  }

  const canRenovateAny = stats.nextSpot && state.stars >= stats.nextSpot.cost;
  const castleDot = document.getElementById("castle-ready-dot");
  if (castleDot) castleDot.classList.toggle("hidden", !canRenovateAny);

  const totalProgEl = document.getElementById("castle-total-prog");
  if (totalProgEl) {
    totalProgEl.textContent = `마녀의 성 전체 ${stats.totalCastleDone}/${stats.totalCastleSpots}`;
  }
  const zoneNameEl = document.getElementById("castle-quest-zone-name");
  if (zoneNameEl) {
    zoneNameEl.textContent = `📜 ${currentRoom.shortName} 퀘스트 (완료 시 생성기 진화 파츠 지급)`;
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

// ★ 손님 주문(Quest) 렌더링: 각 요구 재료가 어떤 조합이나 생성기에서 나오는지 카드 하단에 즉시 표시!
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
          <div class="order-req-box ${fulfilled ? "fulfilled" : ""}" title="${meta.name}: ${getRequirementRecipeSummary(req)}">
            ${fulfilled ? '<span class="req-check">✔</span>' : ""}
            <div class="order-req-svg">${svgArt}</div>
            <span class="req-lv">${req.chain === "combo" ? "⚗️조합" : "Lv." + req.level}</span>
          </div>
        `;
      })
      .join("");

    // 카드 하단에 들어갈 조합법 / 생성기 출처 힌트 문자열
    const recipeSummaryText = ord.reqs.map((r) => getRequirementRecipeSummary(r)).join(" · ");

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
      <div class="order-recipe-hint" title="클릭하면 상세 조합법을 안내합니다">💡 ${recipeSummaryText}</div>
    `;

    card.addEventListener("click", () => {
      explainOrderRecipe(ord);
    });

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
        const genLv = Math.max(1, item.level || 1);
        const genTier = getGeneratorTierMeta(item.chain, genLv);
        tile.className = `gh-tile is-generator ${item.justSpawned ? "pop-spawn" : ""}`;
        tile.innerHTML = `
          <div class="tile-svg-wrap">${GameSprites.getItemSVG(item.chain, genLv, true)}</div>
          <span class="tile-label">${genTier.name}</span>
          <span class="tile-lv-pill">Lv.${genLv}⚡</span>
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
    iconEl.innerHTML = GameSprites.getItemSVG("potion", 2, true);
    nameEl.textContent = "타일을 탭하거나 드래그해 합성하세요";
    lvEl.textContent = "안내";
    descEl.textContent = "같은 생성기끼리도 합성(Lv.1➔Lv.2➔Lv.3)하여 새로운 성질로 진화시킬 수 있습니다!";
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
    const genLv = Math.max(1, item.level || 1);
    const genTier = getGeneratorTierMeta(item.chain, genLv);
    iconEl.innerHTML = GameSprites.getItemSVG(item.chain, genLv, true);
    nameEl.textContent = genTier.name;
    lvEl.textContent = `생성기 Lv.${genLv}/3`;
    descEl.textContent = genTier.desc;

    const btn = document.createElement("button");
    btn.className = "insp-btn spawn-btn";
    btn.textContent = "⚡ 생성";
    btn.addEventListener("click", (e) => triggerGenerator(state.selectedIdx, e.clientX, e.clientY));
    actionsEl.appendChild(btn);

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

// 🆕 버전 업데이트 알림 및 버전 Progression 기록 모달 렌더링
function renderChangelogModal() {
  const body = document.getElementById("changelog-body");
  if (!body) return;
  document.getElementById("changelog-modal-title").textContent = `🆕 업데이트 노트 (${APP_VERSION})`;

  body.innerHTML = VERSION_HISTORY.map(
    (v, idx) => `
    <div class="codex-card" style="background:${idx === 0 ? "#fefce8" : "#ffffff"};border-color:${
      idx === 0 ? "#f59e0b" : "#cbd5e1"
    }">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <strong style="font-size:13px;color:#3b0764">🚀 ${v.version} — ${v.title}</strong>
        <span style="font-size:9.5px;font-weight:900;padding:2px 7px;border-radius:99px;background:${
          idx === 0 ? "#ea580c" : "#64748b"
        };color:#fff">${v.badge} · ${v.date}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#1e293b;line-height:1.42">
        ${v.changes.map((line) => `<div>• ${line}</div>`).join("")}
      </div>
    </div>
  `
  ).join("");
}

function renderLevelModal() {
  const body = document.getElementById("level-modal-body");
  if (!body) return;
  const reqXP = getRequiredXP(state.playerLv);
  const pct = Math.min(100, Math.round((state.xp / reqXP) * 100));
  const coreGenOrder = ["potion", "grimoire", "herb", "bakery", "tea"];

  let milestonesHtml = "";
  for (let lv = 2; lv <= Math.max(8, state.playerLv + 3); lv++) {
    const unlocked = state.playerLv >= lv;
    const coinBonus = 40 * lv;
    const rewardGenChain = coreGenOrder[(lv - 2) % coreGenOrder.length];
    const genMeta = getGeneratorTierMeta(rewardGenChain, 1);

    milestonesHtml += `
      <div class="codex-card" style="display:flex;align-items:center;justify-content:space-between;background:${
        unlocked ? "#f3e8ff" : "#ffffff"
      };border-color:${unlocked ? "#a855f7" : "#cbd5e1"}">
        <div>
          <strong style="font-size:12.5px;color:#3b0764">👑 레벨 ${lv} 달성 혜택</strong>
          <p style="font-size:11px;color:#475569;margin-top:2px">
            보상: <b>+${coinBonus}🪙 · +25⚡ · +1🌟 · 🔥[${genMeta.name} Lv.1] 진화 파츠</b>
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
        🔥 <b>생성기 합성 &amp; 성질 진화</b>: 레벨업하거나 성 인테리어 퀘스트를 완료할 때마다 <b>생성기 진화 파츠(Lv.1)</b>를 획득합니다. 같은 생성기 2개를 합치면 <b>Lv.2 ➔ Lv.3</b>으로 외형과 생성 성질이 진화합니다!
      </p>
    </div>
    ${milestonesHtml}
  `;
}

// 도감 모달 (생성기 합성 진화 도감 + 스페셜 이종 조합 레시피 + 일반 체인)
function renderCodexModal() {
  const body = document.getElementById("codex-body");
  body.innerHTML = "";

  // 1. 생성기 합성 진화(Lv.1 ➔ Lv.2 ➔ Lv.3) 안내 카드
  const genEvoCard = document.createElement("div");
  genEvoCard.className = "codex-card";
  genEvoCard.style.background = "#f3e8ff";
  genEvoCard.style.borderColor = "#9333ea";
  const potTiers = CHAINS.potion.generator.tiers;
  genEvoCard.innerHTML = `
    <h4>🔥 생성기 합성 진화 (Lv.1 ➔ Lv.2 ➔ Lv.3 성질 변화)</h4>
    <p style="font-size:11px;color:#475569;margin-bottom:6px">레벨업이나 퀘스트 완료로 얻은 같은 생성기 2개를 합치면 새로운 성질로 진화합니다!</p>
    <div class="codex-flow">
      ${potTiers
        .map(
          (t, idx) => `
        <div class="codex-node" style="flex:1">
          <div class="codex-svg-mini">${GameSprites.getItemSVG("potion", t.level, true)}</div>
          <strong style="font-size:9.5px">${t.name}</strong>
          <small style="font-size:8.5px;color:#6d28d9">Lv.${t.level}</small>
        </div>
        ${idx < potTiers.length - 1 ? '<span style="color:#9333ea;font-weight:900">➔</span>' : ""}
      `
        )
        .join("")}
    </div>
  `;
  body.appendChild(genEvoCard);

  // 2. 스페셜 이종 조합 카드
  const comboCard = document.createElement("div");
  comboCard.className = "codex-card";
  comboCard.style.background = "#fefce8";
  comboCard.style.borderColor = "#f59e0b";
  comboCard.innerHTML = `
    <h4>⚗️ 스페셜 이종 재료 조합(Cross-Combination) 레시피</h4>
    <p style="font-size:11px;color:#475569;margin-bottom:6px">서로 다른 체인의 특정 재료를 드래그해 겹치면 새로운 스페셜 메뉴가 조합됩니다!</p>
    <div style="display:flex;flex-direction:column;gap:4px;font-size:11.5px;font-weight:700;color:#1e293b">
      <div>1️⃣ 🔥초급 마나물약(Lv.2) + 🪴몽환 달버섯(Lv.2) ➔ 🌟 특제 활력비약</div>
      <div>2️⃣ 🧁버터 크루아상(Lv.2) + 🫖에스프레소(Lv.3) ➔ 🍽️ 모닝 브런치세트</div>
      <div>3️⃣ 🦉봉인 주문서(Lv.2) + 💎사파이어(Lv.2) ➔ 🔮 마력 각인룬스톤</div>
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
      const isGen = !!it.isGenerator;
      const meta = isGen ? getGeneratorTierMeta(it.chain, it.level) : getItemMeta(it.chain, it.level);
      const tile = document.createElement("div");
      tile.className = `gh-tile ${isGen ? "is-generator" : meta.css}`;
      tile.style.width = "68px";
      tile.style.height = "62px";
      tile.innerHTML = `
        <div class="tile-svg-wrap">${GameSprites.getItemSVG(it.chain, it.level || 1, isGen)}</div>
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

function updateSoundButtonUI() {
  const sndBtn = document.getElementById("btn-toggle-sound");
  if (sndBtn) {
    sndBtn.textContent = sfx.enabled ? "🔊 사운드 켜짐" : "🔇 사운드 꺼짐";
  }
}

function bindUIEvents() {
  document.getElementById("btn-go-castle").addEventListener("click", () => {
    switchScreen("castle");
  });

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

  document.getElementById("btn-enter-merge").addEventListener("click", () => {
    switchScreen("merge");
  });

  document.querySelectorAll(".theme-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      sfx.tap();
      selectCastleThemeTab(tab.dataset.theme);
    });
  });

  document.getElementById("btn-cutscene-next").addEventListener("click", () => {
    closeOrAdvanceCutscene(false);
  });
  document.getElementById("btn-skip-cutscene").addEventListener("click", () => {
    closeOrAdvanceCutscene(true);
  });

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

  document.getElementById("btn-open-level").addEventListener("click", () => {
    renderLevelModal();
    document.getElementById("modal-level").classList.remove("hidden");
  });

  // ⚙️ 통합 설정 모달 열기
  document.getElementById("btn-open-settings").addEventListener("click", async () => {
    if (window.GameDB) {
      const code = await GameDB.exportBackupString();
      document.getElementById("backup-code-box").value = code;
    }
    updateSoundButtonUI();
    document.getElementById("modal-settings").classList.remove("hidden");
  });

  // 🆕 버전 업데이트 노트 & 히스토리 모달 열기
  const openChangelog = () => {
    sfx.tap();
    renderChangelogModal();
    document.getElementById("modal-changelog").classList.remove("hidden");
  };
  document.getElementById("btn-open-changelog").addEventListener("click", openChangelog);
  document.getElementById("btn-settings-open-changelog").addEventListener("click", () => {
    document.getElementById("modal-settings").classList.add("hidden");
    openChangelog();
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

  // 설정 모달 내 사운드 토글
  const sndBtn = document.getElementById("btn-toggle-sound");
  sndBtn.addEventListener("click", () => {
    sfx.enabled = !sfx.enabled;
    state.soundEnabled = sfx.enabled;
    updateSoundButtonUI();
    triggerAutoSave();
  });

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
