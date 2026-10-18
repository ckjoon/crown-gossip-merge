<script lang="ts">
  import { app } from "../context";
  import { ui } from "../ui.svelte";
  import { getHolidayConfig, getHolidayRemainingText } from "../../../core/rules/holidays";
  import { APP_VERSION } from "../../../core/rules/versionHistory";
  import OrdersStrip from "./OrdersStrip.svelte";
  import DialogueBar from "./DialogueBar.svelte";
  import SideTools from "./SideTools.svelte";
  import Inspector from "./Inspector.svelte";
  import BoardCanvas from "../../board/BoardCanvas.svelte";

  const game = app().store;
  const holiday = $derived(getHolidayConfig($game.holiday.activeHolidayId));
  const remain = $derived(getHolidayRemainingText(holiday, new Date(ui.clock)));
</script>

<section class="screen-view" class:hidden={ui.screen !== "merge"} id="view-merge">
  <div class="merge-subbar">
    <button class="holiday-mini-banner" onclick={() => { app().sfx.tap(); ui.modal = "holiday"; }}>
      <span class="ev-pulse-dot"></span>
      <span>{holiday.icon} {holiday.name} 진행중!</span>
      <b>{remain.split("·")[1]?.trim() ?? "D-5"}</b>
      <span class="ev-enter-tag">재료 합성 ➔</span>
    </button>
    <button class="version-pill-btn" onclick={() => { app().sfx.tap(); ui.modal = "changelog"; }} title="버전 히스토리 및 업데이트 내역 보기">🆕 <span>{APP_VERSION}</span></button>
  </div>

  <div class="orders-and-story">
    <OrdersStrip />
    <DialogueBar />
  </div>

  <main class="gh-board-container" id="board-section">
    <BoardCanvas mode="main" />
  </main>

  <footer class="gh-bottom-panel">
    <SideTools />
    <Inspector />
  </footer>
</section>
