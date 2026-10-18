// chains.ts — 아이템 체인(재료 Lv.1~8, 생성기 ★1~3, 수집 아이템) 데이터와 조회 함수 (v2.5 game.js CHAINS 이전)

import type { ChainId, CoreChain, ZoneKey } from "../types";

export interface ChainItem {
  level: number;
  name: string;
  sell?: number;
  rewardType?: "coins" | "energy";
  amount?: number;
  shortRecipe?: string;
  recipeText?: string;
}

export interface GeneratorTier {
  level: number;
  name: string;
  desc: string;
}

export interface ChainDef {
  id: ChainId;
  name: string;
  shortGen?: string;
  css: string;
  isCollectible?: boolean;
  rareDropChain?: ChainId;
  rareChance?: number;
  generator?: { name: string; desc: string; tiers: GeneratorTier[] };
  items: ChainItem[];
}

export const CHAINS: Record<ChainId, ChainDef> = 
{
  potion: {
    id: "potion",
    name: "비전 물약 체인",
    shortGen: "🔥가마솥",
    css: "chain-potion",
    generator: {
      name: "마법 가마솥",
      desc: "탭하면 물약 재료와 가끔 마법 광석을 생성합니다(⚡). 같은 가마솥끼리 합성하면 등급이 올라갑니다!",
      tiers: [
        {
          level: 1,
          name: "수습 마법 가마솥",
          desc: "[★ 기본] 물약 재료(Lv.1~2)와 20% 확률로 마법 광석을 생성합니다. 배속을 써도 최대 Lv.3까지 나와요. 가마솥 2개를 합치면 ★★로 진화합니다!"
        },
        {
          level: 2,
          name: "황금 연금술 가마솥",
          desc: "[★★ 진화] 물약(Lv.2~3)과 가끔 마법 광석(Lv.2)을 생성합니다. 배속을 쓰면 최대 Lv.5까지 바로 나와요!"
        },
        {
          level: 3,
          name: "태고의 성배 가마솥",
          desc: "[★★★ 신화] 상급 비약(Lv.2~4)과 가끔 마법 광석(Lv.3)을 생성합니다. 배속을 쓰면 최대 Lv.6까지 바로 나와요!"
        }
      ]
    },
    rareDropChain: "gem",
    rareChance: 0.2,
    items: [
      {
        level: 1,
        name: "마나 이슬",
        sell: 2
      },
      {
        level: 2,
        name: "초급 마나물약",
        sell: 5
      },
      {
        level: 3,
        name: "달빛 플라스크",
        sell: 12
      },
      {
        level: 4,
        name: "자수정 비약",
        sell: 28
      },
      {
        level: 5,
        name: "성운 엘릭서",
        sell: 65
      },
      {
        level: 6,
        name: "신성 날개비약",
        sell: 150
      },
      {
        level: 7,
        name: "시간의 모래 비약",
        sell: 340
      },
      {
        level: 8,
        name: "마녀왕의 불로약",
        sell: 780
      }
    ]
  },
  grimoire: {
    id: "grimoire",
    name: "고대 마도서 체인",
    shortGen: "🦉책장",
    css: "chain-grimoire",
    generator: {
      name: "고대 마법책장",
      desc: "탭하면 마도서 재료를 생성합니다(⚡). 책장끼리 합성하면 등급이 올라갑니다!",
      tiers: [
        {
          level: 1,
          name: "고대 마법책장",
          desc: "[★ 기본] 마력 깃펜(Lv.1)과 봉인 주문서(Lv.2)를 생성합니다. 배속을 써도 최대 Lv.3까지 나와요."
        },
        {
          level: 2,
          name: "비전 아카이브 서가",
          desc: "[★★ 진화] 주문서와 화염 마도서(Lv.2~3)를 생성합니다. 배속을 쓰면 최대 Lv.5까지 바로 나와요!"
        },
        {
          level: 3,
          name: "신화 아카식 서고",
          desc: "[★★★ 신화] 고위 마도서(Lv.2~4)를 생성합니다. 배속을 쓰면 최대 Lv.6까지 바로 나와요!"
        }
      ]
    },
    items: [
      {
        level: 1,
        name: "마력 깃펜",
        sell: 2
      },
      {
        level: 2,
        name: "봉인 주문서",
        sell: 5
      },
      {
        level: 3,
        name: "화염 마도서",
        sell: 12
      },
      {
        level: 4,
        name: "심연 백과사전",
        sell: 28
      },
      {
        level: 5,
        name: "예언의 마도서",
        sell: 65
      },
      {
        level: 6,
        name: "태고 신화비석",
        sell: 150
      },
      {
        level: 7,
        name: "금단의 고문서",
        sell: 340
      },
      {
        level: 8,
        name: "셀레네의 창세록",
        sell: 780
      }
    ]
  },
  herb: {
    id: "herb",
    name: "달빛 마법식물 체인",
    shortGen: "🪴화분",
    css: "chain-herb",
    generator: {
      name: "달빛 온실화분",
      desc: "탭하면 마법식물 재료를 생성합니다(⚡). 화분끼리 합성하면 등급이 올라갑니다!",
      tiers: [
        {
          level: 1,
          name: "달빛 온실화분",
          desc: "[★ 기본] 야광 포자(Lv.1)와 몽환 달버섯(Lv.2)을 생성합니다. 배속을 써도 최대 Lv.3까지 나와요."
        },
        {
          level: 2,
          name: "에메랄드 테라리움",
          desc: "[★★ 진화] 달버섯과 만드라고라(Lv.2~3)를 생성합니다. 배속을 쓰면 최대 Lv.5까지 바로 나와요!"
        },
        {
          level: 3,
          name: "세계수의 성소 화단",
          desc: "[★★★ 신화] 희귀 환수 식물(Lv.2~4)을 생성합니다. 배속을 쓰면 최대 Lv.6까지 바로 나와요!"
        }
      ]
    },
    items: [
      {
        level: 1,
        name: "야광 포자",
        sell: 2
      },
      {
        level: 2,
        name: "몽환 달버섯",
        sell: 5
      },
      {
        level: 3,
        name: "만드라고라",
        sell: 12
      },
      {
        level: 4,
        name: "영혼 꽃나비",
        sell: 28
      },
      {
        level: 5,
        name: "불사조의 알",
        sell: 65
      },
      {
        level: 6,
        name: "스타 드래곤",
        sell: 150
      },
      {
        level: 7,
        name: "월광 세계수",
        sell: 340
      },
      {
        level: 8,
        name: "생명의 세계수",
        sell: 780
      }
    ]
  },
  bakery: {
    id: "bakery",
    name: "화로 베이커리 체인",
    shortGen: "🧁오븐",
    css: "chain-bakery",
    generator: {
      name: "마법 화로오븐",
      desc: "탭하면 베이커리 재료를 생성합니다(⚡). 오븐끼리 합성하면 등급이 올라갑니다!",
      tiers: [
        {
          level: 1,
          name: "마법 화로오븐",
          desc: "[★ 기본] 밀가루 반죽(Lv.1)과 버터 크루아상(Lv.2)을 구워냅니다. 배속을 써도 최대 Lv.3까지 나와요."
        },
        {
          level: 2,
          name: "황금 파티시에 화덕",
          desc: "[★★ 진화] 크루아상과 베리 타르트(Lv.2~3)를 구워냅니다. 배속을 쓰면 최대 Lv.5까지 바로 나와요!"
        },
        {
          level: 3,
          name: "로얄 블랑제리 신화오븐",
          desc: "[★★★ 신화] 고급 디저트(Lv.2~4)를 구워냅니다. 배속을 쓰면 최대 Lv.6까지 바로 나와요!"
        }
      ]
    },
    items: [
      {
        level: 1,
        name: "밀가루 반죽",
        sell: 2
      },
      {
        level: 2,
        name: "버터 크루아상",
        sell: 5
      },
      {
        level: 3,
        name: "베리 타르트",
        sell: 12
      },
      {
        level: 4,
        name: "달빛 마카롱",
        sell: 28
      },
      {
        level: 5,
        name: "쇼트케이크",
        sell: 65
      },
      {
        level: 6,
        name: "로얄 3단케이크",
        sell: 150
      },
      {
        level: 7,
        name: "왕실 디저트 타워",
        sell: 340
      },
      {
        level: 8,
        name: "황금 축제 케이크",
        sell: 780
      }
    ]
  },
  tea: {
    id: "tea",
    name: "연금술 티 & 카페 체인",
    shortGen: "🫖티포트",
    css: "chain-tea",
    generator: {
      name: "황실 티포트",
      desc: "탭하면 차/커피 재료를 생성합니다(⚡). 티포트끼리 합성하면 등급이 올라갑니다!",
      tiers: [
        {
          level: 1,
          name: "황실 티포트",
          desc: "[★ 기본] 향긋한 찻잎(Lv.1)과 캐모마일 티(Lv.2)를 우려냅니다. 배속을 써도 최대 Lv.3까지 나와요."
        },
        {
          level: 2,
          name: "오로라 바리스타 포트",
          desc: "[★★ 진화] 캐모마일 티와 에스프레소(Lv.2~3)를 추출합니다. 배속을 쓰면 최대 Lv.5까지 바로 나와요!"
        },
        {
          level: 3,
          name: "여왕의 신화 티메이커",
          desc: "[★★★ 신화] 최고급 음료(Lv.2~4)를 추출합니다. 배속을 쓰면 최대 Lv.6까지 바로 나와요!"
        }
      ]
    },
    items: [
      {
        level: 1,
        name: "향긋한 찻잎",
        sell: 2
      },
      {
        level: 2,
        name: "캐모마일 티",
        sell: 5
      },
      {
        level: 3,
        name: "에스프레소",
        sell: 12
      },
      {
        level: 4,
        name: "오로라 밀크티",
        sell: 28
      },
      {
        level: 5,
        name: "황실 티세트",
        sell: 70
      },
      {
        level: 6,
        name: "금빛 애프터눈티",
        sell: 160
      },
      {
        level: 7,
        name: "별무리 찻주전자 세트",
        sell: 360
      },
      {
        level: 8,
        name: "여왕의 만찬 티파티",
        sell: 820
      }
    ]
  },
  gem: {
    id: "gem",
    name: "마법 광석 체인 (가마솥 부산물)",
    shortGen: "⛏️가마솥부산물",
    css: "chain-gem",
    items: [
      {
        level: 1,
        name: "광석 파편",
        sell: 4
      },
      {
        level: 2,
        name: "사파이어",
        sell: 10
      },
      {
        level: 3,
        name: "문스톤 결정",
        sell: 25
      },
      {
        level: 4,
        name: "태양석 브로치",
        sell: 60
      },
      {
        level: 5,
        name: "여왕의 티아라",
        sell: 160
      },
      {
        level: 6,
        name: "왕관 보석함",
        sell: 380
      },
      {
        level: 7,
        name: "별의 왕홀",
        sell: 900
      },
      {
        level: 8,
        name: "마녀 여왕의 왕관",
        sell: 2100
      }
    ]
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
        recipeText: "🔥초급 마나물약(Lv.2) + 🪴몽환 달버섯(Lv.2) 드래그 조합"
      },
      {
        level: 2,
        name: "모닝 브런치세트",
        sell: 50,
        shortRecipe: "⚗️크루아상Lv2+커피Lv3",
        recipeText: "🧁버터 크루아상(Lv.2) + 🫖에스프레소(Lv.3) 드래그 조합"
      },
      {
        level: 3,
        name: "마력 각인룬스톤",
        sell: 55,
        shortRecipe: "⚗️주문서Lv2+사파이어Lv2",
        recipeText: "🦉봉인 주문서(Lv.2) + 💎사파이어(Lv.2) 드래그 조합"
      }
    ]
  },
  coin: {
    id: "coin",
    name: "황금 금화 체인",
    css: "chain-coin",
    isCollectible: true,
    items: [
      {
        level: 1,
        name: "청동 주화 (+15🪙)",
        rewardType: "coins",
        amount: 15
      },
      {
        level: 2,
        name: "금화 더미 (+45🪙)",
        rewardType: "coins",
        amount: 45
      },
      {
        level: 3,
        name: "왕실 보물상자 (+130🪙)",
        rewardType: "coins",
        amount: 130
      }
    ]
  },
  energy: {
    id: "energy",
    name: "⚡ 번개(Lightning) 경제 체인",
    css: "chain-energy",
    isCollectible: true,
    items: [
      {
        level: 1,
        name: "작은 번개 조각 (+5⚡)",
        rewardType: "energy",
        amount: 5
      },
      {
        level: 2,
        name: "번개 에너지 구슬 (+15⚡)",
        rewardType: "energy",
        amount: 15
      },
      {
        level: 3,
        name: "번개 폭풍 결정 (+40⚡)",
        rewardType: "energy",
        amount: 40
      },
      {
        level: 4,
        name: "로얄 번개 코어 (+100⚡)",
        rewardType: "energy",
        amount: 100
      }
    ]
  }
};

