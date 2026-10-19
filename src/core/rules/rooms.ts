// rooms.ts — 마녀의 성 6개 구역·30개 장소(제1화~제30화)·대사 데이터와 방 분위기 단계 (3D 배치는 views/castle/layout.ts)

import type { ZoneKey } from "./progression";

export interface Dialogue {
  characterId: string;
  line: string;
}

export interface SpotDef {
  id: string;
  name: string;
  cost: number;
  story: string;
  dialogues: Dialogue[];
}

export interface RoomDef {
  id: ZoneKey;
  sectionIcon: string;
  shortName: string;
  mergeBtnLabel: string;
  castleZoneTitle: string;
  title: string;
  subtitle: string;
  spots: SpotDef[];
}

export interface StylePalette {
  id: number;
  name: string;
  primary: number;
  secondary: number;
  accent: number;
  wood: number;
}

export const STYLE_PALETTES: StylePalette[] = [
  {
    id: 0,
    name: "로얄 골드",
    primary: 0xd97706,
    secondary: 0x7c3aed,
    accent: 0xfde047,
    wood: 0x5c2d16
  },
  {
    id: 1,
    name: "사파이어 민트",
    primary: 0x0284c7,
    secondary: 0x10b981,
    accent: 0xe0f2fe,
    wood: 0x334155
  },
  {
    id: 2,
    name: "크림슨 로즈",
    primary: 0xe11d48,
    secondary: 0xf43f5e,
    accent: 0xfef08a,
    wood: 0x451a03
  }
];

