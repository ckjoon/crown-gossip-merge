// holidays.ts — 전세계 공통 명절 기준 기한 한정 이벤트 (당일 5일 전 ~ 당일 24:00). 이벤트는 번개를 주지 않는다 (v2.5 리뷰 반영)

import type { ChainId } from "../types";

export interface HolidayItem {
  level: number;
  name: string;
  mainChain: ChainId;
  mainLv: number;
}

export interface HolidayDef {
  id: string;
  icon: string;
  name: string;
  month: number;
  day: number;
  periodLabel: string;
  genName: string;
  items: HolidayItem[];
}

export const HOLIDAY_EVENTS: HolidayDef[] = [
  {
    id: "halloween",
    icon: "🎃",
    name: "할로윈 마법 호박제",
    month: 10,
    day: 31,
    periodLabel: "할로윈 5일 전(10/26) ~ 당일(10/31 24:00)",
    genName: "호박 마법 가마솥",
    items: [
      {
        level: 1,
        name: "유령 사탕",
        mainChain: "potion",
        mainLv: 1
      },
      {
        level: 2,
        name: "잭오랜턴 호박",
        mainChain: "herb",
        mainLv: 2
      },
      {
        level: 3,
        name: "마녀 고깔모자",
        mainChain: "bakery",
        mainLv: 3
      },
      {
        level: 4,
        name: "영혼 호박 등불",
        mainChain: "grimoire",
        mainLv: 3
      },
      {
        level: 5,
        name: "할로윈 호박왕관",
        mainChain: "gem",
        mainLv: 4
      }
    ]
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
      {
        level: 1,
        name: "민트 지팡이사탕",
        mainChain: "tea",
        mainLv: 1
      },
      {
        level: 2,
        name: "진저브레드 쿠키",
        mainChain: "bakery",
        mainLv: 2
      },
      {
        level: 3,
        name: "성탄 루돌프 방울",
        mainChain: "potion",
        mainLv: 3
      },
      {
        level: 4,
        name: "눈꽃 오르골 등불",
        mainChain: "herb",
        mainLv: 3
      },
      {
        level: 5,
        name: "산타의 황금왕관",
        mainChain: "gem",
        mainLv: 4
      }
    ]
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
      {
        level: 1,
        name: "행운 엽전사탕",
        mainChain: "potion",
        mainLv: 1
      },
      {
        level: 2,
        name: "비단 복주머니",
        mainChain: "tea",
        mainLv: 2
      },
      {
        level: 3,
        name: "청사초롱 등불",
        mainChain: "grimoire",
        mainLv: 3
      },
      {
        level: 4,
        name: "일월오봉도 부적",
        mainChain: "bakery",
        mainLv: 3
      },
      {
        level: 5,
        name: "태양의 신년왕관",
        mainChain: "gem",
        mainLv: 4
      }
    ]
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
      {
        level: 1,
        name: "하트 트러플",
        mainChain: "bakery",
        mainLv: 1
      },
      {
        level: 2,
        name: "루비 프랄린",
        mainChain: "tea",
        mainLv: 2
      },
      {
        level: 3,
        name: "큐피드 마카롱",
        mainChain: "herb",
        mainLv: 3
      },
      {
        level: 4,
        name: "로즈 크리스탈함",
        mainChain: "potion",
        mainLv: 3
      },
      {
        level: 5,
        name: "쇼콜라 여왕왕관",
        mainChain: "gem",
        mainLv: 4
      }
    ]
  }
];

export function getHolidayConfig(id: string): HolidayDef {
  return HOLIDAY_EVENTS.find((h) => h.id === id) ?? HOLIDAY_EVENTS[0];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function getHolidayRemainingText(holiday: HolidayDef, now: Date): string {
  const year = now.getFullYear();
  const endOfHoliday = new Date(year, holiday.month - 1, holiday.day, 23, 59, 59);
  const startOfWindow = new Date(endOfHoliday.getTime() - 5 * 24 * 60 * 60 * 1000);
  const diffMs = endOfHoliday.getTime() - now.getTime();
  if (now >= startOfWindow && diffMs > 0) {
    const dd = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diffMs / (1000 * 60)) % 60);
    const s = Math.floor((diffMs / 1000) % 60);
    return `진행중 · 남은시간 ${dd}일 ${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }
  const cycleSec = 5 * 86400 - (Math.floor(now.getTime() / 1000) % (5 * 86400));
  const dd = Math.floor(cycleSec / 86400);
  const h = Math.floor((cycleSec % 86400) / 3600);
  const m = Math.floor((cycleSec % 3600) / 60);
  const s = cycleSec % 60;
  return `명절 이벤트 가동중 · 종료까지 ${dd}일 ${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}
