<script lang="ts">
  import { tapLine } from "../../castle/actor";
  import { CHARACTERS } from "../../../core/rules/characters";
  // 🏰 마녀의 성 화면: 구역 탭, Three.js 3D 뷰 + 핀, 스타일 선택, 퀘스트 패널(제N화 카드·다음 이야기 진행·스토리)
  import { app } from "../context";
  import { ui, say } from "../ui.svelte";
  import { CastleView } from "../../castle/CastleView";
  import { setCastleView } from "../../castle/registry";
  import { getZoneProgress, computeWanted } from "../../../core/actions/orders";
  import { ROOMS, ALL_SPOTS_IN_ORDER, STYLE_PALETTES, findSpot } from "../../../core/rules/rooms";
  import { getSpotCoinCost, ZONE_ORDER } from "../../../core/rules/progression";
  import type { ZoneKey } from "../../../core/types";
  import { goZone, openStyle, pickStyle, cancelStyle, confirmStyle, storyNext } from "./castleActions";
  import RewardOverlay from "./RewardOverlay.svelte";
  import { coachFor } from "../coach";

  const game = app().store;
  // 첫 복구 코치: 코인이 모였으면 다음 이야기 버튼이 반짝
  const coachCastle = $derived(coachFor($game)?.step === "castle");
  let host = $state<HTMLDivElement>();
  let view = $state<CastleView | null>(null);
  let shown = { map: false, zone: "" };
  let pins = $state<Record<string, { x: number; y: number }>>({});

  const zp = $derived(getZoneProgress($game));
  const room = $derived(ROOMS[$game.currentThemeKey]);
  const doneInRoom = $derived(room.spots.filter((sp) => $game.rooms[sp.id]?.done).length);
  const totalDone = $derived(ALL_SPOTS_IN_ORDER.filter((e) => $game.rooms[e.spot.id]?.done).length);
  const next = $derived(zp.nextSpotId ? findSpot(zp.nextSpotId) : null);
  const nextCost = $derived(next ? getSpotCoinCost(next.zoneKey, next.spot.cost) : 0);
  const anyOrderReady = $derived(computeWanted($game).status.some((s) => s.allReady));

  $effect(() => {
    if (!host) return;
    const v = new CastleView(host);
    v.init();
    const off = v.onFrame(() => updatePins(v));
    view = v;
    setCastleView(v);
    return () => {
      off();
      setCastleView(null);
      v.destroy();
      view = null;
    };
  });

  // 지도/구역 전환 시에만 장면을 다시 만들고, 복구·스타일 변경은 가구만 갱신
  $effect(() => {
    if (!view) return;
    const s = $game;
    if (ui.castleMap) {
      // 지도는 열린 구역·복구 수가 바뀌었을 때만 다시 그린다 (지도를 보던 중 레벨업으로 구역이 열려도 자물쇠가 남지 않게)
      const key = `${zp.accessibleKeys.join()}|${Object.values(s.rooms).filter((r) => r.done).length}`;
      if (!shown.map || shown.zone !== key) {
        view.showMap(s.rooms, zp.accessibleKeys);
        shown = { map: true, zone: key };
      }
    } else if (shown.map || shown.zone !== s.currentThemeKey) {
      view.showZone(s.currentThemeKey, s.rooms);
      shown = { map: false, zone: s.currentThemeKey };
    } else {
      view.syncRooms(s.rooms);
    }
  });

  $effect(() => {
    view?.setActive(ui.screen === "castle");
    if (ui.screen !== "castle") cancelStyle();
  });

  let frame = 0;
  function updatePins(v: CastleView) {
    if (frame++ % 2 !== 0 || ui.screen !== "castle") return;
    const out: Record<string, { x: number; y: number }> = {};
    if (ui.castleMap) for (const z of ZONE_ORDER) out[z] = v.projectZonePin(z);
    else for (const sp of ROOMS[$game.currentThemeKey].spots) out[sp.id] = v.projectSpot(sp.id) ?? { x: -999, y: -999 };
    pins = out;
  }

  const clampX = (x: number) => Math.max(66, Math.min((host?.clientWidth ?? 360) - 66, x));
  const clampY = (y: number) => Math.max(42, Math.min((host?.clientHeight ?? 300) - 68, y));

  function tab(key: "castle_map" | ZoneKey, e: MouseEvent) {
    app().sfx.tap();
    cancelStyle();
    if (key === "castle_map") ui.castleMap = true;
    else goZone(key, { x: e.clientX, y: e.clientY });
  }

  // 손가락으로 끌어 방 둘러보기 (탭은 그대로 핀 버튼이 받는다)
  let panFrom: { id: number; x: number; y: number; moved: boolean } | null = null;
  function panDown(e: PointerEvent) {
    if (ui.castleMap || ui.inputLocked || ui.stylePick) return;
    panFrom = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function panMove(e: PointerEvent) {
    if (!panFrom || e.pointerId !== panFrom.id) return;
    if (e.pointerType === "mouse" && e.buttons === 0) {
      panFrom = null;
      return;
    }
    const dx = e.clientX - panFrom.x;
    const dy = e.clientY - panFrom.y;
    if (!panFrom.moved && Math.hypot(dx, dy) < 6) return;
    panFrom.moved = true;
    view?.panBy(dx, dy);
    panFrom.x = e.clientX;
    panFrom.y = e.clientY;
  }
  function panUp(e: PointerEvent) {
    if (!panFrom || e.pointerId !== panFrom.id) return;
    // 취소된 터치(제스처·알림창)는 탭이 아님
    const tapped = !panFrom.moved && e.type !== "pointercancel";
    panFrom = null;
    // 끌지 않은 탭이면 캐릭터 인사 (손 흔들기 + 말풍선)
    if (!tapped || !view) return;
    const actor = view.pickActor(e.clientX, e.clientY);
    if (!actor) return;
    app().sfx.tap();
    actor.wave();
    say(CHARACTERS[actor.id]?.name ?? "", tapLine(actor.id, $game.rooms));
  }

  const pick = $derived(ui.stylePick);
  const pickSpot = $derived(pick ? findSpot(pick.spotId) : null);
  const pickDone = $derived(pick ? !!$game.rooms[pick.spotId]?.done : false);
  const pickCost = $derived(pickSpot ? getSpotCoinCost(pickSpot.zoneKey, pickSpot.spot.cost) : 0);
</script>

<section class="screen-view" class:hidden={ui.screen !== "castle"} id="view-castle">
  <div class="theme-tabs-bar" class:input-locked={ui.inputLocked}>
    <button class="theme-tab" class:active={ui.castleMap} onclick={(e) => tab("castle_map", e)}>🏰 성 전체지도</button>
    {#each ZONE_ORDER as z (z)}
      {#if zp.accessibleKeys.includes(z)}
        <button class="theme-tab" class:active={!ui.castleMap && $game.currentThemeKey === z} onclick={(e) => tab(z, e)}>{ROOMS[z].shortName}</button>
      {/if}
    {/each}
  </div>

  <div class="interior-viewport">
    <div class="castle-host" bind:this={host} onpointerdown={panDown} onpointermove={panMove} onpointerup={panUp} onpointercancel={panUp} role="presentation"></div>
    <div class="castle-pins">
      {#if !pick && !ui.inputLocked}
        {#if ui.castleMap}
          {#each ZONE_ORDER as z (z)}
            {#if !zp.accessibleKeys.includes(z) && pins[z] && next?.zoneKey === z && zp.nextSpotLockedLv !== null}
              <div class="room-pin castle-zone-pin pin-locked" style="left:{clampX(pins[z].x)}px;top:{clampY(pins[z].y)}px">🔒 {ROOMS[z].shortName} <b>Lv.{zp.nextSpotLockedLv}</b></div>
            {/if}
            {#if zp.accessibleKeys.includes(z) && pins[z]}
              {@const done = ROOMS[z].spots.filter((sp) => $game.rooms[sp.id]?.done).length}
              <button class="room-pin castle-zone-pin" class:pin-ready={z === $game.currentThemeKey} class:pin-reveal={ui.revealZone === z} style="left:{clampX(pins[z].x)}px;top:{clampY(pins[z].y)}px" onclick={(e) => { app().sfx.tap(); goZone(z, { x: e.clientX, y: e.clientY }); }}>
                {ROOMS[z].shortName} <b>{done}/{ROOMS[z].spots.length}</b> <span>입장➔</span>
              </button>
            {/if}
          {/each}
        {:else}
          <!-- v3.3: 이름표 대신 다음에 복구할 곳 하나만 반짝이고, 복구한 곳은 작은 🎨 아이콘(스타일 바꾸기) -->
          {#each room.spots as sp (sp.id)}
            {@const st = $game.rooms[sp.id]}
            {@const isNext = sp.id === zp.nextSpotId}
            {@const cost = getSpotCoinCost($game.currentThemeKey, sp.cost)}
            {#if pins[sp.id] && (st?.done || isNext)}
              <button
                class="room-pin"
                class:pin-icon={st?.done}
                class:pin-next={isNext}
                class:pin-ready={isNext && $game.coins >= cost}
                style="left:{clampX(pins[sp.id].x)}px;top:{clampY(pins[sp.id].y)}px"
                onclick={() => openStyle(sp.id)}
                title={sp.name}
              >
                {#if st?.done}🎨{:else}🔨 <b>🪙{cost}</b>{/if}
              </button>
            {/if}
          {/each}
        {/if}
      {/if}
    </div>

    <div class="room-progress-pill">
      <span>{ui.castleMap ? "🏰 마녀의 성" : room.shortName}</span>
      <span class="room-prog-badge">{ui.castleMap ? `${totalDone} / ${ALL_SPOTS_IN_ORDER.length}` : `${doneInRoom} / ${room.spots.length}`} 복구됨</span>
    </div>

    {#if pick && pickSpot}
      <div class="style-selector-overlay">
        <div class="style-picker-card">
          <div class="style-picker-head">
            <strong>🛋️ {pickSpot.spot.name} 디자인 선택</strong>
            <button class="style-cancel-btn" onclick={() => { app().sfx.tap(); cancelStyle(); }}>✕ 닫기</button>
          </div>
          <div class="style-swatches-row">
            {#each STYLE_PALETTES as p, idx (p.id)}
              <button class="style-swatch-btn" class:active={idx === pick.styleIdx} onclick={() => { app().sfx.tap(); pickStyle(idx); }}>
                <span class="swatch-dot" style="background:#{p.primary.toString(16).padStart(6, '0')}"></span>
                <span>{p.name}</span>
              </button>
            {/each}
          </div>
          <button class="style-confirm-btn" class:is-short={!pickDone && $game.coins < pickCost} onclick={(e) => confirmStyle({ x: e.clientX, y: e.clientY })}>
            {pickDone ? "✨ 이 스타일로 변경 (무료)" : $game.coins >= pickCost ? `🔨 제${pickSpot.chapter}화 진행 (🪙${pickCost} 소모)` : `🪙${pickCost} 필요 (주문을 완료해 코인을 모으세요)`}
          </button>
        </div>
      </div>
    {/if}

    <RewardOverlay />

    <button class="castle-to-merge-fab" class:input-locked={ui.inputLocked} onclick={() => { app().sfx.tap(); ui.screen = "merge"; }} title="합성 페이지로 들어가기">
      {#if anyOrderReady}<span class="fab-order-badge">주문완성!</span>{/if}
      <div class="fab-icon-circle">{room.sectionIcon}</div>
      <div class="fab-text-col">
        <strong>{room.shortName.replace(/^[^\s]+\s/, "")}</strong>
        <span>아이콘 합성하기 ▶</span>
      </div>
    </button>
  </div>

  <div class="castle-quest-panel" class:input-locked={ui.inputLocked}>
    <div class="story-action-row">
      <button class="story-next-btn" class:story-locked={zp.nextSpotLockedLv !== null} class:coach-pulse={coachCastle && ui.screen === "castle"} disabled={!next} onclick={storyNext}>
        {#if next && zp.nextSpotLockedLv !== null}🔒 제{next.chapter}화 · <b>Lv.{zp.nextSpotLockedLv} 필요</b>{:else}📖 {next ? `제${next.chapter}화 · ${next.spot.name}` : "🎉 완결"} {#if next}<b>🪙{nextCost}</b>{/if}{/if}
      </button>
      <button class="story-log-btn" onclick={() => { app().sfx.tap(); ui.modal = "storyLog"; }} title="지난 이야기 다시 보기">📜</button>
    </div>
  </div>
</section>
