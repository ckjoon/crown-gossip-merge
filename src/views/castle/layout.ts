// layout.ts — 성 3D 화면 전용 데이터: 장소별 3D 위치·카메라 오프셋·가구 종류, 구역별 색과 성 지도 핀 위치 (v2 ROOM_THEMES에서 분리)

import type { ZoneKey } from "../../core/rules/progression";

export interface SpotLayout {
  pos: [number, number, number];
  camOffset: [number, number, number];
  type: string;
}

export interface ZoneLook {
  wallColor: number;
  floorColor1: number;
  floorColor2: number;
  ambientColor: number;
  castlePinPos: [number, number, number];
}

export const SPOT_LAYOUT: Record<string, SpotLayout> = {
  alc_cauldron: {
    pos: [
      0,
      0,
      0
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "cauldron"
  },
  alc_bookcase: {
    pos: [
      -3.2,
      0,
      -3.2
    ],
    camOffset: [
      5,
      7,
      5
    ],
    type: "bookcase"
  },
  alc_herbtable: {
    pos: [
      3,
      0,
      -2.8
    ],
    camOffset: [
      6,
      7,
      5
    ],
    type: "planter"
  },
  alc_window: {
    pos: [
      0,
      2.4,
      -4.7
    ],
    camOffset: [
      5,
      6,
      5
    ],
    type: "window"
  },
  alc_counter: {
    pos: [
      -2.6,
      0,
      2.4
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "counter"
  },
  hb_espresso: {
    pos: [
      -2.8,
      0,
      -2.8
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "counter"
  },
  hb_parasol: {
    pos: [
      1.8,
      0,
      1.8
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "parasol"
  },
  hb_fountain: {
    pos: [
      0,
      0,
      -0.5
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "fountain"
  },
  hb_bakery: {
    pos: [
      2.8,
      0,
      -2.8
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "oven"
  },
  hb_arch: {
    pos: [
      0,
      2.2,
      -4.7
    ],
    camOffset: [
      5,
      6,
      5
    ],
    type: "window"
  },
  gd_pond: {
    pos: [
      0,
      0,
      0
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "fountain"
  },
  gd_gazebo: {
    pos: [
      2.2,
      0,
      2
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "parasol"
  },
  gd_planter: {
    pos: [
      -2.8,
      0,
      -2.8
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "planter"
  },
  gd_teabar: {
    pos: [
      2.8,
      0,
      -2.8
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "counter"
  },
  gd_dome: {
    pos: [
      0,
      2.3,
      -4.7
    ],
    camOffset: [
      5,
      6,
      5
    ],
    type: "window"
  },
  bq_astrolabe: {
    pos: [
      0,
      0,
      0
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "cauldron"
  },
  bq_library: {
    pos: [
      -3,
      0,
      -3
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "bookcase"
  },
  bq_feast: {
    pos: [
      2,
      0,
      2
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "parasol"
  },
  bq_hearth: {
    pos: [
      3,
      0,
      -2.8
    ],
    camOffset: [
      6,
      7,
      6
    ],
    type: "oven"
  },
  bq_portal: {
    pos: [
      0,
      2.4,
      -4.7
    ],
    camOffset: [
      5,
      6,
      5
    ],
    type: "window"
  }
};

export const ZONE_LOOK: Record<ZoneKey, ZoneLook> = {
  alchemy: {
    wallColor: 0x2e1a47,
    floorColor1: 0x3d2759,
    floorColor2: 0x311e47,
    ambientColor: 0x9370db,
    castlePinPos: [
      -1.8,
      2.7,
      -1.2
    ]
  },
  harbor: {
    wallColor: 0x1e3a8a,
    floorColor1: 0xd9a066,
    floorColor2: 0xc48c52,
    ambientColor: 0xfef08a,
    castlePinPos: [
      -2,
      1.5,
      2.5
    ]
  },
  garden: {
    wallColor: 0x064e3b,
    floorColor1: 0x166534,
    floorColor2: 0x14532d,
    ambientColor: 0x6ee7b7,
    castlePinPos: [
      2.6,
      2,
      1.5
    ]
  },
  banquet: {
    wallColor: 0x3b0764,
    floorColor1: 0x4c1d95,
    floorColor2: 0x3b0764,
    ambientColor: 0xfde047,
    castlePinPos: [
      2,
      4.1,
      -2
    ]
  }
};
