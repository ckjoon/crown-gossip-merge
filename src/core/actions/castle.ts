// castle.ts — 성 행동: 구역 선택(순차 해금), 장소 복구(제N화 순서·코인 비용을 확정 순간에 검사), 스타일 변경, 구역 완성 보상

import { grant, spend } from "../economy";
import { rejected, type GameEvent } from "../events";
import type { Action } from "../store";
import { getGeneratorChainForTheme } from "../rules/chains";
import { findSpot } from "../rules/rooms";
import { GEM_REWARDS, getSpotCoinCost } from "../rules/progression";
import type { ExtraChain, ZoneKey } from "../types";
import { CHAIN_UNLOCK_ZONE, RESTORE_XP } from "../rules/levels";
import { getZoneProgress } from "./orders";
import { gainXP, grantGeneratorPart } from "./progress";

export const selectZone: Action<{ zoneKey: ZoneKey }> = (s, _ctx, { zoneKey }) => {
  if (!getZoneProgress(s).accessibleKeys.includes(zoneKey)) return [rejected("locked")];
  s.currentThemeKey = zoneKey;
  return [{ type: "zoneSelected", zoneKey }];
};

export const renovate: Action<{ spotId: string; styleIdx: number }> = (s, _ctx, { spotId, styleIdx }) => {
  const found = findSpot(spotId);
  const room = s.rooms[spotId];
  if (!found || !room) return [];

  // 이미 복구한 장소는 스타일만 무료로 변경
  if (room.done) {
    room.styleIdx = styleIdx;
    return [{ type: "spotRestyled", spotId, styleIdx }];
  }

  const before = getZoneProgress(s);
  if (before.nextSpotId !== spotId) return [rejected("notNextChapter")];
  if (before.nextSpotLockedLv !== null) return [rejected("levelLocked")];
  const coinCost = getSpotCoinCost(found.zoneKey, found.spot.cost);
  const ev: GameEvent[] = [];
  if (!spend(s, ev, "coins", coinCost, "renovate")) return [rejected("notEnoughCoins")];

  room.done = true;
  room.styleIdx = styleIdx;
  ev.push({ type: "spotRestored", spotId, zoneKey: found.zoneKey, chapter: found.chapter, coinCost, styleIdx });

  // 이 복구로 구역이 완성되면 💎 보상 (같은 저장에 포함되도록 즉시 지급)
  const after = getZoneProgress(s);
  if (after.completedKeys.includes(found.zoneKey) && !before.completedKeys.includes(found.zoneKey)) {
    grant(s, ev, "gems", GEM_REWARDS.zoneComplete, "zoneComplete");
    const revealKey = after.currentZoneKey !== found.zoneKey ? after.currentZoneKey : null;
    ev.push({ type: "zoneCompleted", zoneKey: found.zoneKey, gems: GEM_REWARDS.zoneComplete, revealKey, nextLockedLv: after.nextSpotLockedLv });
    // 구역 완성 보상 생성기 (공방 → 촛대 제단, 하버 → 요정 물레). 이미 가지고 있으면(예전 레벨 해금) 또 주지 않음. 잃으면 안 되므로 보관함이 꽉 차도 넣는다
    for (const c of Object.keys(CHAIN_UNLOCK_ZONE) as ExtraChain[]) {
      if (CHAIN_UNLOCK_ZONE[c] !== found.zoneKey) continue;
      if ([...s.board, ...s.bag].some((it) => it?.isGenerator && it.chain === c)) continue;
      ev.push({ type: "chainUnlocked", chain: c });
      grantGeneratorPart(s, ev, c, true);
    }
  }
  // 경험치·구역 생성기 파츠는 선물 다음에 (같은 복구의 레벨업 파츠가 선물 생성기를 먼저 줘 선물 장면이 빠지지 않게)
  gainXP(s, ev, RESTORE_XP);
  grantGeneratorPart(s, ev, getGeneratorChainForTheme(found.zoneKey));
  return ev;
};
