<script lang="ts">
  import { app } from "../context";
  import { ui, act, pointOf } from "../ui.svelte";
  import { unlockCobweb, sortBoard } from "../../../core/actions/board";
  import { toggleBoost } from "../../../core/actions/progress";
  import { getZoneProgress } from "../../../core/actions/orders";
  import { findSpot } from "../../../core/rules/rooms";
  import { getSpotCoinCost } from "../../../core/rules/progression";

  const game = app().store;
  // 다음 화를 바로 진행할 코인이 있으면 성 버튼에 ! 표시
  const canRenovate = $derived.by(() => {
    const next = getZoneProgress($game).nextSpotId;
    const f = next ? findSpot(next) : null;
    return !!f && $game.coins >= getSpotCoinCost(f.zoneKey, f.spot.cost);
  });

  function goCastle() {
    app().sfx.tap();
    ui.screen = "castle";
  }
</script>

<div class="gh-side-tools">
  <button class="gh-castle-btn" onclick={goCastle} title="마녀의 성 꾸미기 화면으로 가기">
    {#if canRenovate}<span class="castle-ready-dot">!</span>{/if}
    <span class="castle-ico">🏰</span>
    <span class="castle-label">성으로 가기</span>
  </button>
  <button class="gh-bag-btn" onclick={() => { app().sfx.tap(); ui.modal = "bag"; }} title="보관함 (아이템 최대 6개 보관)">
    <span class="bag-ico">🎒</span>
    <span class="bag-label">보관함</span>
    <span class="bag-count">{$game.bag.length}/6</span>
  </button>
  <button class="gh-mini-booster" onclick={(e) => act(unlockCobweb, { preferred: ui.selectedCell }, pointOf(e))} title="선택한 거미줄 타일 1개를 즉시 해제합니다 (20코인)">
    <span>🕸️해제</span><small>🪙20</small>
  </button>
  <button class="gh-mini-booster" onclick={(e) => act(sortBoard, undefined, pointOf(e))} title="흩어진 재료들을 체인별로 깔끔하게 정렬합니다">
    <span>🧹정렬</span><small>무료</small>
  </button>
  <button class="gh-mini-booster boost-toggle" class:boost-active={$game.boostMultiplier > 1} onclick={(e) => { app().sfx.tap(); act(toggleBoost, undefined, pointOf(e)); }} title="배속: 번개를 더 써서 한두 단계 높은 재료를 바로 생성합니다 (생성기 등급 상한까지)">
    <span>⚡×{$game.boostMultiplier}</span><small>배속</small>
  </button>
</div>
