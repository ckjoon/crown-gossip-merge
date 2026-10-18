// ui.svelte.ts — 저장하지 않는 화면 상태(현재 화면·선택 칸·열린 모달·대화 바·입력 잠금)와 떠오르는 알림, 행동 실행 도우미

import type { Action } from "../../core/store";
import type { GameEvent, RejectReason } from "../../core/events";
import { app } from "./context";

export type Screen = "merge" | "castle";
export type ModalId = "codex" | "bag" | "level" | "settings" | "changelog" | "gemShop" | "storyLog" | "holiday" | "migration";

export type RewardView =
  | { kind: "ribbon"; chapter: number; name: string; chips: string[] }
  | { kind: "reaction"; characterId: string; line: string }
  | { kind: "zone"; title: string; gems: number };

export interface CutsceneView {
  spotId: string;
  step: number;
  onFinish: (() => void) | null;
}

export const ui = $state({
  screen: "merge" as Screen,
  selectedCell: 2 * 7 + 2 as number | null,
  selectedEventCell: 6 as number | null,
  selectedOrderIdx: null as number | null,
  modal: null as ModalId | null,
  dialogue: { speaker: "🧙‍♀️ 셀레네", text: "\"주문 카드를 누르면 어떤 생성기나 재료가 필요한지 알려드려요!\"" },
  inputLocked: false,
  cutscene: null as CutsceneView | null,
  clock: Date.now(),
  castleMap: false,
  stylePick: null as { spotId: string; styleIdx: number } | null,
  revealZone: null as string | null,
  reward: null as RewardView | null,
});

export interface Toast {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export const toasts = $state<Toast[]>([]);
let toastSeq = 0;

// 떠오르는 짧은 알림 (v2 floatText와 같은 위치 규칙: 화면 안쪽으로 보정, 연속 알림은 위로 비켜 쌓임)
export function toast(text: string, x?: number, y?: number, color = "#fbbf24"): void {
  const slot = (toasts.length % 4) * 34;
  const w = typeof window !== "undefined" ? window.innerWidth : 412;
  const safeX = Math.max(110, Math.min(w - 110, x ?? w / 2));
  const safeY = Math.max(65, (y ?? 220) - 10 - slot);
  const id = ++toastSeq;
  toasts.push({ id, text, x: safeX, y: safeY, color });
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i !== -1) toasts.splice(i, 1);
  }, 1050);
}

export function say(speaker: string, text: string): void {
  ui.dialogue = { speaker, text };
}

const REJECT_TEXT: Record<RejectReason, string> = {
  noEnergy: "⚡ 번개가 부족합니다! 5분마다 충전되거나 💎 상점에서 구매하세요!",
  boardFull: "보드가 가득 찼습니다! 재료를 합치거나 보관함에 넣으세요!",
  bagFull: "보관함이 가득 찼습니다!",
  notEnoughCoins: "🪙 코인이 부족해요!",
  notEnoughGems: "💎 보석이 부족해요",
  locked: "🔒 이전 구역의 이야기를 모두 진행해야 열려요!",
  cannotMerge: "🕸️ 같은 재료를 드래그해야 합쳐집니다!",
  crateLocked: "📦 봉인 상자는 주변 거미줄 타일을 합치면 열립니다!",
  noCobweb: "해제할 거미줄 타일이 없습니다!",
  notNextChapter: "앞 이야기를 먼저 진행해야 복구할 수 있어요.",
  eventBoardFull: "이벤트 보드가 가득 찼습니다! 같은 아이콘을 합치세요!",
  missionNotReady: "아직 목표 레벨 아이템이 없어요!",
  nothingSelected: "전환할 명절 아이템을 먼저 선택하세요!",
};

export function rejectText(reason: RejectReason): string {
  return REJECT_TEXT[reason];
}

// 행동 실행 + 거부 사유를 알림·경고음으로 표시. at은 알림을 띄울 화면 좌표
export function act<P>(action: Action<P>, payload: P, at?: { x: number; y: number }): GameEvent[] {
  const { store, sfx } = app();
  const events = store.dispatch(action, payload);
  for (const e of events) {
    if (e.type === "rejected") {
      sfx.warn();
      toast(REJECT_TEXT[e.reason], at?.x, at?.y, "#ef4444");
    }
  }
  return events;
}

export function pointOf(e: MouseEvent | PointerEvent): { x: number; y: number } {
  return { x: e.clientX, y: e.clientY };
}
