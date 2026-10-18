// state.ts — 새 게임 초기 상태 (v2.5 초기값·초기 보드 배치와 동일)

import { newUid, type Ctx } from "./ctx";
import { ALL_SPOTS_IN_ORDER } from "./rules/rooms";
import { STARTING_GEMS } from "./rules/progression";
import { COLS, ENERGY_REGEN_SEC, EVENT_CELLS, NATURAL_ENERGY_CAP, ROWS, TOTAL_CELLS, type BoardItem, type GameState } from "./types";

export function createInitialState(_ctx: Ctx): GameState {
  const rooms: GameState["rooms"] = {};
  for (const e of ALL_SPOTS_IN_ORDER) rooms[e.spot.id] = { done: false, styleIdx: 0 };

  const s: GameState = {
    playerLv: 1,
    xp: 0,
    energy: NATURAL_ENERGY_CAP,
    energyCountdown: ENERGY_REGEN_SEC,
    coins: 350,
    gems: STARTING_GEMS,
    board: new Array(TOTAL_CELLS).fill(null),
    bag: [],
    orders: [],
    boostMultiplier: 1,
    holiday: { activeHolidayId: "halloween", board: new Array(EVENT_CELLS).fill(null), targetLv: 3, freeSpawns: 12, completedCount: 0 },
    rooms,
    currentThemeKey: "alchemy",
    settings: { sound: true, reduceMotion: false },
    lastSeenVersion: null,
    cauldronPartGranted: true,
    uidSeq: 0,
  };
  buildInitialBoard(s);
  return s;
}

const START_CHAINS = ["potion", "grimoire", "herb", "bakery", "tea"] as const;

// 바깥 테두리 = 봉인 상자, 안쪽 고리 = 거미줄, 중앙 = 생성기 6개(가마솥 2개) + 시작 재료 4개
export function buildInitialBoard(s: GameState): void {
  s.board = new Array(TOTAL_CELLS).fill(null);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const isOuter = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
      const isInnerRing = r === 1 || r === ROWS - 2 || c === 1 || c === COLS - 2;
      if (isOuter) {
        s.board[idx] = { uid: newUid(s), state: "crate", isGenerator: false, chain: START_CHAINS[(r + c) % 5], level: (r + c) % 2 === 0 ? 2 : 3 };
      } else if (isInnerRing) {
        s.board[idx] = { uid: newUid(s), state: "cobweb", isGenerator: false, chain: START_CHAINS[(r * 2 + c) % 5], level: (r + c) % 3 === 0 ? 2 : 1 };
      }
    }
  }
  const place = (r: number, c: number, props: Omit<BoardItem, "uid">) => {
    s.board[r * COLS + c] = { uid: newUid(s), ...props };
  };
  place(2, 2, { isGenerator: true, chain: "potion", level: 1, state: "active" });
  place(2, 3, { isGenerator: true, chain: "potion", level: 1, state: "active" });
  place(2, 4, { isGenerator: true, chain: "grimoire", level: 1, state: "active" });
  place(3, 3, { isGenerator: true, chain: "herb", level: 1, state: "active" });
  place(5, 2, { isGenerator: true, chain: "bakery", level: 1, state: "active" });
  place(5, 4, { isGenerator: true, chain: "tea", level: 1, state: "active" });
  place(3, 2, { isGenerator: false, chain: "potion", level: 2, state: "active" });
  place(3, 4, { isGenerator: false, chain: "herb", level: 2, state: "active" });
  place(4, 2, { isGenerator: false, chain: "bakery", level: 2, state: "active" });
  place(4, 4, { isGenerator: false, chain: "tea", level: 3, state: "active" });
}
