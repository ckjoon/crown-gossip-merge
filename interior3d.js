// interior3d.js — Three.js + GSAP 기반 3D 아이소메트릭 인테리어 빌딩 & 카메라 연출 엔진
// Gossip Harbor 스타일의 다중 테마 인테리어 공간 복구, 3가지 디자인 스타일 선택, 카메라 줌/팬 연출을 담당합니다.

window.Interior3DEngine = (function () {
  const STYLE_PALETTES = [
    { id: 0, name: "로얄 골드", primary: 0xd97706, secondary: 0x7c3aed, accent: 0xfde047, wood: 0x5c2d16 },
    { id: 1, name: "사파이어 민트", primary: 0x0284c7, secondary: 0x10b981, accent: 0xe0f2fe, wood: 0x334155 },
    { id: 2, name: "크림슨 로즈", primary: 0xe11d48, secondary: 0xf43f5e, accent: 0xfef08a, wood: 0x451a03 },
  ];

  // 4가지 Gossip Harbor 스타일 테마 룸 정의
  const ROOM_THEMES = {
    alchemy: {
      id: "alchemy",
      title: "🔮 제1구역: 마녀의 연금술 공방",
      subtitle: "폭발로 부서진 가마솥 화로와 마도서 서재를 복구하세요",
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
          story: "가마솥 바닥에서 수상한 폭약 결정 흔적을 찾아냈습니다! 이제 더 강력한 물약을 연성할 수 있어요.",
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
          story: "쏟아진 마도서들을 마법 책장에 정리하자 숨겨진 비밀 레시피 페이지가 나타났습니다!",
          done: false,
          styleIdx: 0,
        },
        {
          id: "alc_herbtable",
          name: "달빛 온실 화분대",
          cost: 3,
          pos: [3.0, 0, -2.8],
          camOffset: [6, 7, 5],
          type: "planter",
          story: "유리 온실 화분대에 달빛이 비치자 희귀한 영초들이 빠르게 자라나기 시작합니다!",
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
          story: "깨진 창문을 황실 스테인드글라스로 복원하자 공방 전체에 신비로운 오로라 빛이 감돕니다.",
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
          story: "손님들을 맞이할 고급 연금술 바 카운터가 완성되었습니다! VIP 손님들이 몰려옵니다!",
          done: false,
          styleIdx: 0,
        },
      ],
    },

    harbor: {
      id: "harbor",
      title: "🏖️ 제2구역: 가십 하버 오션뷰 카페",
      subtitle: "폭풍우에 망가진 해변 브런치 테라스와 에스프레소 바를 재건하세요",
      wallColor: 0x0ea5e9,
      floorColor1: 0xd9a066,
      floorColor2: 0xc48c52,
      ambientColor: 0xfef08a,
      spots: [
        {
          id: "hb_espresso",
          name: "오션뷰 에스프레소 바",
          cost: 2,
          pos: [-2.8, 0, -2.8],
          camOffset: [6, 7, 6],
          type: "counter",
          story: "퀸의 자랑이던 이탈리아제 에스프레소 머신이 다시 향긋한 커피를 내리기 시작합니다!",
          done: false,
          styleIdx: 1,
        },
        {
          id: "hb_parasol",
          name: "해변 파라솔 브런치석",
          cost: 2,
          pos: [1.8, 0, 1.8],
          camOffset: [6, 7, 6],
          type: "parasol",
          story: "바닷바람을 맞으며 크루아상과 라떼를 즐길 수 있는 산토리니풍 파라솔 테이블입니다!",
          done: false,
          styleIdx: 1,
        },
        {
          id: "hb_fountain",
          name: "황금 돌고래 분수대",
          cost: 3,
          pos: [0, 0, -0.5],
          camOffset: [6, 7, 6],
          type: "fountain",
          story: "하버 카페의 랜드마크인 분수대에서 시원한 물줄기가 솟구치며 행운의 동전이 반짝입니다!",
          done: false,
          styleIdx: 1,
        },
        {
          id: "hb_bakery",
          name: "베이커리 화덕 & 진열장",
          cost: 3,
          pos: [2.8, 0, -2.8],
          camOffset: [6, 7, 6],
          type: "oven",
          story: "갓 구운 딸기 쇼트케이크와 마카롱 냄새가 선착장까지 퍼져나갑니다!",
          done: false,
          styleIdx: 1,
        },
        {
          id: "hb_arch",
          name: "선셋 네온 하버 아치",
          cost: 4,
          pos: [0, 2.2, -4.7],
          camOffset: [5, 6, 5],
          type: "window",
          story: "노을빛 네온 간판이 켜지며 가십 하버 최고의 핫플레이스로 완벽 부활했습니다!",
          done: false,
          styleIdx: 1,
        },
      ],
    },

    garden: {
      id: "garden",
      title: "🌿 제3구역: 문라이트 보타니컬 온실",
      subtitle: "신비한 마법 식물과 허브티를 즐기는 로얄 유리온실 정원",
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
          story: "투명한 연못 위로 빛나는 수련꽃이 피어나며 온실의 마나 농도가 짙어집니다.",
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
          story: "귀족 손님들이 오로라 밀크티와 다과를 즐기는 우아한 정원 테이블입니다.",
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
          story: "전설 속 세계수의 묘목이 황금빛 잎사귀를 틔웠습니다!",
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
          story: "갓 딴 캐모마일과 달빛 이슬을 블렌딩하는 전용 티 바가 완성되었습니다.",
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
          story: "별빛이 쏟아져 들어오는 거대한 크리스탈 아치가 온실을 비춥니다!",
          done: false,
          styleIdx: 1,
        },
      ],
    },

    banquet: {
      id: "banquet",
      title: "👑 제4구역: 황실 아스트랄 대연회장",
      subtitle: "천문대 관측 돔과 황실 만찬이 열리는 최고급 홀을 완성하세요",
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
          story: "거대한 황금 천구의가 회전하며 밤하늘의 별자리 에너지를 끌어모읍니다!",
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
          story: "천 년의 역사가 담긴 왕실 마도서들이 황금 서가에 위엄 있게 자리 잡았습니다.",
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
          story: "3단 웨딩 케이크와 최고급 보석 잔이 세팅된 화려한 만찬석입니다!",
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
          story: "꺼지지 않는 드래곤의 불꽃이 연회장을 따뜻하게 밝힙니다.",
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
          story: "모든 구역의 인테리어 빌딩을 마스터했습니다! 당신은 전설의 대연금술사입니다!",
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
  let activeInspectSpot = null; // 현재 디자인 선택 중인 가구 spot
  let previewStyleIdx = 0;
  let onRenovateCallback = null;
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
    animateLoop();

    window.addEventListener("resize", handleResize);
  }

  function handleResize() {
    if (!containerEl || !renderer || !camera) return;
    const w = containerEl.clientWidth || 500;
    const h = containerEl.clientHeight || 220;
    const aspect = w / h;
    const d = isExpanded ? 5.8 : 5.4;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function switchTheme(themeKey) {
    if (!ROOM_THEMES[themeKey]) return;
    currentThemeKey = themeKey;
    activeInspectSpot = null;
    resetCameraSmooth();
    buildRoomScene(themeKey);
    updatePinsDOM();
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
      // 황금 제단 + 마법 가마솥 + 끓어오르는 마나 구체
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
      // 아치형 마법 책장 + 다채로운 책들
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
      // 유리 돔 테라리움 & 신비한 꽃나무
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
      // 빛나는 스테인드글라스 아치 창문
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.25), matPrimary);
      frame.castShadow = true;
      group.add(frame);

      const glass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.3), matAccent);
      group.add(glass);

      const innerOrb = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 12, 24), matSecondary);
      innerOrb.position.z = 0.16;
      group.add(innerOrb);
    } else if (type === "counter") {
      // L자/일자 쇼케이스 카운터 바 + 상단 물약/커피머신
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
      // 해변/정원 파라솔 & 원형 브런치 테이블
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
      // 중앙 분수대
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
      // 화덕 오븐
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

  // 3D 좌표를 2D 화면 좌표로 변환하여 가구 위에 [🔨 복구 핀] 배치
  function updatePinsDOM() {
    if (!pinsContainerEl || !camera || !containerEl) return;
    pinsContainerEl.innerHTML = "";

    const theme = ROOM_THEMES[currentThemeKey];
    const stars = getStarsCallback ? getStarsCallback() : 0;
    const rect = containerEl.getBoundingClientRect();

    // 디자인 선택기가 열려 있으면 핀 숨김
    if (activeInspectSpot) return;

    for (const spot of theme.spots) {
      const vec = new THREE.Vector3(spot.pos[0], spot.pos[1] + 1.35, spot.pos[2]);
      vec.project(camera);

      const x = (vec.x * 0.5 + 0.5) * rect.width;
      const y = (-(vec.y * 0.5) + 0.5) * rect.height;

      const pin = document.createElement("button");
      if (!spot.done) {
        const canAfford = stars >= spot.cost;
        pin.className = `room-pin ${canAfford ? "pin-ready" : "pin-locked"}`;
        pin.innerHTML = `🔨 <span>${spot.name}</span> <b>🌟${spot.cost}</b>`;
      } else {
        // 이미 완성된 가구는 뷰포트 확장 모드일 때 스타일 변경 버튼 표시
        if (!isExpanded) continue;
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
              ? "✨ 이 스타일로 변경 (무료)"
              : canAfford
              ? `🔨 시공 확정 (🌟 ${spot.cost} 소모)`
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

      // GSAP 탄성 시공 애니메이션
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
        onRenovateCallback(spot, wasAlreadyDone);
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

    // 가구 내 떠다니는 마법 오브/꽃 애니메이션
    if (roomGroup) {
      roomGroup.traverse((obj) => {
        if (obj.userData && obj.userData.floatBubble) {
          obj.position.y = obj.userData.baseY + Math.sin(t + obj.userData.phase) * 0.12;
          obj.rotation.y += 0.025;
        }
      });
    }

    // 3D 시공 파티클 업데이트
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

  function getProgressStats() {
    const theme = ROOM_THEMES[currentThemeKey];
    const done = theme.spots.filter((s) => s.done).length;
    const nextSpot = theme.spots.find((s) => !s.done) || null;
    return {
      themeTitle: theme.title,
      themeSubtitle: theme.subtitle,
      done,
      total: theme.spots.length,
      nextSpot,
      allThemes: ROOM_THEMES,
      currentThemeKey,
    };
  }

  function triggerNextSpot() {
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
      buildRoomScene(currentThemeKey);
      updatePinsDOM();
    }
  }

  return {
    init,
    switchTheme,
    updatePinsDOM,
    setExpandedView,
    getProgressStats,
    triggerNextSpot,
    exportRoomsState,
    importRoomsState,
  };
})();
