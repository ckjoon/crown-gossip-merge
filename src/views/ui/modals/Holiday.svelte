<script lang="ts">
  import Modal from "./Modal.svelte";
  import { app } from "../context";
  import { act, pointOf, ui } from "../ui.svelte";
  import { HOLIDAY_EVENTS, getHolidayConfig, getHolidayRemainingText } from "../../../core/rules/holidays";
  import { getHolidayMissionReward } from "../../../core/rules/progression";
  import { holidaySpawn, holidayClaimMission, holidaySendToMain, selectHoliday } from "../../../core/actions/holiday";
  import { getEventSVG } from "../../art/sprites";
  import BoardCanvas from "../../board/BoardCanvas.svelte";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  const h = $derived(getHolidayConfig($game.holiday.activeHolidayId));
  const target = $derived($game.holiday.targetLv);
  const targetMeta = $derived(h.items[Math.min(target - 1, h.items.length - 1)]);
  const ready = $derived($game.holiday.board.some((it) => it && !it.isGenerator && it.level >= target));
  const gems = $derived(getHolidayMissionReward($game.holiday.completedCount).gems);
</script>

<Modal title="{h.icon} {h.name} (기한 한정 이벤트)" subtitle="기간: {h.periodLabel} · {getHolidayRemainingText(h, new Date(ui.clock))}" headerStyle="" wide="holiday-event-modal" {onclose}>
  <div class="holiday-schedule-bar">
    {#each HOLIDAY_EVENTS as ev (ev.id)}
      <button class="holiday-chip" class:active={ev.id === h.id} onclick={(e) => { app().sfx.tap(); act(selectHoliday, { id: ev.id }, pointOf(e)); }}>{ev.icon} {ev.name}</button>
    {/each}
  </div>
  <div class="event-mission-box">
    <div class="event-mission-info">
      <strong>🎯 명절 미션: [{targetMeta.name} (Lv.{target})] 합성하기</strong>
      <p>같은 이벤트 아이콘을 <b>드래그하여 겹치거나 연속 탭</b>하면 상위 단계로 합성됩니다!</p>
    </div>
    <div class="event-Target-reward">
      <div class="ev-req-slot">{@html getEventSVG(target, false)}</div>
      <button class="ev-claim-btn" aria-disabled={!ready} class:is-short={!ready} onclick={(e) => act(holidayClaimMission, undefined, pointOf(e))}>
        {ready ? "🎁 미션 완료!" : `Lv.${target} 필요`}<br /><small>{gems > 0 ? `+💎${gems} & ` : ""}본게임 재료</small>
      </button>
    </div>
  </div>
  <div class="event-board-wrap holiday-pixi-wrap">
    <BoardCanvas mode="holiday" />
  </div>
  <div class="event-controls-row">
    <button class="ev-spawn-btn" onclick={(e) => act(holidaySpawn, undefined, pointOf(e))}>
      {h.icon} {h.genName} 소환 <span>{$game.holiday.freeSpawns > 0 ? `(무료 ${$game.holiday.freeSpawns}회)` : "(⚡1 소모)"}</span>
    </button>
    <button class="ev-send-main-btn" onclick={(e) => { if (ui.selectedEventCell !== null) act(holidaySendToMain, { cell: ui.selectedEventCell }, pointOf(e)); }}>🎁 선택 아이템을 본게임 재료로 보내기</button>
  </div>
</Modal>
