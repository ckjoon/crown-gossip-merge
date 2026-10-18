// customers.ts — 구역별 손님 명단 (현재 구역 명단에서 돌아가며 등장)

import type { CustomerInfo, ZoneKey } from "../types";

export const CUSTOMERS_BY_ZONE: Record<ZoneKey, CustomerInfo[]> = {
  alchemy: [
    {
      name: "퀸 (Quinn)",
      face: "🕵️‍♀️",
      line: "하버 오션카페와 마녀의 공방을 멋지게 리모델링해 봐요!"
    },
    {
      name: "루시안 공작",
      face: "🧛‍♂️",
      line: "마나물약 한 잔에 향긋한 홍차라니, 최고의 오후로군."
    },
    {
      name: "올리비아",
      face: "👧",
      line: "화덕 오븐에서 갓 구운 크루아상이랑 케이크 냄새가 너무 좋아요!"
    },
    {
      name: "해리슨",
      face: "🧔‍♂️",
      line: "별빛로드를 밝힐 마도서와 따뜻한 에스프레소 부탁하네!"
    },
    {
      name: "카르멘",
      face: "👩‍🎨",
      line: "가마솥 같은 생성기도 2개를 합치면 더 높은 등급으로 진화한답니다!"
    }
  ],
  harbor: [
    {
      name: "선장 마르코",
      face: "⚓",
      line: "항해 전엔 오션카페 크루아상이 최고지!"
    },
    {
      name: "카페 단골 엘라",
      face: "☕",
      line: "바다가 보이는 테라스에서 밀크티 한 잔, 부탁해요!"
    },
    {
      name: "갈매기 우편배달부 핍",
      face: "🐦",
      line: "끼룩! 성 해안 테라스로 배달 왔어요!"
    }
  ],
  garden: [
    {
      name: "정원사 로완",
      face: "🧑‍🌾",
      line: "온실의 만드라고라가 또 노래를 부르네요."
    },
    {
      name: "꽃의 요정 릴리",
      face: "🧚",
      line: "유리돔 안에 별빛 꽃이 피었어요!"
    },
    {
      name: "식물학자 베르나",
      face: "👩‍🔬",
      line: "희귀 식물 표본이 더 필요해요!"
    }
  ],
  banquet: [
    {
      name: "젊은 왕 아서",
      face: "🤴",
      line: "오늘 밤 대연회는 마녀의 성이 주인공이오!"
    },
    {
      name: "시녀장 마가렛",
      face: "👵",
      line: "연회 준비엔 한 치의 실수도 없어야 해요."
    },
    {
      name: "궁정 마술사 오베론",
      face: "🧙",
      line: "천문대의 별이 연회를 축복하는군."
    }
  ]
};