export const ROOMS: Record<ZoneKey, RoomDef> = {
  alchemy: {
    id: "alchemy",
    sectionIcon: "🔮",
    shortName: "🔮 마녀의 공방",
    mergeBtnLabel: "마녀의 공방 합성",
    castleZoneTitle: "성 본관 1층 · 마녀의 연금술 공방",
    title: "🔮 마녀의 성 본관: 마녀의 연금술 공방",
    subtitle: "폭발로 부서진 마녀의 성 핵심 공방과 가마솥 화로를 복구하세요",
    spots: [
      {
        id: "alc_cauldron",
        name: "마법 가마솥 화로",
        cost: 1,
        story: "가마솥 바닥에서 붉은 달의 밤에 누군가 몰래 넣은 '금지된 흑요석 폭약' 파편을 발견했습니다!",
        dialogues: [
          {
            characterId: "selene",
            line: "휴, 드디어 우리 성 1층 공방의 심장인 마법 가마솥이 다시 끓어오르기 시작했어!"
          },
          {
            characterId: "quinn",
            line: "잠깐만요, 셀레네! 가마솥 화로 밑바닥에 낯선 '흑요석 폭약 결정'이 남아 있어요. 단순한 연성 실수가 아니라 누군가 성에 침입했던 거예요!"
          },
          {
            characterId: "nero",
            line: "야옹! 폭발하던 날 밤, 검은 망토를 두른 그림자가 서재 쪽으로 도망치는 걸 봤다냥! 서가부터 확인해보자냥!"
          }
        ]
      },
      {
        id: "alc_bookcase",
        name: "고대 마도서 서가",
        cost: 2,
        story: "쏟아진 마도서들을 마법 책장에 정리하자 찢겨 나간 '성배의 비전서' 흔적이 드러났습니다!",
        dialogues: [
          {
            characterId: "selene",
            line: "어질러진 고대 마도서들을 모두 제자리에 꽂았어. 그런데... 할머니께 물려받은 《별빛 성배의 비전서》 마지막 장이 찢겨 나갔잖아?!"
          },
          {
            characterId: "quinn",
            line: "범인의 목적은 마녀의 성 지하에 봉인된 고대 마력이었군요! 책장 틈에 푸른 꽃가루가 떨어져 있어요."
          },
          {
            characterId: "selene",
            line: "이 꽃가루는 공방 창가 화분에서만 자라는 야광 포자야! 다음은 화분대를 복구해 봐야겠어."
          }
        ]
      },
      {
        id: "alc_herbtable",
        name: "달빛 약초 화분대",
        cost: 3,
        story: "화분대 흙 속에서 범인이 흘리고 간 은빛 열쇠 반쪽을 찾아냈습니다!",
        dialogues: [
          {
            characterId: "nero",
            line: "화분대를 새로 꾸미니까 만드라고라들이 다시 춤을 춘다냥! 어라? 화분 흙 속에 반짝이는 게 묻혀 있다냥!"
          },
          {
            characterId: "quinn",
            line: "이건 마녀의 성 동쪽 별관(온실)과 앞마당 정원을 잇는 문장 열쇠의 반쪽이에요!"
          },
          {
            characterId: "selene",
            line: "점점 단서가 모이고 있어! 이제 깨진 스테인드글라스 창문을 고쳐서 성안에 달빛 마력을 다시 채우자."
          }
        ]
      },
      {
        id: "alc_window",
        name: "스테인드글라스 창문",
        cost: 4,
        story: "스테인드글라스를 통과한 달빛이 바닥을 비추며 숨겨진 마법진 지도를 드러냈습니다!",
        dialogues: [
          {
            characterId: "carmen",
            line: "세상에! 스테인드글라스 창문을 복원하자마자 보랏빛 오로라 광선이 공방 바닥의 문양을 정확히 비추고 있어요!"
          },
          {
            characterId: "selene",
            line: "성 전체의 마력 회로가 다시 연결되고 있어! 이제 마지막으로 손님들에게 비약을 내어줄 포션 카운터만 완성하면 1층 공방은 완벽해!"
          }
        ]
      },
      {
        id: "alc_counter",
        name: "연금술 포션 카운터",
        cost: 5,
        story: "성 본관 1층 마녀의 연금술 공방이 완벽히 부활했습니다! 이제 성 앞마당 정원으로 나가 단서를 추적하세요!",
        dialogues: [
          {
            characterId: "lucian",
            line: "공방이 폭발 전보다 훨씬 우아해졌군, 셀레네. 그날 밤 성 앞마당 분수대 근처에서 수상한 마차를 보았다네."
          },
          {
            characterId: "selene",
            line: "고마워요, 공작님! 1층 연금술 공방 복구가 끝났으니, 이제 상단 [🏰 성 전체지도]를 눌러 성 앞마당 정원으로 나가 보자!"
          }
        ]
      }
    ]
  },
  harbor: {
    id: "harbor",
    sectionIcon: "🏖️",
    shortName: "🏖️ 하버 오션카페",
    mergeBtnLabel: "하버 오션카페 합성",
    castleZoneTitle: "성 해안 테라스 · 하버 오션카페 & 분수 정원",
    title: "🏖️ 마녀의 성 해안: 하버 오션카페 & 정원",
    subtitle: "성문 앞 해안 테라스의 브런치 카페와 수호 분수대를 멋지게 단장하세요",
    spots: [
      {
        id: "hb_espresso",
        name: "달빛 가든 에스프레소 바",
        cost: 2,
        story: "성 앞마당을 찾은 손님들에게 마법 원두로 내린 에스프레소를 대접할 수 있게 되었습니다!",
        dialogues: [
          {
            characterId: "olivia",
            line: "와아! 마녀의 성 앞마당에 향긋한 커피와 코코아 향기가 가득해요!"
          },
          {
            characterId: "selene",
            line: "성문 밖 정원 테라스는 마을 주민들과 여행자들이 쉬어가는 공간이거든. 바 카운터 아래에 웬 진흙 발자국이 찍혀 있네?"
          }
        ]
      },
      {
        id: "hb_parasol",
        name: "정원 파라솔 브런치석",
        cost: 2,
        story: "파라솔 의자 밑에서 침입자가 떨어뜨린 황실 천문대 인장을 발견했습니다!",
        dialogues: [
          {
            characterId: "quinn",
            line: "파라솔 테이블을 세우다 의자 틈에서 '별자리 인장 반지'를 찾았어요! 이건 마녀의 성 최상층 첨탑 출입 인장이에요!"
          },
          {
            characterId: "selene",
            line: "성 내부 사정을 아주 잘 아는 자의 소행이야! 앞마당 중앙의 분수대도 마저 복구해 보자."
          }
        ]
      },
      {
        id: "hb_fountain",
        name: "성 앞마당 수호 분수대",
        cost: 3,
        story: "수호 분수대에서 맑은 마력수가 솟구치며 성 외곽 결계가 다시 빛나기 시작합니다!",
        dialogues: [
          {
            characterId: "nero",
            line: "분수대에서 반짝이는 별빛 물줄기가 솟아오른다냥! 분수 바닥에 있던 은빛 열쇠 나머지 반쪽도 떠올랐다냥!"
          },
          {
            characterId: "selene",
            line: "공방에서 찾은 반쪽과 합치니 동쪽 별관 유리온실 열쇠가 완성됐어!"
          }
        ]
      },
      {
        id: "hb_bakery",
        name: "정원 화덕 베이커리",
        cost: 3,
        story: "따끈따끈한 마법 크루아상과 타르트를 굽는 정원 화덕이 복원되었습니다!",
        dialogues: [
          {
            characterId: "harrison",
            line: "허허, 마녀의 성 앞마당 화덕에서 구운 베리 타르트 냄새가 온 골짜기에 퍼지는구먼!"
          },
          {
            characterId: "selene",
            line: "화덕 온기 덕분에 정원의 밤공기가 한결 따뜻해졌어요. 이제 성문 아치만 복원하면 앞마당도 완성!"
          }
        ]
      },
      {
        id: "hb_arch",
        name: "마녀의 성 달빛 정문 아치",
        cost: 4,
        story: "마녀의 성 앞마당과 정문 아치가 화려하게 부활했습니다! 이제 동쪽 별관 유리온실로 향하세요!",
        dialogues: [
          {
            characterId: "carmen",
            line: "성 앞마당 정원이 동화 속 왕궁 정원처럼 눈부시게 변신했어요!"
          },
          {
            characterId: "selene",
            line: "열쇠도 맞췄으니 이제 성 동쪽 별관에 있는 '유리돔 마법 온실'을 꾸미러 가 볼까?"
          }
        ]
      }
    ]
  },
  garden: {
    id: "garden",
    sectionIcon: "🌿",
    shortName: "🌿 보타니컬 온실",
    mergeBtnLabel: "보타니컬 온실 합성",
    castleZoneTitle: "성 동쪽 별관 · 보타니컬 유리돔 온실",
    title: "🌿 마녀의 성 별관: 보타니컬 온실",
    subtitle: "성 동쪽 별관의 희귀 마법 식물들과 수련 연못, 허브티 바를 복구하세요",
    spots: [
      {
        id: "gd_pond",
        name: "에메랄드 수련 분수 연못",
        cost: 2,
        story: "투명한 연못 위로 빛나는 수련꽃이 피어나며 온실의 생명력이 되살아납니다!",
        dialogues: [
          {
            characterId: "selene",
            line: "다행이야! 에메랄드 연못을 정화하자 시들어가던 달빛 수련들이 일제히 꽃망울을 터뜨렸어!"
          },
          {
            characterId: "nero",
            line: "연못 물결에 그날 밤 침입자의 그림자가 비치고 있다냥! 황금 가면 쓴 자가 세계수 묘목에서 잎사귀를 훔쳐 갔다냥!"
          }
        ]
      },
      {
        id: "gd_gazebo",
        name: "로얄 티타임 가제보 테이블",
        cost: 3,
        story: "온실 속에서 오로라 밀크티와 다과를 즐기는 로얄 가제보 테이블이 완성되었습니다.",
        dialogues: [
          {
            characterId: "lucian",
            line: "유리온실 특유의 싱그러운 풀내음을 맡으며 마시는 오로라 밀크티라니, 성 안에서 가장 아름다운 명소로군."
          },
          {
            characterId: "quinn",
            line: "가제보 바닥 타일 밑에 최상층 첨탑으로 올라가는 비밀 나선계단 레버가 숨겨져 있었어요!"
          }
        ]
      },
      {
        id: "gd_planter",
        name: "세계수 묘목 화단",
        cost: 3,
        story: "상처 입었던 세계수의 묘목이 다시 황금빛 잎사귀와 불사조의 마력을 틔웠습니다!",
        dialogues: [
          {
            characterId: "selene",
            line: "세계수 묘목이 다시 건강해졌어! 이 나무가 뿜어내는 마력 덕분에 성 전체의 번개 에너지도 더 맑아질 거야."
          }
        ]
      },
      {
        id: "gd_teabar",
        name: "연금술 허브티 브루잉 바",
        cost: 3,
        story: "갓 딴 캐모마일과 달빛 이슬을 블렌딩하는 온실 전용 티 바가 완성되었습니다.",
        dialogues: [
          {
            characterId: "olivia",
            line: "온실에서 바로 딴 허브로 끓인 차를 마시니까 몸에서 반짝반짝 빛이 나는 기분이에요!"
          }
        ]
      },
      {
        id: "gd_dome",
        name: "크리스탈 보타니컬 아치창",
        cost: 4,
        story: "동쪽 별관 유리돔 온실이 완벽히 복구되었습니다! 이제 마녀의 성 최상층 첨탑으로 올라가세요!",
        dialogues: [
          {
            characterId: "quinn",
            line: "크리스탈 돔 창문 너머로 성의 가장 높은 곳, '별빛 천문대 & 대연회장 첨탑'이 보여요. 모든 미스터리의 해답이 저 위에 있어요!"
          },
          {
            characterId: "selene",
            line: "좋아, 이제 마녀의 성 최상층 첨탑으로 올라가서 마지막 진실을 밝혀내자!"
          }
        ]
      }
    ]
  },
  banquet: {
    id: "banquet",
    sectionIcon: "👑",
    shortName: "👑 황실 대연회장",
    mergeBtnLabel: "황실 대연회장 합성",
    castleZoneTitle: "성 최상층 첨탑 · 황실 대연회장 & 천문대",
    title: "👑 마녀의 성 최상층: 황실 대연회장",
    subtitle: "성 꼭대기 첨탑의 황금 천구의와 대연회장을 복원해 마녀의 성을 완성하세요!",
    spots: [
      {
        id: "bq_astrolabe",
        name: "황금 천문대 천구의",
        cost: 3,
        story: "거대한 황금 천구의가 회전하며 밤하늘의 별자리 에너지를 성 전체로 끌어모읍니다!",
        dialogues: [
          {
            characterId: "selene",
            line: "첨탑 중앙의 황금 천구의가 다시 회전하기 시작했어! 별자리 궤도가 맞춰지면서 그날 밤의 기억 영상이 투영되고 있어!"
          },
          {
            characterId: "quinn",
            line: "세상에... 범인은 외부의 적이 아니라, 100년 전 봉인되었던 '그림자 연금술 길드'의 자동 골렘이었군요!"
          }
        ]
      },
      {
        id: "bq_library",
        name: "황실 비전 기록보관소",
        cost: 3,
        story: "도난당했던 성배의 비전서 페이지가 기록보관소 비밀 금고 안에서 무사히 발견되었습니다!",
        dialogues: [
          {
            characterId: "nero",
            line: "야옹!! 기록보관소 수호 결계 덕분에 골렘이 훔쳐 가려던 비전서 페이지가 금고 속에 안전하게 남아 있었다냥!"
          },
          {
            characterId: "selene",
            line: "할머니의 비전서를 되찾았어! 이제 사건을 해결한 기념으로 성대한 만찬을 준비하자!"
          }
        ]
      },
      {
        id: "bq_feast",
        name: "대리석 황실 만찬 테이블",
        cost: 4,
        story: "3단 로얄 케이크와 황실 다과가 세팅된 화려한 대연회장 만찬석입니다!",
        dialogues: [
          {
            characterId: "olivia",
            line: "마녀의 성 꼭대기에서 밤하늘 별을 보며 먹는 3단 케이크라니, 꿈만 같아요!"
          }
        ]
      },
      {
        id: "bq_hearth",
        name: "드래곤 브레스 황금 화로",
        cost: 4,
        story: "꺼지지 않는 드래곤의 황금 불꽃이 마녀의 성 최상층 연회장을 따뜻하게 밝힙니다.",
        dialogues: [
          {
            characterId: "lucian",
            line: "드래곤 브레스 화로의 영원한 불꽃이 다시 타오르는군. 이제 이 성을 넘볼 자는 아무도 없을 걸세."
          }
        ]
      },
      {
        id: "bq_portal",
        name: "차원 성운 스테인드글라스",
        cost: 5,
        story: "최상층 대연회장이 완성되었습니다! 그런데 차원 스테인드글라스 너머로 연회장 아래 지하로 이어지는 숨겨진 계단이 비칩니다…",
        dialogues: [
          {
            characterId: "selene",
            line: "우리가 해냈어! 1층 연금술 공방부터 앞마당 분수 정원, 동쪽 별관 유리온실, 그리고 최상층 천문대 대연회장까지 마녀의 성 전체가 찬란하게 부활했어!"
          },
          {
            characterId: "quinn_nero",
            line: "잠깐, 스테인드글라스에 비친 저 계단… 침입자의 흔적이 지하로 이어져요! 은빛 열쇠의 나머지 반쪽도 거기 있을지 몰라요!"
          }
        ]
      }
    ]
  },
  cellar: {
    id: "cellar",
    sectionIcon: "🕯️",
    shortName: "🕯️ 지하 저장고",
    mergeBtnLabel: "지하 저장고 합성",
    castleZoneTitle: "성 지하 1층 · 비밀 저장고",
    title: "🕯️ 마녀의 성 지하: 비밀 저장고",
    subtitle: "연회장 아래 숨겨진 계단 끝, 먼지 쌓인 지하 저장고에서 침입자의 흔적을 쫓으세요",
    spots: [
      {
        id: "cel_wine",
        name: "오크통 와인 셀러",
        cost: 3,
        story: "와인 오크통 뒤 벽에서 은빛 열쇠 반쪽이 꼭 맞는 자물쇠 구멍을 찾아냈습니다!",
        dialogues: [
          {
            characterId: "quinn",
            line: "셀레네, 화분대에서 찾은 은빛 열쇠 반쪽 기억나요? 이 자물쇠 구멍, 모양이 똑같아요!"
          },
          {
            characterId: "nero",
            line: "나머지 반쪽은 어디 있을까냥? 와인 냄새 사이로 촛농 냄새가 난다냥."
          }
        ]
      },
      {
        id: "cel_candle",
        name: "촛불 제단",
        cost: 3,
        story: "촛불 제단에 불을 밝히자 벽에 흑요석 폭약과 같은 검은 그을음이 드러났습니다!",
        dialogues: [
          {
            characterId: "margaret",
            line: "이 제단은 선대 마녀님께서 쓰시던 곳이에요. 누군가 최근에 촛불을 켠 흔적이 있네요."
          },
          {
            characterId: "selene",
            line: "그을음 색이 공방 가마솥 밑에서 나온 흑요석 폭약이랑 똑같아… 범인이 여기서 폭약을 다뤘어!"
          }
        ]
      },
      {
        id: "cel_passage",
        name: "비밀 통로 책장 문",
        cost: 4,
        story: "책장 문 뒤 비밀 통로 바닥에서 별무늬 은단추 하나가 발견되었습니다!",
        dialogues: [
          {
            characterId: "quinn",
            line: "이 별무늬 은단추… 궁정 마술사 오베론 님의 예복 단추예요!"
          },
          {
            characterId: "lucian",
            line: "오베론이라니, 말도 안 되네. 그는 이 성을 수십 년간 지켜 온 마술사일세."
          }
        ]
      },
      {
        id: "cel_vault",
        name: "봉인 금고",
        cost: 4,
        story: "봉인 금고를 열자 비전서 마지막 장 대신 '달빛 마탑' 설계도와 나머지 열쇠 반쪽이 나왔습니다!",
        dialogues: [
          {
            characterId: "selene",
            line: "열쇠 반쪽이 맞춰졌어! 그런데 비전서 마지막 장은 없고 서쪽 마탑 설계도만 남아 있네."
          },
          {
            characterId: "nero",
            line: "마지막 장은 마탑에 있다는 뜻이다냥! 냄새가 서쪽으로 이어진다냥."
          }
        ]
      },
      {
        id: "cel_map",
        name: "지하 수맥 지도 벽",
        cost: 5,
        story: "완성된 은빛 열쇠를 꽂자 지하 수맥 지도가 빛나며 성 서쪽 달빛 마탑으로 가는 길이 열렸습니다!",
        dialogues: [
          {
            characterId: "selene",
            line: "지하 저장고까지 되찾았어! 이제 달빛 마탑으로 가서 오베론에게 직접 물어보자."
          },
          {
            characterId: "quinn_nero",
            line: "진실은 마탑 꼭대기에 있어요. 조심해서 올라가요!"
          }
        ]
      }
    ]
  },
  tower: {
    id: "tower",
    sectionIcon: "🌙",
    shortName: "🌙 달빛 마탑",
    mergeBtnLabel: "달빛 마탑 합성",
    castleZoneTitle: "성 서쪽 · 달빛 마탑",
    title: "🌙 마녀의 성 서쪽: 달빛 마탑",
    subtitle: "오랫동안 봉인되었던 서쪽 마탑을 되살리고 붉은 달의 밤에 일어난 일의 진실을 밝히세요",
    spots: [
      {
        id: "tw_loom",
        name: "별자리 직조기",
        cost: 4,
        story: "멈춰 있던 별자리 직조기가 다시 돌며 마탑의 결계 무늬를 짜기 시작했습니다.",
        dialogues: [
          {
            characterId: "oberon",
            line: "오, 셀레네 님. 이 낡은 마탑까지 어쩐 일이십니까? 직조기를 고쳐 주셔서 고맙군요."
          },
          {
            characterId: "quinn",
            line: "오베론 님, 지하 통로에서 당신의 별무늬 단추가 나왔어요. 설명해 주시겠어요?"
          }
        ]
      },
      {
        id: "tw_tapestry",
        name: "태피스트리 홀",
        cost: 4,
        story: "새로 짠 태피스트리에 붉은 달의 밤, 공방으로 숨어드는 오베론의 모습이 수놓아졌습니다!",
        dialogues: [
          {
            characterId: "nero",
            line: "태피스트리가 거짓말을 할 리 없다냥! 그날 밤 그림자는 오베론이었다냥!"
          },
          {
            characterId: "oberon",
            line: "…그래요, 그날 밤 공방에 들어간 건 접니다. 하지만 이유가 있었습니다."
          }
        ]
      },
      {
        id: "tw_carpet",
        name: "마법 양탄자 라운지",
        cost: 4,
        story: "마법 양탄자에 둘러앉아 오베론이 숨겨 온 진실을 털어놓았습니다.",
        dialogues: [
          {
            characterId: "oberon",
            line: "비전서 마지막 장에는 성을 집어삼킬 저주가 깃들어 있었습니다. 가마솥 불로 태워 없애려다 폭발을 일으키고 말았지요."
          },
          {
            characterId: "selene",
            line: "그래서 혼자 숨어서 저주를 막으려 했던 거구나… 왜 우리한테 말하지 않았어?"
          }
        ]
      },
      {
        id: "tw_mirror",
        name: "진실의 거울",
        cost: 5,
        story: "진실의 거울이 마지막 장에 깃든 저주의 정체, '그림자 왕관'을 비추었습니다!",
        dialogues: [
          {
            characterId: "lucian",
            line: "그림자 왕관… 옛 왕조를 무너뜨린 저주로군. 혼자서는 감당할 수 없는 힘일세."
          },
          {
            characterId: "margaret",
            line: "아서 전하께 알려야 해요. 왕실의 마력까지 모아야 정화할 수 있을 거예요."
          }
        ]
      },
      {
        id: "tw_crown",
        name: "달빛 왕관 제단",
        cost: 6,
        story: "모두의 마력을 모아 달빛 왕관 제단에서 저주를 정화했습니다! 마녀의 성 6대 구역이 완전히 부활했습니다!",
        dialogues: [
          {
            characterId: "arthur",
            line: "셀레네, 오베론, 그리고 모두 고맙소. 이제 이 성은 왕국에서 가장 빛나는 곳이 되었소!"
          },
          {
            characterId: "selene",
            line: "지하 저장고부터 달빛 마탑까지, 성 전체가 진짜로 돌아왔어! 앞으로도 마음껏 꾸며 보자!"
          }
        ]
      }
    ]
  }
};