// 주문을 맡기는 핵심 생산 체인 (보석/광석·수집 체인 제외)
export const CORE_CHAINS: CoreChain[] = ["potion", "grimoire", "herb", "bakery", "tea"];

export interface ItemMeta extends ChainItem {
  chainName: string;
  css: string;
  maxLv: number;
  isCollectible: boolean;
}

export function getItemMeta(chain: ChainId, level: number): ItemMeta {
  const ch = CHAINS[chain];
  if (!ch) return { level: 1, name: "미확인", css: "", maxLv: 1, chainName: "", isCollectible: false };
  const item = ch.items[Math.min(Math.max(1, level) - 1, ch.items.length - 1)];
  return { ...item, chainName: ch.name, css: ch.css, maxLv: ch.items.length, isCollectible: !!ch.isCollectible };
}

export function getGeneratorTierMeta(chain: ChainId, level = 1): GeneratorTier & { maxGenLv: number } {
  const ch = CHAINS[chain];
  if (!ch || !ch.generator) return { level: 1, name: "생성기", desc: "", maxGenLv: 3 };
  const tiers = ch.generator.tiers;
  const tier = tiers[Math.min(Math.max(1, level) - 1, tiers.length - 1)] ?? { level: 1, name: ch.generator.name, desc: ch.generator.desc };
  return { ...tier, maxGenLv: tiers.length || 3 };
}

// 생성기 등급 표기 (재료와 헷갈리지 않도록 Lv. 대신 ★ 사용)
export function formatGeneratorStars(lv: number): string {
  const t = Math.min(3, Math.max(1, lv || 1));
  return "★".repeat(t) + "☆".repeat(3 - t);
}

export function getRequiredXP(lv: number): number {
  return 50 + (lv - 1) * 20;
}

const THEME_GENERATOR: Record<ZoneKey, CoreChain> = { alchemy: "potion", harbor: "bakery", garden: "herb", banquet: "grimoire" };

export function getGeneratorChainForTheme(zoneKey: ZoneKey): CoreChain {
  return THEME_GENERATOR[zoneKey] ?? "potion";
}
