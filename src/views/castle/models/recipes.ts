// recipes.ts — 장소별 3D 모델 배치표: 공통 배치(items) + 스타일 3종별 추가 소품(styles), 복구 전 잔해(CLUTTER)
// 좌표는 장소 원점 기준. s = 모델의 가장 긴 변 길이(월드 단위), r = Y축 회전, on = 그 번호 항목의 윗면에 올림
// proc = 모델 팩에 없는 구조물(분수·아치·창 등)은 기존 절차적 빌더(SPOT_BUILDERS 키)로 그린다

import type { ModelName } from "./manifest";

export type TintKey = "primary" | "secondary" | "accent" | "wood";

export interface RecipeItem {
  m?: ModelName;
  proc?: string;
  p?: [number, number, number];
  r?: number;
  s?: number;
  on?: number;
  tint?: TintKey;
  tip?: boolean; // 옆으로 쓰러뜨림 (잔해용)
}

export interface SpotRecipe {
  items: RecipeItem[];
  styles: [RecipeItem[], RecipeItem[], RecipeItem[]];
}

const Q = Math.PI / 4;

export const SPOT_RECIPES: Record<string, SpotRecipe> = {
  // ===== 마녀의 공방 =====
  alc_cauldron: {
    items: [
      { m: "props/Cauldron", s: 2.0, tint: "secondary" },
      { proc: "brew", p: [0, 1.55, 0] },
      { m: "props/Candle_1", p: [1.25, 0, 0.7], s: 0.5 },
      { m: "props/Candle_2", p: [-1.2, 0, 0.9], s: 0.45 },
    ],
    styles: [
      [{ m: "props/Book_Stack_1", p: [-1.1, 0, -0.9], s: 0.7 }, { m: "props/Potion_1", p: [1.1, 0, -0.9], s: 0.45 }],
      [{ m: "props/Barrel", p: [-1.25, 0, -1.0], s: 1.0, tint: "primary" }, { m: "props/SmallBottles_1", p: [1.1, 0, -0.9], s: 0.6 }],
      [{ m: "props/Chest_Wood", p: [1.2, 0, -1.0], s: 1.0, r: -0.4, tint: "primary" }, { m: "props/Coin_Pile", p: [-1.1, 0, -0.9], s: 0.6 }],
    ],
  },
  alc_bookcase: {
    items: [
      { m: "props/Bookcase_2", s: 3.0, r: Q, tint: "wood" },
      { m: "props/BookStand", p: [1.5, 0, 0.9], s: 1.3, r: Q },
      { m: "props/Book_Stack_2", p: [0.6, 0, 1.6], s: 0.55 },
    ],
    styles: [
      [{ m: "props/CandleStick_Stand", p: [-0.5, 0, 1.6], s: 1.5 }],
      [{ m: "props/Vase_4", p: [-0.5, 0, 1.6], s: 0.7, tint: "secondary" }, { m: "nature/Fern_1", p: [-0.5, 0, 1.6], s: 0.8 }],
      [{ m: "props/Chest_Wood", p: [-0.3, 0, 1.6], s: 0.9, r: Q, tint: "primary" }, { m: "props/Scroll_1", p: [1.6, 0, -0.2], s: 0.5 }],
    ],
  },
  alc_herbtable: {
    items: [
      { m: "props/Workbench", s: 2.6, tint: "wood" },
      { m: "nature/Plant_1", on: 0, p: [-0.7, 0, 0], s: 0.7 },
      { m: "props/Pot_1", on: 0, p: [0.1, 0, 0.1], s: 0.45 },
      { m: "nature/Flower_3_Group", on: 0, p: [0.75, 0, 0], s: 0.6 },
      { m: "props/Bucket_Wooden_1", p: [1.6, 0, 0.6], s: 0.6 },
    ],
    styles: [
      [{ m: "nature/Bush_Common_Flowers", p: [-1.7, 0, 0.6], s: 1.0 }],
      [{ m: "props/Vase_2", p: [-1.6, 0, 0.6], s: 0.8, tint: "secondary" }, { m: "nature/Plant_7", p: [-1.6, 0.55, 0.6], s: 0.8 }],
      [{ m: "nature/Mushroom_Common", p: [-1.6, 0, 0.7], s: 0.7 }, { m: "nature/Fern_1", p: [-1.2, 0, 1.1], s: 0.6 }],
    ],
  },
  alc_window: {
    items: [
      { proc: "alc_window" },
      { m: "props/Shelf_Small_Bottles", p: [0, -1.25, 0.25], s: 1.6 },
    ],
    styles: [
      [{ m: "props/Banner_1", p: [-1.9, -2.4, 0.2], s: 2.2, tint: "primary" }, { m: "props/Banner_1", p: [1.9, -2.4, 0.2], s: 2.2, tint: "primary" }],
      [{ m: "props/Lantern_Wall", p: [-1.8, -0.2, 0.25], s: 0.7 }, { m: "props/Lantern_Wall", p: [1.8, -0.2, 0.25], s: 0.7 }],
      [{ m: "props/Banner_2", p: [-1.9, -2.4, 0.2], s: 2.2, tint: "secondary" }, { m: "props/Banner_2", p: [1.9, -2.4, 0.2], s: 2.2, tint: "secondary" }],
    ],
  },
  alc_counter: {
    items: [
      { m: "props/Workbench_Drawers", s: 2.6, r: Math.PI / 2, tint: "primary" },
      { m: "props/Potion_1", on: 0, p: [0, 0, -0.7], s: 0.5 },
      { m: "props/Potion_2", on: 0, p: [0.05, 0, 0], s: 0.5 },
      { m: "props/Potion_4", on: 0, p: [0, 0, 0.7], s: 0.5 },
      { m: "props/Stool", p: [1.3, 0, 0.4], s: 0.8 },
    ],
    styles: [
      [{ m: "props/SmallBottles_1", p: [-0.6, 0, 1.6], s: 0.7 }],
      [{ m: "props/Crate_Wooden", p: [-0.6, 0, 1.6], s: 0.8, tint: "secondary" }, { m: "props/Bottle_1", p: [-0.6, 0.8, 1.6], s: 0.45 }],
      [{ m: "props/Bag", p: [-0.6, 0, 1.6], s: 0.7 }, { m: "props/Coin_Pile", p: [0.9, 0, 1.6], s: 0.5 }],
    ],
  },

  // ===== 하버 오션카페 =====
  hb_espresso: {
    items: [
      { m: "props/Workbench_Drawers", s: 2.1, r: Q, tint: "primary" },
      { m: "food/cup-coffee", on: 0, p: [-0.5, 0, 0.3], s: 0.4 },
      { m: "food/cup-saucer", on: 0, p: [0.1, 0, 0.1], s: 0.4 },
      { m: "food/frappe", on: 0, p: [0.55, 0, -0.3], s: 0.45 },
      { m: "props/Stool", p: [1.4, 0, 1.0], s: 0.8 },
    ],
    styles: [
      [{ m: "food/cupcake", p: [1.5, 0.8, 1.0], s: 0.35 }, { m: "nature/Plant_7", p: [-1.4, 0, 1.3], s: 0.9 }],
      [{ m: "food/donut-sprinkles", p: [1.5, 0.8, 1.0], s: 0.35 }, { m: "props/Barrel", p: [-1.4, 0, 1.3], s: 0.9, tint: "secondary" }],
      [{ m: "food/muffin", p: [1.5, 0.8, 1.0], s: 0.35 }, { m: "props/Vase_2", p: [-1.4, 0, 1.3], s: 0.8, tint: "secondary" }],
    ],
  },
  hb_parasol: {
    items: [
      { proc: "cafeTable" },
      { proc: "umbrella" },
      { m: "props/Chair_1", p: [-1.1, 0, 0.1], s: 1.1, r: Math.PI / 2, tint: "wood" },
      { m: "props/Chair_1", p: [0.1, 0, 1.1], s: 1.1, r: Math.PI, tint: "wood" },
      { m: "food/cake", p: [-0.25, 0.92, -0.1], s: 0.4 },
      { m: "food/cup-tea", p: [0.3, 0.92, 0.25], s: 0.28 },
    ],
    styles: [
      [{ m: "nature/Flower_4_Group", p: [1.4, 0, -1.0], s: 0.7 }],
      [{ m: "food/sundae", p: [0.3, 0.92, -0.3], s: 0.3 }, { m: "nature/Bush_Common", p: [1.4, 0, -1.0], s: 0.9 }],
      [{ m: "food/cocktail", p: [0.3, 0.92, -0.3], s: 0.3 }, { m: "props/Vase_4", p: [1.4, 0, -1.0], s: 0.7, tint: "secondary" }],
    ],
  },
  hb_fountain: {
    items: [
      { proc: "hb_fountain" },
      { m: "nature/Bush_Common_Flowers", p: [-1.8, 0, 0.6], s: 1.0 },
      { m: "nature/Bush_Common_Flowers", p: [1.8, 0, 0.6], s: 1.0 },
    ],
    styles: [
      [{ m: "nature/Flower_4_Group", p: [0, 0, 1.8], s: 0.8 }],
      [{ m: "nature/Rock_Medium_1", p: [0.6, 0, 1.7], s: 0.6 }, { m: "nature/Clover_1", p: [-0.5, 0, 1.7], s: 0.5 }],
      [{ m: "props/Vase_2", p: [0, 0, 1.8], s: 0.8, tint: "secondary" }, { m: "nature/Flower_3_Group", p: [0, 0.6, 1.8], s: 0.6 }],
    ],
  },
  hb_bakery: {
    items: [
      { proc: "brickOven" },
      { m: "props/Stall_Cart_Empty", p: [-0.3, 0, 1.7], s: 2.0, tint: "primary" },
      { m: "food/loaf", on: 1, p: [-0.4, 0, 0], s: 0.45 },
      { m: "food/croissant", on: 1, p: [0.15, 0, 0.1], s: 0.35 },
      { m: "food/loaf-baguette", on: 1, p: [0.55, 0, -0.1], s: 0.55 },
    ],
    styles: [
      [{ m: "food/pie", p: [1.6, 0, 0.6], s: 0.5 }, { m: "props/Barrel", p: [1.6, 0, 0.6], s: 0.9 }],
      [{ m: "food/bread", p: [1.6, 0.9, 0.6], s: 0.45 }, { m: "props/Crate_Wooden", p: [1.6, 0, 0.6], s: 0.85, tint: "secondary" }],
      [{ m: "props/Bag", p: [1.6, 0, 0.6], s: 0.8 }, { m: "food/cookie", p: [1.0, 0, 1.0], s: 0.3 }],
    ],
  },
  hb_arch: {
    items: [
      { proc: "hb_arch" },
      { m: "props/Vase_2", p: [-1.9, -2.2, 0.4], s: 0.9 },
      { m: "nature/Plant_7", p: [-1.9, -1.55, 0.4], s: 0.9 },
      { m: "props/Vase_2", p: [1.9, -2.2, 0.4], s: 0.9 },
      { m: "nature/Plant_7", p: [1.9, -1.55, 0.4], s: 0.9 },
    ],
    styles: [
      [{ m: "props/Lantern_Wall", p: [0, 0.35, 0.3], s: 0.6 }],
      [{ m: "nature/Flower_4_Group", p: [0, -2.2, 0.6], s: 0.8 }],
      [{ m: "props/Banner_2", p: [0, -0.4, 0.15], s: 1.6, tint: "secondary" }],
    ],
  },

  // ===== 보타니컬 온실 =====
  gd_pond: {
    items: [
      { proc: "gd_pond" },
      { m: "nature/Rock_Medium_1", p: [-1.5, 0, 0.6], s: 0.7 },
      { m: "nature/Rock_Medium_2", p: [1.4, 0, -0.8], s: 0.6 },
      { m: "nature/Fern_1", p: [-1.3, 0, -1.2], s: 0.8 },
    ],
    styles: [
      [{ m: "nature/Mushroom_Common", p: [1.5, 0, 0.8], s: 0.6 }],
      [{ m: "nature/Flower_3_Group", p: [1.5, 0, 0.8], s: 0.7 }],
      [{ m: "nature/Clover_1", p: [1.5, 0, 0.8], s: 0.6 }, { m: "nature/Pebble_Round_1", p: [0.9, 0, 1.4], s: 0.35 }],
    ],
  },
  gd_gazebo: {
    items: [
      { proc: "gd_gazebo" },
      { m: "props/Chair_1", p: [-0.9, 0, 0.1], s: 1.0, r: Math.PI / 2, tint: "wood" },
      { m: "props/Chair_1", p: [0.1, 0, 0.9], s: 1.0, r: Math.PI, tint: "wood" },
      { m: "food/cup-tea", p: [-0.15, 0.8, 0.1], s: 0.25 },
    ],
    styles: [
      [{ m: "food/cake-birthday", p: [0.2, 0.8, -0.15], s: 0.4 }],
      [{ m: "food/pudding", p: [0.2, 0.8, -0.15], s: 0.3 }],
      [{ m: "food/grapes", p: [0.2, 0.8, -0.15], s: 0.3 }],
    ],
  },
  gd_planter: {
    items: [
      { m: "nature/CommonTree_1", s: 3.0 },
      { m: "nature/Bush_Common_Flowers", p: [1.1, 0, 0.9], s: 0.9 },
      { m: "nature/Flower_4_Group", p: [-0.9, 0, 1.1], s: 0.7 },
    ],
    styles: [
      [{ m: "nature/Flower_3_Group", p: [0.2, 0, 1.5], s: 0.6 }],
      [{ m: "props/Bucket_Wooden_1", p: [0.2, 0, 1.5], s: 0.6, tint: "secondary" }],
      [{ m: "nature/Mushroom_Common", p: [0.2, 0, 1.5], s: 0.6 }],
    ],
  },
  gd_teabar: {
    items: [
      { m: "props/Workbench_Drawers", s: 2.6, tint: "wood" },
      { m: "props/Pot_1", on: 0, p: [-0.7, 0, 0], s: 0.45 },
      { m: "food/cup-tea", on: 0, p: [0, 0, 0.15], s: 0.3 },
      { m: "food/honey", on: 0, p: [0.6, 0, 0], s: 0.35 },
      { m: "props/Shelf_Small_Bottles", p: [0, 1.7, -0.6], s: 1.6 },
    ],
    styles: [
      [{ m: "food/mortar-pestle", p: [1.6, 0, 0.6], s: 0.4 }, { m: "nature/Plant_1", p: [-1.6, 0, 0.6], s: 0.8 }],
      [{ m: "props/Barrel", p: [1.6, 0, 0.6], s: 0.9, tint: "secondary" }, { m: "nature/Fern_1", p: [-1.6, 0, 0.6], s: 0.8 }],
      [{ m: "props/Vase_4", p: [1.6, 0, 0.6], s: 0.7, tint: "secondary" }, { m: "nature/Bush_Common", p: [-1.6, 0, 0.6], s: 0.9 }],
    ],
  },
  gd_dome: {
    items: [
      { proc: "gd_dome" },
      { m: "nature/Plant_1", p: [-1.8, -2.3, 0.4], s: 1.0 },
      { m: "nature/Plant_1", p: [1.8, -2.3, 0.4], s: 1.0 },
    ],
    styles: [
      [{ m: "nature/Flower_4_Group", p: [0, -2.3, 0.6], s: 0.8 }],
      [{ m: "props/Lantern_Wall", p: [0, 1.0, 0.3], s: 0.6 }],
      [{ m: "nature/Fern_1", p: [0, -2.3, 0.6], s: 0.9 }],
    ],
  },

  // ===== 황실 대연회장 =====
  bq_astrolabe: {
    items: [
      { proc: "bq_astrolabe" },
      { m: "props/Chest_Wood", p: [-1.3, 0, 0.9], s: 0.9, r: 0.5, tint: "primary" },
      { m: "props/Coin_Pile", p: [-0.6, 0, 1.4], s: 0.5 },
    ],
    styles: [
      [{ m: "props/Scroll_2", p: [1.3, 0, 0.9], s: 0.6 }],
      [{ m: "props/CandleStick_Triple", p: [1.3, 0, 0.9], s: 0.9 }],
      [{ m: "props/Book_Stack_1", p: [1.3, 0, 0.9], s: 0.6 }],
    ],
  },
  bq_library: {
    items: [
      { m: "props/Bookcase_2", p: [-0.8, 0, 0.8], s: 3.0, r: Q, tint: "wood" },
      { m: "props/Bookcase_2", p: [0.8, 0, -0.8], s: 3.0, r: Q, tint: "wood" },
      { m: "props/BookStand", p: [1.4, 0, 1.4], s: 1.3, r: Q },
    ],
    styles: [
      [{ m: "props/CandleStick_Stand", p: [0.1, 0, 1.9], s: 1.5 }],
      [{ m: "props/Book_Stack_2", p: [0.1, 0, 1.9], s: 0.6 }, { m: "props/Scroll_1", p: [0.6, 0, 2.1], s: 0.45 }],
      [{ m: "props/Chest_Wood", p: [0.1, 0, 1.9], s: 0.9, r: Q, tint: "primary" }],
    ],
  },
  bq_feast: {
    items: [
      { m: "props/Table_Large", s: 2.8, tint: "wood" },
      { m: "props/Chair_1", p: [0, 0, -1.25], s: 1.1, tint: "primary" },
      { m: "props/Chair_1", p: [0, 0, 1.25], s: 1.1, r: Math.PI, tint: "primary" },
      { m: "food/turkey", on: 0, p: [-0.45, 0, 0], s: 0.6 },
      { m: "props/CandleStick_Triple", on: 0, p: [0.35, 0, 0], s: 0.7 },
      { m: "food/wine-red", on: 0, p: [0.9, 0, 0.2], s: 0.4 },
    ],
    styles: [
      [{ m: "food/pie", p: [-1.0, 0.85, -0.2], s: 0.4 }, { m: "food/glass-wine", p: [0.95, 0.85, -0.25], s: 0.25 }],
      [{ m: "food/whole-ham", p: [-1.0, 0.85, -0.2], s: 0.45 }, { m: "food/grapes", p: [0.95, 0.85, -0.25], s: 0.3 }],
      [{ m: "food/cake-birthday", p: [-1.0, 0.85, -0.2], s: 0.45 }, { m: "props/Chalice", p: [0.95, 0.85, -0.25], s: 0.3 }],
    ],
  },
  bq_hearth: {
    items: [
      { proc: "fireplace" },
      { m: "props/Barrel", p: [-1.5, 0, 0.8], s: 0.9 },
      { m: "props/Pot_1", p: [1.4, 0, 0.8], s: 0.6 },
    ],
    styles: [
      [{ m: "props/Chalice", p: [0.9, 0, 1.2], s: 0.35 }],
      [{ m: "food/pumpkin", p: [0.9, 0, 1.2], s: 0.5 }],
      [{ m: "props/CandleStick", p: [0.9, 0, 1.2], s: 0.6 }],
    ],
  },
  bq_portal: {
    items: [
      { proc: "bq_portal" },
      { m: "props/Banner_2", p: [-1.9, -2.4, 0.2], s: 2.2, tint: "primary" },
      { m: "props/Banner_2", p: [1.9, -2.4, 0.2], s: 2.2, tint: "primary" },
    ],
    styles: [
      [{ m: "props/CandleStick_Stand", p: [-1.2, -2.4, 0.6], s: 1.5 }],
      [{ m: "props/Lantern_Wall", p: [0, 1.45, 0.25], s: 0.55 }],
      [{ m: "props/Vase_4", p: [1.2, -2.4, 0.6], s: 0.8, tint: "secondary" }],
    ],
  },
};