// 스토리 순서(구역 순서 → 장소 순서)대로 펼친 목록. N번째가 제N화
export const ALL_SPOTS_IN_ORDER: Array<{ zoneKey: ZoneKey; spot: SpotDef; chapter: number }> = (Object.keys(ROOMS) as ZoneKey[]).flatMap(
  (zoneKey) => ROOMS[zoneKey].spots.map((spot) => ({ zoneKey, spot, chapter: 0 }))
).map((e, i) => ({ ...e, chapter: i + 1 }));

export function findSpot(spotId: string): { zoneKey: ZoneKey; spot: SpotDef; chapter: number } | null {
  return ALL_SPOTS_IN_ORDER.find((e) => e.spot.id === spotId) ?? null;
}

// 복구한 장소 수(0~5)에 따른 방 분위기: 어둡고 먼지 낀 방 → 따뜻하고 빛나는 방
export interface AmbienceStep {
  ambientColor: number;
  ambientIntensity: number;
  warmLight: number;
  dust: number;
  sparkles: number;
  candles: number;
}

export const ambienceByProgress: AmbienceStep[] = [
  { ambientColor: 0x4b5563, ambientIntensity: 0.22, warmLight: 0.1, dust: 60, sparkles: 0, candles: 0 },
  { ambientColor: 0x6b5b8a, ambientIntensity: 0.36, warmLight: 0.35, dust: 45, sparkles: 6, candles: 1 },
  { ambientColor: 0x7c6aa8, ambientIntensity: 0.55, warmLight: 0.55, dust: 30, sparkles: 12, candles: 2 },
  { ambientColor: 0x9370db, ambientIntensity: 0.65, warmLight: 0.7, dust: 18, sparkles: 20, candles: 3 },
  { ambientColor: 0xb08ae8, ambientIntensity: 0.75, warmLight: 0.85, dust: 8, sparkles: 30, candles: 4 },
  { ambientColor: 0xffe4b5, ambientIntensity: 0.9, warmLight: 1.0, dust: 0, sparkles: 45, candles: 6 },
];
