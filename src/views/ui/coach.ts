// coach.ts — 첫 복구 코치 (v3.7): 제1화를 복구하기 전까지, 지금 상태만 보고 "다음에 할 일" 하나를 고른다
// 저장하지 않는다 — 단계는 매번 상태에서 다시 계산 (세이브 호환·되돌아가도 자연스러움)

import { ENERGY_REGEN_SEC, type GameState } from "../../core/types";
import { ROOMS } from "../../core/rules/rooms";
import { getSpotCoinCost } from "../../core/rules/progression";
import { computeWanted } from "../../core/actions/orders";
import { findMergePair } from "../../core/actions/board";

export type CoachStepId = "serve" | "castle" | "merge" | "spawn" | "stuck";

export interface CoachStep {
  step: CoachStepId;
  text: string;
  cells: number[]; // 보드에서 넛지할 칸
  order?: number; // serve: 완성할 주문 번호
}

export function coachStep(s: GameState): CoachStep | null {
  const first = ROOMS.alchemy.spots[0];
  if (s.rooms[first.id]?.done) return null;

  const wanted = computeWanted(s);
  const ready = wanted.status.findIndex((st) => st.allReady);
  if (ready !== -1) return { step: "serve", text: "✅ 재료가 모였어요! 주문 카드의 완성 버튼을 눌러요", cells: [], order: ready };

  if (s.coins >= getSpotCoinCost(1)) return { step: "castle", text: "🏰 코인이 모였어요! 성으로 가서 제1화를 복구해요", cells: [] };

  // 주문에 쓰일 재료는 합치라고 하지 않는다 (그 쌍밖에 없으면 생성기 먼저, 보드가 막혔을 때만 마지막으로)
  const merge = (cells: [number, number]): CoachStep => ({ step: "merge", text: "👆 같은 그림끼리 끌어다 겹쳐요 — 거미줄도 풀려요", cells });
  const pair = findMergePair(s, wanted.wantedUids);
  if (pair) return merge(pair);

  const hasEmpty = s.board.some((c) => !c);
  if (s.energy > 0 && hasEmpty) {
    const gens = s.board.map((c, i) => (c?.isGenerator && c.state === "active" ? i : -1)).filter((i) => i !== -1);
    const chains = new Set(s.orders.flatMap((o) => o.reqs.map((r) => r.chain as string)));
    const pick = gens.find((i) => chains.has(s.board[i]!.chain)) ?? gens[0];
    if (pick !== undefined) return { step: "spawn", text: "✨ 빛나는 생성기를 탭하면 재료가 나와요", cells: [pick] };
  }

  const any = findMergePair(s);
  if (any) return merge(any);

  const genOnBoard = s.board.some((c) => c?.isGenerator && c.state === "active");
  if (!genOnBoard && hasEmpty && s.bag.some((b) => b.isGenerator)) return { step: "stuck", text: "🎒 생성기가 보관함에 있어요 — 보관함에서 꺼내 보드에 놓아요", cells: [] };
  if (s.energy <= 0) return { step: "stuck", text: `⚡ 번개가 다 떨어졌어요 — ${ENERGY_REGEN_SEC / 60}분마다 1개씩 차요`, cells: [] };
  return { step: "stuck", text: "🎒 보드가 꽉 찼어요 — 재료를 눌러 보관하거나 팔아 자리를 만들어요", cells: [] };
}

// 여러 화면(띠·주문 카드·성 버튼·보드 넛지)이 같은 상태로 묻는 경우가 많아 마지막 결과를 재사용 (상태는 바꿀 때마다 새 객체)
let last: { s: GameState; c: CoachStep | null } | null = null;
export function coachFor(s: GameState): CoachStep | null {
  if (last?.s !== s) last = { s, c: coachStep(s) };
  return last.c;
}
