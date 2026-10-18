<script lang="ts">
  import { app } from "../context";
  import { ui } from "../ui.svelte";
  import { getRequiredXP } from "../../../core/rules/chains";
  import { getHolidayConfig } from "../../../core/rules/holidays";
  import { NATURAL_ENERGY_CAP } from "../../../core/types";

  const game = app().store;
  const reqXP = $derived(getRequiredXP($game.playerLv));
  const xpPct = $derived(Math.min(100, Math.round(($game.xp / reqXP) * 100)));
  const holiday = $derived(getHolidayConfig($game.holiday.activeHolidayId));

  // 재화가 바뀌면 숫자 알약이 통통 튄다
  let bump = $state<Record<string, boolean>>({});
  $effect(() =>
    app().store.onEvent((e) => {
      if (e.type !== "currencyChanged") return;
      bump[e.currency] = false;
      requestAnimationFrame(() => (bump[e.currency] = true));
      setTimeout(() => (bump[e.currency] = false), 450);
    })
  );

  function mmss(sec: number): string {
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  }
  const open = (m: typeof ui.modal) => () => {
    app().sfx.tap();
    ui.modal = m;
  };
</script>

<header class="gh-topbar" class:input-locked={ui.inputLocked}>
  <button class="gh-level-widget" onclick={open("level")} title="연금술사 레벨 및 성장 보상 보기">
    <div class="lv-circle">
      <span class="lv-crown">👑</span>
      <span>{$game.playerLv}</span>
    </div>
    <div class="xp-bar-col">
      <span class="xp-label">{$game.xp}/{reqXP} XP</span>
      <div class="xp-track"><div class="xp-fill" style="width:{xpPct}%"></div></div>
    </div>
  </button>

  <div class="gh-resources">
    <div class="gh-res-pill energy" class:res-bump={bump.energy} data-fx-target="energy" title="번개(⚡): 100개까지 5분마다 1개씩 자동 충전됩니다">
      <span class="res-ico">⚡</span>
      <div class="res-val-wrap">
        <span>{$game.energy}</span>
        <small>{$game.energy >= NATURAL_ENERGY_CAP ? "MAX(100)" : mmss($game.energyCountdown)}</small>
      </div>
      <button class="res-plus-btn" onclick={open("gemShop")} title="💎 상점에서 번개 충전">+</button>
    </div>
    <div class="gh-res-pill coins" class:res-bump={bump.coins} data-fx-target="coins">
      <span class="res-ico">🪙</span>
      <span>{$game.coins}</span>
    </div>
    <button class="gh-res-pill gems" class:res-bump={bump.gems} data-fx-target="gems" onclick={open("gemShop")} title="💎 보석: 이벤트·구역 완성·레벨업으로 얻고, 상점에서 번개와 재료를 살 수 있어요">
      <span class="res-ico">💎</span>
      <span>{$game.gems}</span>
    </button>
  </div>

  <div class="gh-top-btns">
    <button class="gh-icon-btn event-top-btn" onclick={open("holiday")} title="명절 한정 이벤트">{holiday.icon}</button>
    <button class="gh-icon-btn" onclick={open("codex")} title="아이템 체인 도감">📖</button>
    <button class="gh-icon-btn" onclick={open("settings")} title="설정">⚙️</button>
  </div>
</header>
