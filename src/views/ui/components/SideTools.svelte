<script lang="ts">
  import { bagSize } from "../../../core/rules/levels";
  import { app } from "../context";
  import { ui, act, pointOf } from "../ui.svelte";
  import { getHolidayConfig } from "../../../core/rules/holidays";
  import { toggleBoost } from "../../../core/actions/progress";
  import { getZoneProgress } from "../../../core/actions/orders";
  import { findSpot } from "../../../core/rules/rooms";
  import { getSpotCoinCost } from "../../../core/rules/progression";
  import { coachFor } from "../coach";

  const game = app().store;
  // 다음 화를 바로 진행할 코인이 있으면 성 버튼에 ! 표시
  const canRenovate = $derived.by(() => {
    const next = getZoneProgress($game).nextSpotId;
    const f = next ? findSpot(next) : null;
    return !!f && $game.coins >= getSpotCoinCost(f.zoneKey, f.spot.cost);
  });

  const coachCastle = $derived(coachFor($game)?.step === "castle");

  const holiday = $derived(getHolidayConfig($game.holiday.activeHolidayId));

  function goCastle() {
    app().sfx.tap();
    ui.screen = "castle";
  }
</script>

<div class="gh-side-tools">
  <button class="gh-castle-btn" class:coach-pulse={coachCastle} onclick={goCastle} title="마녀의 성 꾸미기 화면으로 가기">
    {#if canRenovate}<span class="castle-ready-dot">!</span>{/if}
    <span class="castle-ico">🏰</span>
    <span class="castle-label">성</span>
  </button>
  <button class="gh-bag-btn" onclick={() => { app().sfx.tap(); ui.modal = "bag"; }} title="보관함 (레벨이 오르면 칸이 늘어나요)">
    <span class="bag-ico">🎒</span>
    <span class="bag-count">{$game.bag.length}/{bagSize($game.playerLv)}</span>
  </button>
  <button class="gh-mini-booster event-btn" onclick={() => { app().sfx.tap(); ui.modal = "holiday"; }} title="{holiday.name}">
    <span class="ev-ico">{holiday.icon}</span><small>이벤트</small>
  </button>
  <button class="gh-mini-booster boost-toggle" class:boost-active={$game.boostMultiplier > 1} onclick={(e) => { app().sfx.tap(); act(toggleBoost, undefined, pointOf(e)); }} title="배속: 번개를 더 써서 한두 단계 높은 재료를 바로 생성합니다 (생성기 등급 상한까지)">
    <span>⚡×{$game.boostMultiplier}</span><small>배속</small>
  </button>
</div>
