<script lang="ts">
  import Modal from "./Modal.svelte";
  import { app } from "../context";
  import { getGeneratorTierMeta } from "../../../core/rules/chains";
  import { levelUpReward, unlockedChains, unlocksAt, xpToNext } from "../../../core/rules/levels";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  const req = $derived(xpToNext($game.playerLv));
  const pct = $derived(Math.min(100, Math.round(($game.xp / req) * 100)));
  // 지난 레벨 1개 + 앞으로 8레벨
  const levels = $derived(Array.from({ length: 9 }, (_, i) => Math.max(2, $game.playerLv - 1) + i));
  // 지난 레벨은 받은 생성기 이름, 앞으로의 레벨은 그때 열려 있는 체인에 따라 달라지므로 "생성기"로만
  function partOf(lv: number): string | null {
    if (!levelUpReward(lv).genPart) return null;
    if (lv > $game.playerLv) return "생성기";
    const pool = unlockedChains($game);
    return getGeneratorTierMeta(pool[(lv / 2 - 1) % pool.length], 1).name;
  }
</script>

<Modal title="👑 연금술사 레벨 & 해금" {onclose}>
  <div class="codex-card" style="background:linear-gradient(135deg,#3b0764,#5b21b6);color:#fff;border-color:#fde047">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <strong style="font-size:15px;color:#fde047">👑 현재 레벨: Lv.{$game.playerLv}</strong>
      <span style="font-size:12px;font-weight:800">{$game.xp} / {req} XP ({pct}%)</span>
    </div>
    <div style="height:10px;background:rgba(0,0,0,0.4);border-radius:99px;overflow:hidden;margin-bottom:6px">
      <div style="height:100%;width:{pct}%;background:linear-gradient(90deg,#38bdf8,#fde047)"></div>
    </div>
    <p style="font-size:11px;color:#e9d5ff;line-height:1.4">높은 단계 재료를 합치고 큰 주문을 끝낼수록 경험치가 많아요. 레벨이 오르면 <b>새 구역·보관함 칸</b>이 열려요. 새 생성기는 <b>구역을 완성</b>하면 받아요.</p>
  </div>
  {#each levels as lv (lv)}
    {@const done = $game.playerLv >= lv}
    {@const r = levelUpReward(lv)}
    {@const unlocks = unlocksAt(lv)}
    {@const part = partOf(lv)}
    <div class="codex-card level-row" class:level-unlock={unlocks.length > 0} style="display:flex;align-items:center;justify-content:space-between;background:{done ? '#f3e8ff' : '#ffffff'};border-color:{unlocks.length ? '#f59e0b' : done ? '#a855f7' : '#cbd5e1'}">
      <div>
        <strong style="font-size:12.5px;color:#3b0764">Lv.{lv}</strong>
        {#if unlocks.length}<div style="font-size:12px;font-weight:900;color:#b45309;margin-top:2px">🔓 {unlocks.join(" · ")}</div>{/if}
        <p style="font-size:11px;color:#475569;margin-top:2px">+{r.coins}🪙 · +{r.energy}⚡ · +💎{r.gems}{#if part} · 🔥{part} 파츠{/if}</p>
      </div>
      <span style="font-size:11px;font-weight:900;padding:4px 8px;border-radius:8px;background:{done ? '#10b981' : '#e2e8f0'};color:{done ? '#fff' : '#64748b'}">{done ? "✔" : `${xpToNext(lv - 1)} XP`}</span>
    </div>
  {/each}
</Modal>
