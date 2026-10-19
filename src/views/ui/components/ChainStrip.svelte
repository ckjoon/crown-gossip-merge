<script lang="ts">
  // 생성기 체인 지도 한 줄: 생성기(보유 등급) → 재료 Lv.1~8. 바로 나오는 단계·배속으로 나오는 단계·합성으로만 얻는 단계를 색으로 구분
  import { CHAINS, getGeneratorTierMeta } from "../../../core/rules/chains";
  import { spawnRange } from "../../../core/rules/progression";
  import { getItemSVG } from "../../art/sprites";
  import type { GenChain } from "../../../core/types";

  // locked: 아직 못 받은 새 체인이면 받는 조건 (예: "🔮 마녀의 공방 완성")
  let { chain, tier, locked = null, focus = false }: { chain: GenChain; tier: number | null; locked?: string | null; focus?: boolean } = $props();
  const ch = $derived(CHAINS[chain]);
  const shownTier = $derived(tier ?? 1);
  const range = $derived(spawnRange(shownTier));
  const kind = (lv: number) => (lv >= range.min && lv <= range.max ? "spawn" : lv > range.max && lv <= range.boostMax ? "boost" : lv < range.min ? "below" : "merge");
</script>

<div class="chain-strip" class:locked={locked !== null} class:focus>
  <div class="cs-gen">
    <div class="cs-gen-icon">{@html getItemSVG(chain, shownTier, true)}</div>
    <div class="cs-gen-stars">{locked !== null ? `🔒 ${locked}` : tier ? "★".repeat(tier) + "☆".repeat(3 - tier) : "없음"}</div>
  </div>
  <div class="cs-body">
    <div class="cs-name">{getGeneratorTierMeta(chain, shownTier).name}<span>{ch.name.replace(" 체인", "")}</span></div>
    <div class="cs-items">
      {#each ch.items as it (it.level)}
        <div class="cs-item cs-{kind(it.level)}" title={`Lv.${it.level} ${it.name}`}>
          <div class="cs-svg">{@html getItemSVG(chain, it.level, false)}</div>
          <b>{it.level}</b>
        </div>
      {/each}
    </div>
  </div>
</div>