// 복구 전 잔해 3종 (장소마다 돌아가며) — 먼지 쌓인 깨진 항아리·쓰러진 상자·밧줄·흩어진 책
export const CLUTTER: RecipeItem[][] = [
  [
    { m: "props/Vase_Rubble_Medium", p: [0, 0, 0], s: 0.9 },
    { m: "props/Crate_Wooden", p: [0.8, 0, -0.5], s: 0.8, r: 0.5 },
    { m: "props/Rope_1", p: [-0.7, 0, 0.6], s: 0.6 },
    { proc: "cobweb", p: [0, 0, 0] },
  ],
  [
    { m: "props/Barrel", p: [0, 0, 0], s: 0.9, tip: true },
    { m: "props/Book_Stack_1", p: [0.8, 0, 0.6], s: 0.5, r: 1.1 },
    { m: "props/Vase_Rubble_Medium", p: [-0.8, 0, -0.4], s: 0.7 },
    { proc: "cobweb", p: [0, 0, 0] },
  ],
  [
    { m: "props/Crate_Wooden", p: [0, 0, 0], s: 0.9, r: -0.3 },
    { m: "props/Crate_Wooden", p: [0.1, 0.0, 0.85], s: 0.7, tip: true },
    { m: "props/Bucket_Wooden_1", p: [-0.8, 0, -0.3], s: 0.5, tip: true },
    { proc: "cobweb", p: [0, 0, 0] },
  ],
];

