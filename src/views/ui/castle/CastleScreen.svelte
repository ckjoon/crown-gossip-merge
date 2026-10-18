<script lang="ts">
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

  const game = app().store;
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
      if (!shown.map) {
        view.showMap();
        shown = { map: true, zone: "" };
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

  function questCard(spotId: string) {
    if ($game.rooms[spotId]?.done) {
      app().sfx.tap();
      ui.cutscene = { spotId, step: 0, onFinish: null };
    } else openStyle(spotId);
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
    <div class="castle-host" bind:this={host}></div>
    <div class="castle-pins">
      {#if !pick && !ui.inputLocked}
        {#if ui.castleMap}
          {#each ZONE_ORDER as z (z)}
            {#if zp.accessibleKeys.includes(z) && pins[z]}
              {@const done = ROOMS[z].spots.filter((sp) => $game.rooms[sp.id]?.done).length}
              <button class="room-pin castle-zone-pin" class:pin-ready={z === $game.currentThemeKey} class:pin-reveal={ui.revealZone === z} style="left:{clampX(pins[z].x)}px;top:{clampY(pins[z].y)}px" onclick={(e) => { app().sfx.tap(); goZone(z, { x: e.clientX, y: e.clientY }); }}>
                {ROOMS[z].shortName} <b>{done}/{ROOMS[z].spots.length}</b> <span>입장➔</span>
              </button>
            {/if}
          {/each}
        {:else}
          {#each room.spots as sp (sp.id)}
            {@const st = $game.rooms[sp.id]}
            {@const isNext = sp.id === zp.nextSpotId}
            {@const cost = getSpotCoinCost($game.currentThemeKey, sp.cost)}
            {#if pins[sp.id]}
              <button
                class="room-pin"
                class:pin-customize={st?.done}
                class:pin-ready={!st?.done && isNext && $game.coins >= cost}
                class:pin-locked={!st?.done && (!isNext || $game.coins < cost)}
                style="left:{clampX(pins[sp.id].x)}px;top:{clampY(pins[sp.id].y)}px"
                onclick={() => openStyle(sp.id)}
              >
                {#if st?.done}🎨 <span>{sp.name}</span>{:else if isNext}🔨 <span>{sp.name}</span> <b>🪙{cost}</b>{:else}🔒 <span>제{zp.chapterById[sp.id]}화</span>{/if}
              </button>
            {/if}
          {/each}
        {/if}
      {/if}
    </div>

    <div class="room-progress-pill">
      <span>{ui.castleMap ? "🏰 마녀 셀레네의 대마법성 (전체 성곽 지도)" : room.title}</span>
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

    <button class="castle-to-merge-fab" onclick={() => { app().sfx.tap(); ui.screen = "merge"; }} title="합성 페이지로 들어가기">
      {#if anyOrderReady}<span class="fab-order-badge">주문완성!</span>{/if}
      <div class="fab-icon-circle">{room.sectionIcon}</div>
      <div class="fab-text-col">
        <strong>{room.shortName.replace(/^[^\s]+\s/, "")}</strong>
        <span>아이콘 합성하기 ▶</span>
      </div>
    </button>
  </div>

  <div class="castle-quest-panel" class:input-locked={ui.inputLocked}>
    <div class="castle-quest-header">
      <strong>📜 {room.shortName} 이야기 (복구 시 생성기 진화 파츠 지급)</strong>
      <span>마녀의 성 전체 {totalDone}/{ALL_SPOTS_IN_ORDER.length}</span>
    </div>
    <div class="story-action-row">
      <button class="story-next-btn" disabled={!next} onclick={storyNext}>📖 다음 이야기 진행 <b>{next ? `제${next.chapter}화 🪙${nextCost}` : "🎉 완결"}</b></button>
      <button class="story-log-btn" onclick={() => { app().sfx.tap(); ui.modal = "storyLog"; }}>📜 스토리</button>
    </div>
    <div class="castle-quest-strip">
      {#each room.spots as sp (sp.id)}
        {@const st = $game.rooms[sp.id]}
        {@const isNext = sp.id === zp.nextSpotId}
        {@const cost = getSpotCoinCost($game.currentThemeKey, sp.cost)}
        <div class="castle-quest-card" class:quest-done={st?.done} class:quest-ready={!st?.done && isNext && $game.coins >= cost} class:quest-locked={!st?.done && !(isNext && $game.coins >= cost)} role="button" tabindex="0" onclick={() => questCard(sp.id)} onkeydown={() => {}}>
          <div class="cq-name">제{zp.chapterById[sp.id]}화 · {sp.name}</div>
          <div class="cq-btn-tag">{st?.done ? "💬 다시보기" : isNext ? `🔨 🪙${cost}` : "🔒 잠김"}</div>
        </div>
      {/each}
    </div>
    <div class="gh-dialogue-bar">
      <span class="speaker-tag">{ui.dialogue.speaker}:</span>
      <span class="dialogue-text">{ui.dialogue.text}</span>
    </div>
  </div>
</section>
