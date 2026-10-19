// layout.ts — 성 3D 화면 전용 데이터: 장소별 3D 위치(방 조각 기준)·가구 종류, 구역별 색 (v2 ROOM_THEMES에서 분리)

import type { ZoneKey } from "../../core/rules/progression";
import { ZONE_MODULES, moduleIndexOf, spotAnchor } from "./modules";

export interface SpotLayout {
  pos: [number, number, number];
  type: string;
}

export interface ZoneLook {
  wallColor: number;
  floorColor1: number;
  floorColor2: number;
  ambientColor: number;
}

// 장소별 가구 종류. 창문형(벽에 거는 가구)은 걸리는 높이(wallY)를 갖는다. 위치는 방 조각(modules.ts)에서 계산
const SPOT_BASE: Record<string, { type: string; wallY?: number }> = {
  alc_cauldron: { type: "cauldron" },
  alc_bookcase: { type: "bookcase" },
  alc_herbtable: { type: "planter" },
  alc_window: { type: "window", wallY: 2.4 },
  alc_counter: { type: "counter" },
  hb_espresso: { type: "counter" },
  hb_parasol: { type: "parasol" },
  hb_fountain: { type: "fountain" },
  hb_bakery: { type: "oven" },
  hb_arch: { type: "window", wallY: 2.2 },
  gd_pond: { type: "fountain" },
  gd_gazebo: { type: "parasol" },
  gd_planter: { type: "planter" },
  gd_teabar: { type: "counter" },
  gd_dome: { type: "window", wallY: 2.3 },
  bq_astrolabe: { type: "cauldron" },
  bq_library: { type: "bookcase" },
  bq_feast: { type: "parasol" },
  bq_hearth: { type: "oven" },
  bq_portal: { type: "window", wallY: 2.4 },
  cel_wine: { type: "counter" },
  cel_candle: { type: "cauldron" },
  cel_passage: { type: "bookcase" },
  cel_vault: { type: "oven" },
  cel_map: { type: "window", wallY: 2.3 },
  tw_loom: { type: "planter" },
  tw_tapestry: { type: "window", wallY: 2.4 },
  tw_carpet: { type: "parasol" },
  tw_mirror: { type: "fountain" },
  tw_crown: { type: "cauldron" },
};

function zoneOfSpot(spotId: string): ZoneKey {
  return (Object.keys(ZONE_MODULES) as ZoneKey[]).find((z) => moduleIndexOf(z, spotId) >= 0)!;
}

export const SPOT_LAYOUT: Record<string, SpotLayout> = Object.fromEntries(
  Object.entries(SPOT_BASE).map(([id, b]) => [id, { type: b.type, pos: spotAnchor(zoneOfSpot(id), id, b.wallY ?? null) }]),
);

export const ZONE_LOOK: Record<ZoneKey, ZoneLook> = {
  alchemy: {
    wallColor: 0x2e1a47,
    floorColor1: 0x3d2759,
    floorColor2: 0x311e47,
    ambientColor: 0x9370db
  },
  harbor: {
    wallColor: 0x1e3a8a,
    floorColor1: 0xd9a066,
    floorColor2: 0xc48c52,
    ambientColor: 0xfef08a
  },
  garden: {
    wallColor: 0x064e3b,
    floorColor1: 0x166534,
    floorColor2: 0x14532d,
    ambientColor: 0x6ee7b7
  },
  banquet: {
    wallColor: 0x3b0764,
    floorColor1: 0x4c1d95,
    floorColor2: 0x3b0764,
    ambientColor: 0xfde047
  },
  cellar: {
    wallColor: 0x3f1d14,
    floorColor1: 0x57534e,
    floorColor2: 0x44403c,
    ambientColor: 0xfdba74
  },
  tower: {
    wallColor: 0x1e1b4b,
    floorColor1: 0x3730a3,
    floorColor2: 0x312e81,
    ambientColor: 0xa5b4fc
  }
};