export function recipeModels(r: { items: RecipeItem[]; styles?: RecipeItem[][] }): ModelName[] {
  const all = [...r.items, ...(r.styles ?? []).flat()];
  return [...new Set(all.map((i) => i.m).filter((m): m is ModelName => !!m))];
}

// 구역 분위기 소품: 복구한 장소 수(step)가 늘수록 하나씩 늘어나 방이 점점 꽉 찬다
// 좌표는 step번 방 조각(그 단계에 지어진 조각) 가운데 기준. 장소 가구는 조각 가운데(0, -0.3)에 있으므로 모서리 쪽에 둔다
export interface ZoneProp extends RecipeItem {
  step: number;
}

const HALF = Math.PI / 2;

export const ZONE_PROPS: Record<string, ZoneProp[]> = {
  alchemy: [
    { step: 1, m: "props/CandleStick_Stand", p: [-1.8, 0, 1.6], s: 1.5 },
    { step: 2, proc: "rug", p: [0.3, 0, 1.3] },
    { step: 2, m: "props/Barrel", p: [-1.9, 0, -1.7], s: 1.0 },
    { step: 3, m: "props/Crate_Wooden", p: [1.8, 0, 1.7], s: 0.85, r: 0.3 },
    { step: 3, m: "props/SmallBottles_1", p: [-1.8, 0, 1.6], s: 0.6 },
    { step: 4, m: "props/Chandelier", p: [0, 3.8, 0.4], s: 1.8 },
    { step: 4, m: "props/Banner_1", p: [-2.0, 0, 0.8], s: 2.4, r: HALF },
    { step: 5, m: "props/Vase_4", p: [-3.4, 0, 1.6], s: 0.8 },
    { step: 5, m: "nature/Fern_1", p: [-3.4, 0.75, 1.6], s: 0.8 },
    { step: 5, m: "props/Book_Stack_2", p: [3.4, 0, 1.6], s: 0.6, r: 0.6 },
  ],
  harbor: [
    { step: 1, m: "nature/Bush_Common_Flowers", p: [-1.8, 0, 1.6], s: 1.1 },
    { step: 2, proc: "rug", p: [-2.6, 0, 0.6] },
    { step: 2, m: "props/Barrel_Apples", p: [3.4, 0, 1.6], s: 1.0 },
    { step: 3, m: "props/Crate_Wooden", p: [1.8, 0, 1.7], s: 0.8, r: -0.3 },
    { step: 3, m: "nature/Plant_7", p: [-1.8, 0, 1.7], s: 1.0 },
    { step: 4, m: "nature/Flower_4_Group", p: [1.8, 0, 1.7], s: 0.8 },
    { step: 4, m: "props/Barrel", p: [-1.8, 0, 1.6], s: 0.9 },
    { step: 5, m: "props/Bench", p: [0, 0, 1.6], s: 1.6 },
    { step: 5, m: "nature/Flower_4_Group", p: [1.9, 0, 1.8], s: 0.8 },
  ],
  garden: [
    { step: 1, m: "nature/Fern_1", p: [1.6, 0, 3.4], s: 1.0 },
    { step: 2, m: "nature/Bush_Common", p: [1.8, 0, -1.8], s: 1.2 },
    { step: 2, m: "nature/Flower_3_Group", p: [-1.8, 0, 1.7], s: 0.8 },
    { step: 3, m: "nature/TwistedTree_1", p: [-1.8, 0, -1.6], s: 2.4 },
    { step: 3, m: "nature/Rock_Medium_2", p: [1.8, 0, 1.7], s: 0.7 },
    { step: 4, m: "nature/Bush_Common_Flowers", p: [-1.8, 0, 1.7], s: 1.0 },
    { step: 4, m: "nature/Mushroom_Common", p: [1.8, 0, 1.8], s: 0.6 },
    { step: 5, m: "nature/Flower_4_Group", p: [1.6, 0, 1.6], s: 0.8 },
    { step: 5, m: "nature/Plant_1", p: [-1.7, 0, 1.4], s: 1.0 },
  ],
  banquet: [
    { step: 1, m: "props/CandleStick_Stand", p: [-1.8, 0, 1.6], s: 1.6 },
    { step: 2, proc: "rug", p: [0.4, 0, 1.3] },
    { step: 2, m: "props/Banner_1", p: [-2.0, 0, 0.6], s: 2.6, r: HALF },
    { step: 3, m: "props/Chandelier", p: [0, 3.8, 0], s: 1.9 },
    { step: 3, m: "props/CandleStick_Stand", p: [3.6, 0, 1.6], s: 1.6 },
    { step: 4, m: "props/Chest_Wood", p: [-1.8, 0, 1.6], s: 1.0, r: HALF },
    { step: 4, m: "props/Coin_Pile", p: [1.8, 0, 1.8], s: 0.6 },
    { step: 5, m: "props/Banner_2", p: [-2.0, 0, 0.8], s: 2.6, r: HALF },
    { step: 5, m: "props/Vase_4", p: [1.8, 0, 1.7], s: 0.8 },
  ],
};
