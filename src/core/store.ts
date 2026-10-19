// store.ts — 상태 보관 + 행동 실행(사본에서 실행 후 교체) + 구독(Svelte store 계약) + 도메인 이벤트 발행

import type { Ctx } from "./ctx";
import type { GameEvent } from "./events";
import type { GameState } from "./types";
import { sweepCodex } from "./codex";

export type Action<P> = (draft: GameState, ctx: Ctx, payload: P) => GameEvent[];

// transient: 저장할 필요가 없는 변경 (예: 1초마다 줄어드는 번개 카운트다운)
export interface DispatchOptions {
  transient?: boolean;
}

export interface CommitInfo {
  transient: boolean;
  events: GameEvent[];
}

export interface Store {
  get(): GameState;
  subscribe(fn: (s: GameState) => void): () => void;
  onEvent(fn: (e: GameEvent) => void): () => void;
  onCommit(fn: (info: CommitInfo) => void): () => void;
  dispatch<P>(action: Action<P>, payload: P, opts?: DispatchOptions): GameEvent[];
  replace(next: GameState): void;
}

export function createStore(initial: GameState, ctx: Ctx): Store {
  let state = initial;
  const listeners = new Set<(s: GameState) => void>();
  const eventListeners = new Set<(e: GameEvent) => void>();
  const commitListeners = new Set<(info: CommitInfo) => void>();

  const notify = () => {
    for (const fn of listeners) fn(state);
  };

  return {
    get: () => state,
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    onEvent(fn) {
      eventListeners.add(fn);
      return () => eventListeners.delete(fn);
    },
    onCommit(fn) {
      commitListeners.add(fn);
      return () => commitListeners.delete(fn);
    },
    dispatch(action, payload, opts) {
      // 사본에서 실행하므로 행동이 예외를 던지면 기존 상태가 그대로 남는다
      const draft = structuredClone(state);
      const events = action(draft, ctx, payload);
      // 도감 발견은 행동마다 보드·보관함을 훑어 기록 (어느 행동이 재료를 만들었는지와 상관없이 한 곳에서)
      if (!opts?.transient) sweepCodex(draft);
      state = draft;
      notify();
      const info: CommitInfo = { transient: !!opts?.transient, events };
      for (const fn of commitListeners) fn(info);
      for (const e of events) for (const fn of eventListeners) fn(e);
      return events;
    },
    replace(next) {
      state = next;
      notify();
      for (const fn of commitListeners) fn({ transient: false, events: [] });
    },
  };
}
