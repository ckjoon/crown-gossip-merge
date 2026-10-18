// castleActions.ts — 성 화면 UI 동작 모음 (스타일 선택 열기·확정, 다음 이야기 진행, 잠긴 장소 안내)

import { app } from "../context";
import { act, say, ui } from "../ui.svelte";
import { getZoneProgress } from "../../../core/actions/orders";
import { renovate, selectZone } from "../../../core/actions/castle";
import { findSpot } from "../../../core/rules/rooms";
import { getCastleView } from "../../castle/registry";
import type { ZoneKey } from "../../../core/types";

export function goZone(zone: ZoneKey, at?: { x: number; y: number }): boolean {
  const ev = act(selectZone, { zoneKey: zone }, at);
  if (ev.some((e) => e.type === "rejected")) return false;
  ui.castleMap = false;
  return true;
}

export function openStyle(spotId: string): void {
  const s = app().store.get();
  const zp = getZoneProgress(s);
  const st = s.rooms[spotId];
  if (!st) return;
  if (!st.done && zp.nextSpotId !== spotId) {
    const f = findSpot(spotId);
    app().sfx.warn();
    say(`🔒 제${f?.chapter}화`, `[${f?.spot.name}]은(는) 앞 이야기를 먼저 진행해야 복구할 수 있어요. [📖 다음 이야기 진행]을 눌러 보세요!`);
    return;
  }
  app().sfx.tap();
  ui.stylePick = { spotId, styleIdx: st.styleIdx };
  getCastleView()?.previewSpot(spotId, st.styleIdx);
}

export function pickStyle(styleIdx: number): void {
  if (!ui.stylePick) return;
  ui.stylePick = { ...ui.stylePick, styleIdx };
  getCastleView()?.previewSpot(ui.stylePick.spotId, styleIdx);
}

export function cancelStyle(): void {
  if (!ui.stylePick) return;
  ui.stylePick = null;
  getCastleView()?.clearPreview();
}

export function confirmStyle(at?: { x: number; y: number }): void {
  const pick = ui.stylePick;
  if (!pick) return;
  const ev = act(renovate, { spotId: pick.spotId, styleIdx: pick.styleIdx }, at);
  if (ev.some((e) => e.type === "rejected")) return;
  ui.stylePick = null;
  getCastleView()?.clearPreview();
}

export function storyNext(): void {
  const s = app().store.get();
  const next = getZoneProgress(s).nextSpotId;
  const f = next ? findSpot(next) : null;
  if (!f) return;
  app().sfx.tap();
  if (ui.screen !== "castle") ui.screen = "castle";
  if (ui.castleMap || s.currentThemeKey !== f.zoneKey) {
    if (!goZone(f.zoneKey)) return;
    setTimeout(() => openStyle(f.spot.id), 250);
    return;
  }
  openStyle(f.spot.id);
}
