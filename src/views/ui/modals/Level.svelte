<script lang="ts">
  import Modal from "./Modal.svelte";
  import { app } from "../context";
  import { CORE_CHAINS, getGeneratorTierMeta, getRequiredXP } from "../../../core/rules/chains";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  const req = $derived(getRequiredXP($game.playerLv));
  const pct = $derived(Math.min(100, Math.round(($game.xp / req) * 100)));
  const levels = $derived(Array.from({ length: Math.max(8, $game.playerLv + 3) - 1 }, (_, i) => i + 2));
</script>

<Modal title="👑 연금술사 레벨 & 생성기 진화 보상" {onclose}>
  <div class="codex-card" style="background:linear-gradient(135deg,#3b0764,#5b21b6);color:#fff;border-color:#fde047">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <strong style="font-size:15px;color:#fde047">👑 현재 연금술사 레벨: Lv.{$game.playerLv}</strong>
      <span style="font-size:12px;font-weight:800">{$game.xp} / {req} XP ({pct}%)</span>
    </div>
    <div style="height:10px;background:rgba(0,0,0,0.4);border-radius:99px;overflow:hidden;margin-bottom:6px">
      <div style="height:100%;width:{pct}%;background:linear-gradient(90deg,#38bdf8,#fde047)"></div>
    </div>
    <p style="font-size:11px;color:#e9d5ff;line-height:1.4">🔥 <b>생성기 합성 진화</b>: 레벨업하거나 성의 이야기를 진행할 때마다 <b>생성기 진화 파츠(★)</b>를 획득합니다. 같은 생성기 2개를 합치면 <b>★★ ➔ ★★★</b>로 진화합니다!</p>
  </div>
  {#each levels as lv (lv)}
    {@const unlocked = $game.playerLv >= lv}
    {@const gen = getGeneratorTierMeta(CORE_CHAINS[(lv - 2) % CORE_CHAINS.length], 1)}
    <div class="codex-card" style="display:flex;align-items:center;justify-content:space-between;background:{unlocked ? '#f3e8ff' : '#ffffff'};border-color:{unlocked ? '#a855f7' : '#cbd5e1'}">
      <div>
        <strong style="font-size:12.5px;color:#3b0764">👑 레벨 {lv} 달성 혜택</strong>
        <p style="font-size:11px;color:#475569;margin-top:2px">보상: <b>+{40 * lv}🪙 · +10⚡ · +💎3 · 🔥[{gen.name} ★] 진화 파츠</b></p>
      </div>
      <span style="font-size:11px;font-weight:900;padding:4px 8px;border-radius:8px;background:{unlocked ? '#10b981' : '#e2e8f0'};color:{unlocked ? '#fff' : '#64748b'}">{unlocked ? "✔ 달성완료" : `Lv.${lv}`}</span>
    </div>
  {/each}
</Modal>
