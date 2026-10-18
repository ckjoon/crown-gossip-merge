// registry.ts — 본게임 보드 인스턴스를 연출 계층(juice)이 찾을 수 있게 등록

import type { BoardView } from "./BoardView";

let mainBoard: BoardView | null = null;

export function setMainBoard(bv: BoardView | null): void {
  mainBoard = bv;
}

export function getMainBoard(): BoardView | null {
  return mainBoard;
}
