// interior3d.js — Three.js + GSAP 기반 '마녀 셀레네의 성(Witch's Castle)' 3D 전체 성곽 지도 & 실내외 인테리어 빌딩 엔진
// Gossip Harbor 스타일의 마녀의 성 전체 맵 이동, 4개 성 구역(공방/앞마당 정원/유리온실/최상층 첨탑) 꾸미기, 퀘스트별 스토리 컷신 데이터를 담당합니다.

window.Interior3DEngine = (function () {
  const STYLE_PALETTES = [
    { id: 0, name: "로얄 골드", primary: 0xd97706, secondary: 0x7c3aed, accent: 0xfde047, wood: 0x5c2d16 },
    { id: 1, name: "사파이어 민트", primary: 0x0284c7, secondary: 0x10b981, accent: 0xe0f2fe, wood: 0x334155 },
    { id: 2, name: "크림슨 로즈", primary: 0xe11d48, secondary: 0xf43f5e, accent: 0xfef08a, wood: 0x451a03 },
  ];

  // 마녀 셀레네의 성(Witch's Castle) 4대 구역 (기존 세이브 호환을 위해 키값 alchemy, harbor, garden, banquet 유지)
  const ROOM_THEMES = {
    alchemy: {
      id: "alchemy",
      sectionIcon: "🔮",
      shortName: "🔮 마녀의 공방",
      mergeBtnLabel: "마녀의 공방 합성",
      castleZoneTitle: "성 본관 1층 · 마녀의 연금술 공방",
      castlePinPos: [-1.8, 2.7, -1.2],
      title: "🔮 마녀의 성 본관: 마녀의 연금술 공방",
      subtitle: "폭발로 부서진 마녀의 성 핵심 공방과 가마솥 화로를 복구하세요",
      wallColor: 0x2e1a47,
      floorColor1: 0x3d2759,
      floorColor2: 0x311e47,
      ambientColor: 0x9370db,
      spots: [
        {
          id: "alc_cauldron",
          name: "마법 가마솥 화로",
          cost: 2,
          pos: [0, 0, 0],
          camOffset: [6, 7, 6],
          type: "cauldron",
          story: "가마솥 바닥에서 붉은 달의 밤에 누군가 몰래 넣은 '금지된 흑요석 폭약' 파편을 발견했습니다!",
          dialogues: [
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "휴, 드디어 우리 성 1층 공방의 심장인 마법 가마솥이 다시 끓어오르기 시작했어!",
            },
            {
              speaker: "조사관 퀸",
              face: "🕵️‍♀️",
              line: "잠깐만요, 셀레네! 가마솥 화로 밑바닥에 낯선 '흑요석 폭약 결정'이 남아 있어요. 단순한 연성 실수가 아니라 누군가 성에 침입했던 거예요!",
            },
            {
              speaker: "사역마 네로",
              face: "🐈‍⬛",
              line: "야옹! 폭발하던 날 밤, 검은 망토를 두른 그림자가 서재 쪽으로 도망치는 걸 봤다냥! 서가부터 확인해보자냥!",
            },
          ],
          done: false,
          styleIdx: 0,
        },
        {
          id: "alc_bookcase",
          name: "고대 마도서 서가",
          cost: 2,
          pos: [-3.2, 0, -3.2],
          camOffset: [5, 7, 5],
          type: "bookcase",
          story: "쏟아진 마도서들을 마법 책장에 정리하자 찢겨 나간 '성배의 비전서' 흔적이 드러났습니다!",
          dialogues: [
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "어질러진 고대 마도서들을 모두 제자리에 꽂았어. 그런데... 할머니께 물려받은 《별빛 성배의 비전서》 마지막 장이 찢겨 나갔잖아?!",
            },
            {
              speaker: "조사관 퀸",
              face: "🕵️‍♀️",
              line: "범인의 목적은 마녀의 성 지하에 봉인된 고대 마력이었군요! 책장 틈에 푸른 꽃가루가 떨어져 있어요.",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "이 꽃가루는 공방 창가 화분에서만 자라는 야광 포자야! 다음은 화분대를 복구해 봐야겠어.",
            },
          ],
          done: false,
          styleIdx: 0,
        },
        {
          id: "alc_herbtable",
          name: "달빛 약초 화분대",
          cost: 3,
          pos: [3.0, 0, -2.8],
          camOffset: [6, 7, 5],
          type: "planter",
          story: "화분대 흙 속에서 범인이 흘리고 간 은빛 열쇠 반쪽을 찾아냈습니다!",
          dialogues: [
            {
              speaker: "사역마 네로",
              face: "🐈‍⬛",
              line: "화분대를 새로 꾸미니까 만드라고라들이 다시 춤을 춘다냥! 어라? 화분 흙 속에 반짝이는 게 묻혀 있다냥!",
            },
            {
              speaker: "조사관 퀸",
              face: "🕵️‍♀️",
              line: "이건 마녀의 성 동쪽 별관(온실)과 앞마당 정원을 잇는 문장 열쇠의 반쪽이에요!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "점점 단서가 모이고 있어! 이제 깨진 스테인드글라스 창문을 고쳐서 성안에 달빛 마력을 다시 채우자.",
            },
          ],
          done: false,
          styleIdx: 0,
        },
        {
          id: "alc_window",
          name: "스테인드글라스 창문",
          cost: 3,
          pos: [0, 2.4, -4.7],
          camOffset: [5, 6, 5],
          type: "window",
          story: "스테인드글라스를 통과한 달빛이 바닥을 비추며 숨겨진 마법진 지도를 드러냈습니다!",
          dialogues: [
            {
              speaker: "건축가 카르멘",
              face: "👩‍🎨",
              line: "세상에! 스테인드글라스 창문을 복원하자마자 보랏빛 오로라 광선이 공방 바닥의 문양을 정확히 비추고 있어요!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "성 전체의 마력 회로가 다시 연결되고 있어! 이제 마지막으로 손님들에게 비약을 내어줄 포션 카운터만 완성하면 1층 공방은 완벽해!",
            },
          ],
          done: false,
          styleIdx: 0,
        },
        {
          id: "alc_counter",
          name: "연금술 포션 카운터",
          cost: 4,
          pos: [-2.6, 0, 2.4],
          camOffset: [6, 7, 6],
          type: "counter",
          story: "성 본관 1층 마녀의 연금술 공방이 완벽히 부활했습니다! 이제 성 앞마당 정원으로 나가 단서를 추적하세요!",
          dialogues: [
            {
              speaker: "루시안 공작",
              face: "🧛‍♂️",
              line: "공방이 폭발 전보다 훨씬 우아해졌군, 셀레네. 그날 밤 성 앞마당 분수대 근처에서 수상한 마차를 보았다네.",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "고마워요, 공작님! 1층 연금술 공방 복구가 끝났으니, 이제 상단 [🏰 성 전체지도]를 눌러 성 앞마당 정원으로 나가 보자!",
            },
          ],
          done: false,
          styleIdx: 0,
        },
      ],
    },

    harbor: {
      id: "harbor",
      sectionIcon: "🏖️",
      shortName: "🏖️ 하버 오션카페",
      mergeBtnLabel: "하버 오션카페 합성",
      castleZoneTitle: "성 해안 테라스 · 하버 오션카페 & 분수 정원",
      castlePinPos: [-2.0, 1.5, 2.5],
      title: "🏖️ 마녀의 성 해안: 하버 오션카페 & 정원",
      subtitle: "성문 앞 해안 테라스의 브런치 카페와 수호 분수대를 멋지게 단장하세요",
      wallColor: 0x1e3a8a,
      floorColor1: 0xd9a066,
      floorColor2: 0xc48c52,
      ambientColor: 0xfef08a,
      spots: [
        {
          id: "hb_espresso",
          name: "달빛 가든 에스프레소 바",
          cost: 2,
          pos: [-2.8, 0, -2.8],
          camOffset: [6, 7, 6],
          type: "counter",
          story: "성 앞마당을 찾은 손님들에게 마법 원두로 내린 에스프레소를 대접할 수 있게 되었습니다!",
          dialogues: [
            {
              speaker: "올리비아",
              face: "👧",
              line: "와아! 마녀의 성 앞마당에 향긋한 커피와 코코아 향기가 가득해요!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "성문 밖 정원 테라스는 마을 주민들과 여행자들이 쉬어가는 공간이거든. 바 카운터 아래에 웬 진흙 발자국이 찍혀 있네?",
            },
          ],
          done: false,
          styleIdx: 1,
        },
        {
          id: "hb_parasol",
          name: "정원 파라솔 브런치석",
          cost: 2,
          pos: [1.8, 0, 1.8],
          camOffset: [6, 7, 6],
          type: "parasol",
          story: "파라솔 의자 밑에서 침입자가 떨어뜨린 황실 천문대 인장을 발견했습니다!",
          dialogues: [
            {
              speaker: "조사관 퀸",
              face: "🕵️‍♀️",
              line: "파라솔 테이블을 세우다 의자 틈에서 '별자리 인장 반지'를 찾았어요! 이건 마녀의 성 최상층 첨탑 출입 인장이에요!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "성 내부 사정을 아주 잘 아는 자의 소행이야! 앞마당 중앙의 분수대도 마저 복구해 보자.",
            },
          ],
          done: false,
          styleIdx: 1,
        },
        {
          id: "hb_fountain",
          name: "성 앞마당 수호 분수대",
          cost: 3,
          pos: [0, 0, -0.5],
          camOffset: [6, 7, 6],
          type: "fountain",
          story: "수호 분수대에서 맑은 마력수가 솟구치며 성 외곽 결계가 다시 빛나기 시작합니다!",
          dialogues: [
            {
              speaker: "사역마 네로",
              face: "🐈‍⬛",
              line: "분수대에서 반짝이는 별빛 물줄기가 솟아오른다냥! 분수 바닥에 있던 은빛 열쇠 나머지 반쪽도 떠올랐다냥!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "공방에서 찾은 반쪽과 합치니 동쪽 별관 유리온실 열쇠가 완성됐어!",
            },
          ],
          done: false,
          styleIdx: 1,
        },
        {
          id: "hb_bakery",
          name: "정원 화덕 베이커리",
          cost: 3,
          pos: [2.8, 0, -2.8],
          camOffset: [6, 7, 6],
          type: "oven",
          story: "따끈따끈한 마법 크루아상과 타르트를 굽는 정원 화덕이 복원되었습니다!",
          dialogues: [
            {
              speaker: "해리슨",
              face: "🧔‍♂️",
              line: "허허, 마녀의 성 앞마당 화덕에서 구운 베리 타르트 냄새가 온 골짜기에 퍼지는구먼!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "화덕 온기 덕분에 정원의 밤공기가 한결 따뜻해졌어요. 이제 성문 아치만 복원하면 앞마당도 완성!",
            },
          ],
          done: false,
          styleIdx: 1,
        },
        {
          id: "hb_arch",
          name: "마녀의 성 달빛 정문 아치",
          cost: 4,
          pos: [0, 2.2, -4.7],
          camOffset: [5, 6, 5],
          type: "window",
          story: "마녀의 성 앞마당과 정문 아치가 화려하게 부활했습니다! 이제 동쪽 별관 유리온실로 향하세요!",
          dialogues: [
            {
              speaker: "건축가 카르멘",
              face: "👩‍🎨",
              line: "성 앞마당 정원이 동화 속 왕궁 정원처럼 눈부시게 변신했어요!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "열쇠도 맞췄으니 이제 성 동쪽 별관에 있는 '유리돔 마법 온실'을 꾸미러 가 볼까?",
            },
          ],
          done: false,
          styleIdx: 1,
        },
      ],
    },

    garden: {
      id: "garden",
      sectionIcon: "🌿",
      shortName: "🌿 보타니컬 온실",
      mergeBtnLabel: "보타니컬 온실 합성",
      castleZoneTitle: "성 동쪽 별관 · 보타니컬 유리돔 온실",
      castlePinPos: [2.6, 2.0, 1.5],
      title: "🌿 마녀의 성 별관: 보타니컬 온실",
      subtitle: "성 동쪽 별관의 희귀 마법 식물들과 수련 연못, 허브티 바를 복구하세요",
      wallColor: 0x064e3b,
      floorColor1: 0x166534,
      floorColor2: 0x14532d,
      ambientColor: 0x6ee7b7,
      spots: [
        {
          id: "gd_pond",
          name: "에메랄드 수련 분수 연못",
          cost: 2,
          pos: [0, 0, 0],
          camOffset: [6, 7, 6],
          type: "fountain",
          story: "투명한 연못 위로 빛나는 수련꽃이 피어나며 온실의 생명력이 되살아납니다!",
          dialogues: [
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "다행이야! 에메랄드 연못을 정화하자 시들어가던 달빛 수련들이 일제히 꽃망울을 터뜨렸어!",
            },
            {
              speaker: "사역마 네로",
              face: "🐈‍⬛",
              line: "연못 물결에 그날 밤 침입자의 그림자가 비치고 있다냥! 황금 가면 쓴 자가 세계수 묘목에서 잎사귀를 훔쳐 갔다냥!",
            },
          ],
          done: false,
          styleIdx: 1,
        },
        {
          id: "gd_gazebo",
          name: "로얄 티타임 가제보 테이블",
          cost: 3,
          pos: [2.2, 0, 2.0],
          camOffset: [6, 7, 6],
          type: "parasol",
          story: "온실 속에서 오로라 밀크티와 다과를 즐기는 로얄 가제보 테이블이 완성되었습니다.",
          dialogues: [
            {
              speaker: "루시안 공작",
              face: "🧛‍♂️",
              line: "유리온실 특유의 싱그러운 풀내음을 맡으며 마시는 오로라 밀크티라니, 성 안에서 가장 아름다운 명소로군.",
            },
            {
              speaker: "조사관 퀸",
              face: "🕵️‍♀️",
              line: "가제보 바닥 타일 밑에 최상층 첨탑으로 올라가는 비밀 나선계단 레버가 숨겨져 있었어요!",
            },
          ],
          done: false,
          styleIdx: 0,
        },
        {
          id: "gd_planter",
          name: "세계수 묘목 화단",
          cost: 3,
          pos: [-2.8, 0, -2.8],
          camOffset: [6, 7, 6],
          type: "planter",
          story: "상처 입었던 세계수의 묘목이 다시 황금빛 잎사귀와 불사조의 마력을 틔웠습니다!",
          dialogues: [
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "세계수 묘목이 다시 건강해졌어! 이 나무가 뿜어내는 마력 덕분에 성 전체의 번개 에너지도 더 맑아질 거야.",
            },
          ],
          done: false,
          styleIdx: 0,
        },
        {
          id: "gd_teabar",
          name: "연금술 허브티 브루잉 바",
          cost: 3,
          pos: [2.8, 0, -2.8],
          camOffset: [6, 7, 6],
          type: "counter",
          story: "갓 딴 캐모마일과 달빛 이슬을 블렌딩하는 온실 전용 티 바가 완성되었습니다.",
          dialogues: [
            {
              speaker: "올리비아",
              face: "👧",
              line: "온실에서 바로 딴 허브로 끓인 차를 마시니까 몸에서 반짝반짝 빛이 나는 기분이에요!",
            },
          ],
          done: false,
          styleIdx: 2,
        },
        {
          id: "gd_dome",
          name: "크리스탈 보타니컬 아치창",
          cost: 4,
          pos: [0, 2.3, -4.7],
          camOffset: [5, 6, 5],
          type: "window",
          story: "동쪽 별관 유리돔 온실이 완벽히 복구되었습니다! 이제 마녀의 성 최상층 첨탑으로 올라가세요!",
          dialogues: [
            {
              speaker: "조사관 퀸",
              face: "🕵️‍♀️",
              line: "크리스탈 돔 창문 너머로 성의 가장 높은 곳, '별빛 천문대 & 대연회장 첨탑'이 보여요. 모든 미스터리의 해답이 저 위에 있어요!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "좋아, 이제 마녀의 성 최상층 첨탑으로 올라가서 마지막 진실을 밝혀내자!",
            },
          ],
          done: false,
          styleIdx: 1,
        },
      ],
    },

    banquet: {
      id: "banquet",
      sectionIcon: "👑",
      shortName: "👑 황실 대연회장",
      mergeBtnLabel: "황실 대연회장 합성",
      castleZoneTitle: "성 최상층 첨탑 · 황실 대연회장 & 천문대",
      castlePinPos: [2.0, 4.1, -2.0],
      title: "👑 마녀의 성 최상층: 황실 대연회장",
      subtitle: "성 꼭대기 첨탑의 황금 천구의와 대연회장을 복원해 마녀의 성을 완성하세요!",
      wallColor: 0x3b0764,
      floorColor1: 0x4c1d95,
      floorColor2: 0x3b0764,
      ambientColor: 0xfde047,
      spots: [
        {
          id: "bq_astrolabe",
          name: "황금 천문대 천구의",
          cost: 3,
          pos: [0, 0, 0],
          camOffset: [6, 7, 6],
          type: "cauldron",
          story: "거대한 황금 천구의가 회전하며 밤하늘의 별자리 에너지를 성 전체로 끌어모읍니다!",
          dialogues: [
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "첨탑 중앙의 황금 천구의가 다시 회전하기 시작했어! 별자리 궤도가 맞춰지면서 그날 밤의 기억 영상이 투영되고 있어!",
            },
            {
              speaker: "조사관 퀸",
              face: "🕵️‍♀️",
              line: "세상에... 범인은 외부의 적이 아니라, 100년 전 봉인되었던 '그림자 연금술 길드'의 자동 골렘이었군요!",
            },
          ],
          done: false,
          styleIdx: 0,
        },
        {
          id: "bq_library",
          name: "황실 비전 기록보관소",
          cost: 3,
          pos: [-3.0, 0, -3.0],
          camOffset: [6, 7, 6],
          type: "bookcase",
          story: "도난당했던 성배의 비전서 페이지가 기록보관소 비밀 금고 안에서 무사히 발견되었습니다!",
          dialogues: [
            {
              speaker: "사역마 네로",
              face: "🐈‍⬛",
              line: "야옹!! 기록보관소 수호 결계 덕분에 골렘이 훔쳐 가려던 비전서 페이지가 금고 속에 안전하게 남아 있었다냥!",
            },
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "할머니의 비전서를 되찾았어! 이제 사건을 해결한 기념으로 성대한 만찬을 준비하자!",
            },
          ],
          done: false,
          styleIdx: 2,
        },
        {
          id: "bq_feast",
          name: "대리석 황실 만찬 테이블",
          cost: 4,
          pos: [2.0, 0, 2.0],
          camOffset: [6, 7, 6],
          type: "parasol",
          story: "3단 로얄 케이크와 황실 다과가 세팅된 화려한 대연회장 만찬석입니다!",
          dialogues: [
            {
              speaker: "올리비아",
              face: "👧",
              line: "마녀의 성 꼭대기에서 밤하늘 별을 보며 먹는 3단 케이크라니, 꿈만 같아요!",
            },
          ],
          done: false,
          styleIdx: 0,
        },
        {
          id: "bq_hearth",
          name: "드래곤 브레스 황금 화로",
          cost: 4,
          pos: [3.0, 0, -2.8],
          camOffset: [6, 7, 6],
          type: "oven",
          story: "꺼지지 않는 드래곤의 황금 불꽃이 마녀의 성 최상층 연회장을 따뜻하게 밝힙니다.",
          dialogues: [
            {
              speaker: "루시안 공작",
              face: "🧛‍♂️",
              line: "드래곤 브레스 화로의 영원한 불꽃이 다시 타오르는군. 이제 이 성을 넘볼 자는 아무도 없을 걸세.",
            },
          ],
          done: false,
          styleIdx: 2,
        },
        {
          id: "bq_portal",
          name: "차원 성운 스테인드글라스",
          cost: 5,
          pos: [0, 2.4, -4.7],
          camOffset: [5, 6, 5],
          type: "window",
          story: "축하합니다! 마녀 셀레네의 성 4대 구역의 모든 인테리어 복원과 스토리를 완성했습니다!",
          dialogues: [
            {
              speaker: "대마녀 셀레네",
              face: "🧙‍♀️",
              line: "우리가 해냈어! 1층 연금술 공방부터 앞마당 분수 정원, 동쪽 별관 유리온실, 그리고 최상층 천문대 대연회장까지 마녀의 성 전체가 찬란하게 부활했어!",
            },
            {
              speaker: "조사관 퀸 & 네로",
              face: "🕵️‍♀️",
              line: "진정한 마녀의 성 주인이자 전설의 대연금술사로 등극하신 걸 축하드려요! 앞으로도 성 전체 지도에서 언제든 각 방의 스타일을 자유롭게 꾸며보세요!",
            },
          ],
          done: false,
          styleIdx: 0,
        },
      ],
    },
  };

  let scene, camera, renderer, containerEl, pinsContainerEl;
  let roomGroup, furnitureMeshes = {};
  let particles = [];
  let currentThemeKey = "alchemy";
  let isCastleMapMode = false; // true일 때 마녀의 성 전체 3D 외관 디오라마 지도 표시
  let activeInspectSpot = null; // 현재 디자인 선택 중인 가구 spot
  let previewStyleIdx = 0;
  let onRenovateCallback = null;
  let onSelectRoomFromMapCallback = null;
  let getStarsCallback = null;
  let isExpanded = false;
  let animFrameId = null;

  // 기본 아이소메트릭 카메라 위치 및 타겟
  const DEFAULT_CAM_POS = { x: 10, y: 10.5, z: 10 };
  const camLookTarget = { x: 0, y: 1.0, z: 0 };

  function init(mountId, pinsId, callbacks) {
    containerEl = document.getElementById(mountId);
    pinsContainerEl = document.getElementById(pinsId);
    onRenovateCallback = callbacks.onRenovate;
    onSelectRoomFromMapCallback = callbacks.onSelectRoomFromMap;
    getStarsCallback = callbacks.getStars;

    if (!window.THREE || !containerEl) return;

    const w = containerEl.clientWidth || 500;
    const h = containerEl.clientHeight || 220;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x160d29);

    const aspect = w / h;
    const d = 5.4;
    camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 100);
    camera.position.set(DEFAULT_CAM_POS.x, DEFAULT_CAM_POS.y, DEFAULT_CAM_POS.z);
    camera.lookAt(camLookTarget.x, camLookTarget.y, camLookTarget.z);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerEl.innerHTML = "";
    containerEl.appendChild(renderer.domElement);

    roomGroup = new THREE.Group();
    scene.add(roomGroup);

    buildRoomScene(currentThemeKey);
    handleResize();
    animateLoop();

    window.addEventListener("resize", handleResize);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        handleResize();
        updatePinsDOM();
      });
      ro.observe(containerEl);
    }
  }

  function handleResize() {
    if (!containerEl || !renderer || !camera) return;
    const w = containerEl.clientWidth || 360;
    const h = containerEl.clientHeight || 320;
    if (w <= 0 || h <= 0) return;
    const aspect = w / h;

    // 아이소메트릭 10x10 다이아몬드 룸의 가로 폭(약 ±7.2)이 Galaxy S25 세로 화면에서도 절대 잘리지 않도록 가로/세로 최소 시야 보장
    const minHalfW = isCastleMapMode ? 8.0 : 7.5;
    const minHalfH = isCastleMapMode ? 6.0 : 5.5;
    let halfW = minHalfH * aspect;
    let halfH = minHalfH;
    if (halfW < minHalfW) {
      halfW = minHalfW;
      halfH = halfW / Math.max(0.35, aspect);
    }

    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function switchTheme(themeKey) {
    const bar = document.getElementById("style-selector-overlay");
    if (bar) bar.classList.add("hidden");
    activeInspectSpot = null;

    if (themeKey === "castle_map") {
      isCastleMapMode = true;
      resetCameraSmooth();
      buildCastleOverviewScene();
      handleResize();
      updatePinsDOM();
      return;
    }

    if (!ROOM_THEMES[themeKey]) return;
    isCastleMapMode = false;
    currentThemeKey = themeKey;
    resetCameraSmooth();
    buildRoomScene(themeKey);
    handleResize();
    updatePinsDOM();
  }

  // 🏰 마녀의 성 전체 3D 외관 디오라마 맵 (본관 공방 + 앞마당 분수정원 + 동쪽 유리돔 온실 + 최상층 천문대 첨탑)
  function buildCastleOverviewScene() {
    while (roomGroup.children.length > 0) {
      roomGroup.remove(roomGroup.children[0]);
    }
    furnitureMeshes = {};

    scene.background = new THREE.Color(0x0f0722);

    const ambient = new THREE.AmbientLight(0xc084fc, 0.85);
    roomGroup.add(ambient);

    const moonLight = new THREE.DirectionalLight(0xfef08a, 1.05);
    moonLight.position.set(10, 18, 12);
    moonLight.castShadow = true;
    roomGroup.add(moonLight);

    // 1. 마법 해자(Moat) & 성채 대지 섬
    const moatGeo = new THREE.CylinderGeometry(6.3, 6.5, 0.3, 32);
    const moatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.4 });
    const moat = new THREE.Mesh(moatGeo, moatMat);
    moat.position.set(0, -0.25, 0);
    roomGroup.add(moat);

    const islandGeo = new THREE.BoxGeometry(9.4, 0.45, 9.4);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, 0, 0);
    island.receiveShadow = true;
    roomGroup.add(island);

    // 성곽 외벽 테두리 & 모서리 망루
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const roofPurpleMat = new THREE.MeshStandardMaterial({ color: 0x5b21b6, roughness: 0.35, metalness: 0.2 });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      roughness: 0.25,
      metalness: 0.6,
    });
    const glowWindowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 0.85,
    });

    const corners = [
      [-4.2, -4.2],
      [4.2, -4.2],
      [-4.2, 4.2],
      [4.2, 4.2],
    ];
    corners.forEach(([cx, cz]) => {
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 2.2, 12), stoneMat);
      turret.position.set(cx, 1.1, cz);
      turret.castShadow = true;
      roomGroup.add(turret);

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.1, 12), roofPurpleMat);
      cone.position.set(cx, 2.75, cz);
      roomGroup.add(cone);
    });

    // 2. [제1구역: 성 본관 1층 마녀의 연금술 공방] (-1.8, 0, -1.2)
    const keepGroup = new THREE.Group();
    keepGroup.position.set(-1.8, 0.2, -1.2);

    const keepBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2.8), stoneMat);
    keepBody.position.y = 1.2;
    keepBody.castShadow = true;
    keepGroup.add(keepBody);

    const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(2.45, 1.5, 4), roofPurpleMat);
    keepRoof.rotation.y = Math.PI / 4;
    keepRoof.position.y = 3.15;
    keepGroup.add(keepRoof);

    // 공방 가마솥 굴뚝 & 보라색 연기 오브
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.4, 10), stoneMat);
    chimney.position.set(-0.9, 2.8, -0.6);
    keepGroup.add(chimney);

    const smokeOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.6 })
    );
    smokeOrb.position.set(-0.9, 3.7, -0.6);
    smokeOrb.userData.floatBubble = true;
    smokeOrb.userData.baseY = 3.7;
    smokeOrb.userData.phase = 0.2;
    keepGroup.add(smokeOrb);

    // 빛나는 공방 창문
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.1), glowWindowMat);
    win1.position.set(0, 1.3, 1.42);
    keepGroup.add(win1);

    roomGroup.add(keepGroup);

    // 3. [제2구역: 성 앞마당 달빛 분수 정원 & 테라스] (-2.0, 0, 2.5)
    const courtGroup = new THREE.Group();
    courtGroup.position.set(-2.0, 0.2, 2.5);

    const patio = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.15, 2.6),
      new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.6 })
    );
    patio.position.y = 0.08;
    courtGroup.add(patio);

    const fountainPool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, 0.35, 18),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 })
    );
    fountainPool.position.set(0, 0.28, 0);
    courtGroup.add(fountainPool);

    const fountainGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), goldMat);
    fountainGem.position.set(0, 0.95, 0);
    fountainGem.userData.floatBubble = true;
    fountainGem.userData.baseY = 0.95;
    fountainGem.userData.phase = 1.4;
    courtGroup.add(fountainGem);

    roomGroup.add(courtGroup);

    // 4. [제3구역: 성 동쪽 별관 유리돔 마법 온실] (2.6, 0, 1.5)
    const gardenGroup = new THREE.Group();
    gardenGroup.position.set(2.6, 0.2, 1.5);

    const lawn = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.75, 0.2, 20),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
    );
    lawn.position.y = 0.1;
    gardenGroup.add(lawn);

    const glassDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.45, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x6ee7b7,
        emissive: 0x10b981,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.72,
        roughness: 0.15,
      })
    );
    glassDome.position.y = 0.2;
    gardenGroup.add(glassDome);

    const worldTree = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.65),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 0.35 })
    );
    worldTree.position.y = 1.05;
    gardenGroup.add(worldTree);

    roomGroup.add(gardenGroup);

    // 5. [제4구역: 성 최상층 첨탑 별빛 천문대 & 대연회장] (2.0, 0, -2.0)
    const spireGroup = new THREE.Group();
    spireGroup.position.set(2.0, 0.2, -2.0);

    const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 3.6, 16), stoneMat);
    towerBase.position.y = 1.8;
    towerBase.castShadow = true;
    spireGroup.add(towerBase);

    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.7, 16), roofPurpleMat);
    towerRoof.position.y = 4.45;
    spireGroup.add(towerRoof);

    const astrolabeRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 12, 24), goldMat);
    astrolabeRing.position.y = 5.65;
    astrolabeRing.userData.floatBubble = true;
    astrolabeRing.userData.baseY = 5.65;
    astrolabeRing.userData.phase = 2.5;
    spireGroup.add(astrolabeRing);

    roomGroup.add(spireGroup);
  }

  // 3D 방 구조물 (바닥 타일, 양쪽 벽, 몰딩, 조명, 가구 슬롯) 생성
  function buildRoomScene(themeKey) {
    while (roomGroup.children.length > 0) {
      roomGroup.remove(roomGroup.children[0]);
    }
    furnitureMeshes = {};

    const theme = ROOM_THEMES[themeKey];
    scene.background = new THREE.Color(theme.wallColor).multiplyScalar(0.45);

    // 조명 설정
    const ambient = new THREE.AmbientLight(theme.ambientColor, 0.75);
    roomGroup.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
    dirLight.position.set(8, 16, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    roomGroup.add(dirLight);

    // 1. 체크무늬 아이소메트릭 바닥 타일 (10x10)
    const tileGeo = new THREE.BoxGeometry(1, 0.25, 1);
    const mat1 = new THREE.MeshStandardMaterial({ color: theme.floorColor1, roughness: 0.6 });
    const mat2 = new THREE.MeshStandardMaterial({ color: theme.floorColor2, roughness: 0.65 });

    for (let x = -4.5; x <= 4.5; x += 1) {
      for (let z = -4.5; z <= 4.5; z += 1) {
        const isEven = (Math.round(x + 4.5) + Math.round(z + 4.5)) % 2 === 0;
        const tile = new THREE.Mesh(tileGeo, isEven ? mat1 : mat2);
        tile.position.set(x, -0.125, z);
        tile.receiveShadow = true;
        roomGroup.add(tile);
      }
    }

    // 2. 좌측 벽 & 우측 뒷벽 (아이소메트릭 디오라마 룸)
    const wallMat = new THREE.MeshStandardMaterial({ color: theme.wallColor, roughness: 0.7 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.5, roughness: 0.3 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.3, 4.6, 0.3), wallMat);
    backWall.position.set(0, 2.15, -5.0);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 10.3), wallMat);
    leftWall.position.set(-5.0, 2.15, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // 황금 몰딩 테두리
    const topTrimBack = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.2, 0.36), trimMat);
    topTrimBack.position.set(0, 4.45, -5.0);
    roomGroup.add(topTrimBack);

    const topTrimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 10.4), trimMat);
    topTrimLeft.position.set(-5.0, 4.45, 0);
    roomGroup.add(topTrimLeft);

    // 3. 각 가구 스팟 렌더링 (복구 전 잔해 vs 복구 완료 3D 가구)
    for (const spot of theme.spots) {
      renderSpotMesh(spot);
    }
  }

  function renderSpotMesh(spot, overrideStyleIdx = null) {
    if (furnitureMeshes[spot.id]) {
      roomGroup.remove(furnitureMeshes[spot.id]);
    }

    const useStyle = overrideStyleIdx !== null ? overrideStyleIdx : spot.styleIdx;
    const palette = STYLE_PALETTES[useStyle] || STYLE_PALETTES[0];

    const group = new THREE.Group();
    group.position.set(spot.pos[0], spot.pos[1], spot.pos[2]);

    const showBuilt = spot.done || (activeInspectSpot && activeInspectSpot.id === spot.id);

    if (!showBuilt) {
      // 복구 전: 부서진 나무 판자, 잔해 돌멩이, 보라색 연기 코어
      const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const plankMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });

      const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.35), plankMat);
      p1.position.set(0, 0.12, 0);
      p1.rotation.y = 0.4;
      p1.rotation.z = 0.12;
      group.add(p1);

      const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.3), plankMat);
      p2.position.set(0.1, 0.2, 0.1);
      p2.rotation.y = -0.5;
      p2.rotation.z = -0.15;
      group.add(p2);

      for (let i = 0; i < 4; i++) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), rubbleMat);
        rock.position.set(Math.cos(i * 1.5) * 0.45, 0.18, Math.sin(i * 1.5) * 0.45);
        rock.castShadow = true;
        group.add(rock);
      }
    } else {
      // 복구 완료(또는 디자인 프리뷰 중): 디테일한 3D 가구 메쉬 생성!
      build3DFurnitureModel(group, spot.type, palette);

      // 가구 전용 포인트 라이트 추가
      const ptLight = new THREE.PointLight(palette.accent, 0.85, 5.5);
      ptLight.position.set(0, 2.0, 0);
      group.add(ptLight);
    }

    roomGroup.add(group);
    furnitureMeshes[spot.id] = group;
    return group;
  }

  function build3DFurnitureModel(group, type, pal) {
    const matPrimary = new THREE.MeshStandardMaterial({ color: pal.primary, roughness: 0.35, metalness: 0.2 });
    const matSecondary = new THREE.MeshStandardMaterial({ color: pal.secondary, roughness: 0.3, metalness: 0.15 });
    const matAccent = new THREE.MeshStandardMaterial({
      color: pal.accent,
      emissive: pal.accent,
      emissiveIntensity: 0.35,
      roughness: 0.2,
    });
    const matWood = new THREE.MeshStandardMaterial({ color: pal.wood, roughness: 0.65 });

    if (type === "cauldron") {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.3, 16), matPrimary);
      base.position.y = 0.15;
      base.castShadow = true;
      group.add(base);

      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 16), matWood);
      pot.scale.set(1, 0.82, 1);
      pot.position.y = 0.82;
      pot.castShadow = true;
      group.add(pot);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 12, 24), matPrimary);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 1.32;
      group.add(rim);

      const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 16), matAccent);
      liquid.position.y = 1.28;
      group.add(liquid);

      for (let i = 0; i < 3; i++) {
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), matSecondary);
        bubble.position.set((i - 1) * 0.25, 1.48 + (i % 2) * 0.18, 0);
        bubble.userData.floatBubble = true;
        bubble.userData.baseY = bubble.position.y;
        bubble.userData.phase = i * 1.5;
        group.add(bubble);
      }
    } else if (type === "bookcase") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.8), matWood);
      body.position.y = 1.4;
      body.castShadow = true;
      group.add(body);

      const crown = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.95), matPrimary);
      crown.position.y = 2.9;
      group.add(crown);

      for (let row = 0; row < 3; row++) {
        for (let b = -3; b <= 3; b++) {
          const bkMat = b % 2 === 0 ? matSecondary : b % 3 === 0 ? matAccent : matPrimary;
          const book = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.55), bkMat);
          book.position.set(b * 0.26, 0.6 + row * 0.8, 0.2);
          group.add(book);
        }
      }
    } else if (type === "planter") {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.9, 12), matWood);
      stand.position.y = 0.45;
      stand.castShadow = true;
      group.add(stand);

      const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.08, 10, 24), matPrimary);
      goldRing.rotation.x = Math.PI / 2;
      goldRing.position.y = 0.9;
      group.add(goldRing);

      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75), matSecondary);
      foliage.position.y = 1.55;
      foliage.castShadow = true;
      group.add(foliage);

      const flower = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), matAccent);
      flower.position.y = 2.35;
      flower.userData.floatBubble = true;
      flower.userData.baseY = 2.35;
      flower.userData.phase = 0.5;
      group.add(flower);
    } else if (type === "window") {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.25), matPrimary);
      frame.castShadow = true;
      group.add(frame);

      const glass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.3), matAccent);
      group.add(glass);

      const innerOrb = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 12, 24), matSecondary);
      innerOrb.position.z = 0.16;
      group.add(innerOrb);
    } else if (type === "counter") {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.1, 1.1), matWood);
      bar.position.y = 0.55;
      bar.castShadow = true;
      group.add(bar);

      const topCounter = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.16, 1.25), matPrimary);
      topCounter.position.y = 1.15;
      group.add(topCounter);

      const machine = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.7, 12), matSecondary);
      machine.position.set(-0.6, 1.55, 0);
      group.add(machine);

      const displayCake = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.35, 16), matAccent);
      displayCake.position.set(0.55, 1.4, 0);
      group.add(displayCake);
    } else if (type === "parasol") {
      const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.14, 20), matPrimary);
      tableTop.position.y = 0.85;
      tableTop.castShadow = true;
      group.add(tableTop);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 10), matWood);
      pole.position.y = 1.3;
      group.add(pole);

      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.75, 12), matSecondary);
      umbrella.position.y = 2.65;
      umbrella.castShadow = true;
      group.add(umbrella);

      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), matAccent);
      cup.position.set(0.35, 1.05, 0.25);
      group.add(cup);
    } else if (type === "fountain") {
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 0.45, 20), matPrimary);
      pool.position.y = 0.22;
      pool.castShadow = true;
      group.add(pool);

      const water = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.48, 20), matSecondary);
      water.position.y = 0.24;
      group.add(water);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.3, 12), matPrimary);
      pillar.position.y = 0.85;
      group.add(pillar);

      const topGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), matAccent);
      topGem.position.y = 1.75;
      topGem.userData.floatBubble = true;
      topGem.userData.baseY = 1.75;
      topGem.userData.phase = 0;
      group.add(topGem);
    } else if (type === "oven") {
      const ovenBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.1, 1.4), matPrimary);
      ovenBody.position.y = 1.05;
      ovenBody.castShadow = true;
      group.add(ovenBody);

      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 1.1, 12), matWood);
      chimney.position.set(0, 2.5, -0.2);
      group.add(chimney);

      const fireGlow = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), matAccent);
      fireGlow.position.set(0, 0.75, 0.55);
      group.add(fireGlow);
    }
  }

  // 3D 좌표를 2D 화면 좌표로 변환하여 가구 위에 [🔨 복구 핀] 또는 성 전체 지도 위에 [🏰 구역 이동 핀] 배치
  function updatePinsDOM() {
    if (!pinsContainerEl || !camera || !containerEl) return;
    pinsContainerEl.innerHTML = "";

    const rect = containerEl.getBoundingClientRect();

    // 1. 마녀의 성 전체 지도 모드일 때: 4개 성 구역(공방/앞마당/온실/첨탑) 입장 핀 표시
    if (isCastleMapMode) {
      for (const [tKey, theme] of Object.entries(ROOM_THEMES)) {
        const doneCount = theme.spots.filter((s) => s.done).length;
        const totalCount = theme.spots.length;
        const pPos = theme.castlePinPos || [0, 2, 0];
        const vec = new THREE.Vector3(pPos[0], pPos[1], pPos[2]);
        vec.project(camera);

        const rawX = (vec.x * 0.5 + 0.5) * rect.width;
        const rawY = (-(vec.y * 0.5) + 0.5) * rect.height;
        const x = Math.max(68, Math.min(rect.width - 68, rawX));
        const y = Math.max(42, Math.min(rect.height - 68, rawY));

        const pin = document.createElement("button");
        pin.className = `room-pin castle-zone-pin ${tKey === currentThemeKey ? "pin-ready" : ""}`;
        pin.innerHTML = `${theme.shortName} <b>${doneCount}/${totalCount}</b> <span>입장➔</span>`;
        pin.style.left = `${x}px`;
        pin.style.top = `${y}px`;
        pin.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onSelectRoomFromMapCallback) {
            onSelectRoomFromMapCallback(tKey);
          } else {
            switchTheme(tKey);
          }
        });
        pinsContainerEl.appendChild(pin);
      }
      return;
    }

    // 2. 개별 방 인테리어 모드일 때
    const theme = ROOM_THEMES[currentThemeKey];
    const stars = getStarsCallback ? getStarsCallback() : 0;

    if (activeInspectSpot) return;

    for (const spot of theme.spots) {
      const vec = new THREE.Vector3(spot.pos[0], spot.pos[1] + 1.35, spot.pos[2]);
      vec.project(camera);

      const rawX = (vec.x * 0.5 + 0.5) * rect.width;
      const rawY = (-(vec.y * 0.5) + 0.5) * rect.height;
      const x = Math.max(62, Math.min(rect.width - 62, rawX));
      const y = Math.max(42, Math.min(rect.height - 68, rawY));

      const pin = document.createElement("button");
      if (!spot.done) {
        const canAfford = stars >= spot.cost;
        pin.className = `room-pin ${canAfford ? "pin-ready" : "pin-locked"}`;
        pin.innerHTML = `🔨 <span>${spot.name}</span> <b>🌟${spot.cost}</b>`;
      } else {
        pin.className = "room-pin pin-customize";
        pin.innerHTML = `🎨 <span>${spot.name}</span>`;
      }

      pin.style.left = `${x}px`;
      pin.style.top = `${y}px`;
      pin.addEventListener("click", (e) => {
        e.stopPropagation();
        focusOnSpotForDesign(spot);
      });

      pinsContainerEl.appendChild(pin);
    }
  }

  // 가구 클릭 시 카메라 줌인 연출 + 3가지 인테리어 스타일 선택창 오픈!
  function focusOnSpotForDesign(spot) {
    if (isCastleMapMode) {
      switchTheme(currentThemeKey);
    }
    activeInspectSpot = spot;
    previewStyleIdx = spot.styleIdx || 0;

    renderSpotMesh(spot, previewStyleIdx);
    updatePinsDOM();
    showStyleSelectorBar(spot);

    if (window.gsap && camera) {
      gsap.to(camera, {
        zoom: 1.55,
        duration: 0.65,
        ease: "power2.out",
        onUpdate: () => camera.updateProjectionMatrix(),
      });
      gsap.to(camLookTarget, {
        x: spot.pos[0],
        y: spot.pos[1] + 0.9,
        z: spot.pos[2],
        duration: 0.65,
        ease: "power2.out",
        onUpdate: () => camera.lookAt(camLookTarget.x, camLookTarget.y, camLookTarget.z),
      });
    }
  }

  function showStyleSelectorBar(spot) {
    const bar = document.getElementById("style-selector-overlay");
    if (!bar) return;
    bar.classList.remove("hidden");

    const stars = getStarsCallback ? getStarsCallback() : 0;
    const canAfford = spot.done || stars >= spot.cost;

    const swatchesHtml = STYLE_PALETTES.map(
      (p, idx) => `
      <button class="style-swatch-btn ${idx === previewStyleIdx ? "active" : ""}" data-style="${idx}">
        <span class="swatch-dot" style="background:#${p.primary.toString(16).padStart(6, "0")}"></span>
        <span>${p.name}</span>
      </button>
    `
    ).join("");

    bar.innerHTML = `
      <div class="style-picker-card">
        <div class="style-picker-head">
          <strong>🛋️ ${spot.name} 디자인 선택</strong>
          <button class="style-cancel-btn" id="btn-cancel-style">✕ 닫기</button>
        </div>
        <div class="style-swatches-row">${swatchesHtml}</div>
        <button class="style-confirm-btn" id="btn-confirm-style" ${canAfford ? "" : "disabled"}>
          ${
            spot.done
              ? "✨ 이 스타일로 변경 & 스토리 다시보기 (무료)"
              : canAfford
              ? `🔨 시공 확정 & 스토리 보기 (🌟 ${spot.cost} 소모)`
              : `🌟 마력별 ${spot.cost}개 필요 (주문 완료로 획득)`
          }
        </button>
      </div>
    `;

    bar.querySelectorAll(".style-swatch-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        previewStyleIdx = parseInt(btn.dataset.style, 10);
        const meshGroup = renderSpotMesh(spot, previewStyleIdx);
        if (window.gsap && meshGroup) {
          gsap.fromTo(
            meshGroup.scale,
            { x: 0.7, y: 0.7, z: 0.7 },
            { x: 1, y: 1, z: 1, duration: 0.38, ease: "back.out(2)" }
          );
        }
        showStyleSelectorBar(spot);
      });
    });

    document.getElementById("btn-cancel-style").addEventListener("click", () => {
      const targetSpot = activeInspectSpot;
      activeInspectSpot = null;
      bar.classList.add("hidden");
      if (targetSpot) renderSpotMesh(targetSpot);
      resetCameraSmooth();
      updatePinsDOM();
    });

    document.getElementById("btn-confirm-style").addEventListener("click", () => {
      const wasAlreadyDone = spot.done;
      spot.styleIdx = previewStyleIdx;
      spot.done = true;
      activeInspectSpot = null;
      bar.classList.add("hidden");

      const meshGroup = renderSpotMesh(spot, spot.styleIdx);
      spawn3DConstructionBurst(spot.pos);

      if (window.gsap && meshGroup) {
        gsap.fromTo(
          meshGroup.position,
          { y: spot.pos[1] + 2.8 },
          { y: spot.pos[1], duration: 0.65, ease: "bounce.out" }
        );
        gsap.fromTo(
          meshGroup.scale,
          { x: 0.4, y: 0.4, z: 0.4 },
          { x: 1, y: 1, z: 1, duration: 0.55, ease: "elastic.out(1, 0.5)" }
        );
      }

      if (onRenovateCallback) {
        onRenovateCallback(spot, wasAlreadyDone, ROOM_THEMES[currentThemeKey]);
      }

      setTimeout(() => {
        resetCameraSmooth();
        updatePinsDOM();
      }, 650);
    });
  }

  function spawn3DConstructionBurst(pos) {
    if (!roomGroup) return;
    for (let i = 0; i < 18; i++) {
      const pGeo = new THREE.OctahedronGeometry(0.14);
      const pMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfde047 : 0xec4899 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(pos[0], pos[1] + 0.6, pos[2]);
      roomGroup.add(p);

      const angle = (i / 18) * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.06;
      particles.push({
        mesh: p,
        vx: Math.cos(angle) * speed,
        vy: 0.07 + Math.random() * 0.06,
        vz: Math.sin(angle) * speed,
        life: 36,
      });
    }
  }

  function resetCameraSmooth() {
    if (!window.gsap || !camera) return;
    gsap.to(camera, {
      zoom: 1.0,
      duration: 0.55,
      ease: "power2.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    });
    gsap.to(camLookTarget, {
      x: 0,
      y: 1.0,
      z: 0,
      duration: 0.55,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(camLookTarget.x, camLookTarget.y, camLookTarget.z),
    });
  }

  function setExpandedView(expanded) {
    isExpanded = expanded;
    setTimeout(() => {
      handleResize();
      updatePinsDOM();
    }, 60);
  }

  function animateLoop() {
    animFrameId = requestAnimationFrame(animateLoop);
    const t = performance.now() * 0.003;

    if (roomGroup) {
      roomGroup.traverse((obj) => {
        if (obj.userData && obj.userData.floatBubble) {
          obj.position.y = obj.userData.baseY + Math.sin(t + obj.userData.phase) * 0.12;
          obj.rotation.y += 0.025;
        }
      });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.mesh.position.x += pt.vx;
      pt.mesh.position.y += pt.vy;
      pt.mesh.position.z += pt.vz;
      pt.vy -= 0.003;
      pt.mesh.rotation.x += 0.1;
      pt.mesh.rotation.y += 0.1;
      pt.life--;
      if (pt.life <= 0) {
        roomGroup.remove(pt.mesh);
        particles.splice(i, 1);
      }
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // 구역 순차 해금·스토리 화수 판정 (규칙은 GameProgression에 위임)
  function getZoneProgress() {
    const rooms = Object.entries(ROOM_THEMES).map(([key, th]) => ({
      key,
      spots: th.spots.map((s) => ({ id: s.id, done: !!s.done })),
    }));
    return window.GameProgression.computeZoneProgress(rooms);
  }

  // 스토리 순서대로 정렬된 전체 장소 목록 (제N화)
  function getStorySpots() {
    const zp = getZoneProgress();
    const list = [];
    for (const [themeKey, theme] of Object.entries(ROOM_THEMES)) {
      for (const spot of theme.spots) {
        list.push({ themeKey, theme, spot, chapter: zp.chapterById[spot.id] });
      }
    }
    return list;
  }

  function getProgressStats() {
    const theme = ROOM_THEMES[currentThemeKey];
    const done = theme.spots.filter((s) => s.done).length;
    const nextSpot = theme.spots.find((s) => !s.done) || null;

    let totalCastleDone = 0;
    let totalCastleSpots = 0;
    for (const th of Object.values(ROOM_THEMES)) {
      totalCastleDone += th.spots.filter((s) => s.done).length;
      totalCastleSpots += th.spots.length;
    }

    return {
      isCastleMapMode,
      themeTitle: isCastleMapMode ? "🏰 마녀 셀레네의 대마법성 (전체 성곽 지도)" : theme.title,
      themeSubtitle: isCastleMapMode
        ? "마녀의 성 각 구역 핀을 눌러 이동하고 성 안팎을 아름답게 복원하세요!"
        : theme.subtitle,
      done: isCastleMapMode ? totalCastleDone : done,
      total: isCastleMapMode ? totalCastleSpots : theme.spots.length,
      nextSpot,
      allThemes: ROOM_THEMES,
      currentThemeKey,
      totalCastleDone,
      totalCastleSpots,
    };
  }

  function triggerNextSpot() {
    if (isCastleMapMode) {
      // 아직 미완성인 구역이 있으면 그 구역으로 먼저 이동
      for (const [tKey, th] of Object.entries(ROOM_THEMES)) {
        const incomplete = th.spots.find((s) => !s.done);
        if (incomplete) {
          if (onSelectRoomFromMapCallback) onSelectRoomFromMapCallback(tKey);
          else switchTheme(tKey);
          setTimeout(() => focusOnSpotForDesign(incomplete), 200);
          return;
        }
      }
      switchTheme(currentThemeKey);
    }
    const { nextSpot, allThemes } = getProgressStats();
    if (nextSpot) {
      focusOnSpotForDesign(nextSpot);
    } else {
      const spots = allThemes[currentThemeKey].spots;
      if (spots.length > 0) focusOnSpotForDesign(spots[0]);
    }
  }

  function exportRoomsState() {
    const out = {};
    for (const [tKey, theme] of Object.entries(ROOM_THEMES)) {
      out[tKey] = {};
      for (const s of theme.spots) {
        out[tKey][s.id] = { done: !!s.done, styleIdx: s.styleIdx || 0 };
      }
    }
    return {
      currentThemeKey,
      rooms: out,
    };
  }

  function importRoomsState(savedRooms, savedThemeKey) {
    if (savedRooms && typeof savedRooms === "object") {
      for (const [tKey, spotMap] of Object.entries(savedRooms)) {
        if (ROOM_THEMES[tKey] && spotMap) {
          for (const spot of ROOM_THEMES[tKey].spots) {
            if (spotMap[spot.id]) {
              spot.done = !!spotMap[spot.id].done;
              if (typeof spotMap[spot.id].styleIdx === "number") {
                spot.styleIdx = spotMap[spot.id].styleIdx;
              }
            }
          }
        }
      }
    }
    if (savedThemeKey && ROOM_THEMES[savedThemeKey]) {
      currentThemeKey = savedThemeKey;
    }
    if (roomGroup) {
      if (isCastleMapMode) buildCastleOverviewScene();
      else buildRoomScene(currentThemeKey);
      updatePinsDOM();
    }
  }

  return {
    init,
    switchTheme,
    handleResize,
    updatePinsDOM,
    setExpandedView,
    getProgressStats,
    triggerNextSpot,
    focusOnSpotForDesign,
    exportRoomsState,
    importRoomsState,
    getZoneProgress,
    getStorySpots,
  };
})();
