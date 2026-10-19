<script lang="ts">
  // 생성기 체인 지도 한 줄: 생성기(보유 등급) → 재료 Lv.1~8. 바로 나오는 단계·배속으로 나오는 단계·합성으로만 얻는 단계를 색으로 구분
  // v3.9: 아직 못 본 재료 단계와 아직 못 만든 생성기 등급은 실루엣·???로 가린다 (몇 단계까지 있는지만 보임). 탭하면 등급별 설명
  import { CHAINS, getGeneratorTierMeta } from "../../../core/rules/chains";
  import { spawnRange } from "../../../core/rules/progression";
  import { getItemSVG } from "../../art/sprites";
  import type { GenChain } from "../../../core/types";

  // locked: 아직 못 받은 새 체인이면 받는 조건 (예: "공방 완성"), seen: 본 적 있는 가장 높은 재료 단계
  let { chain, tier, seen = 8, locked = null, focus = false }: { chain: GenChain; tier: number | null; seen?: number; locked?: string | null; focus?: boolean } = $props();
  const ch = $derived(CHAINS[chain]);
  const shownTier = $derived(tier ?? 1);
  const range = $derived(spawnRange(shownTier));
  const kind = (lv: number) => (lv >= range.min && lv <= range.max ? "spawn" : lv > range.max && lv <= range.boostMax ? "boost" : lv < range.min ? "below" : "merge");
  let open = $state(false);
  const expanded = $derived(open || focus);
  const tiers = [1, 2, 3];
</script>

<div class="chain-strip" class:locked={locked !== null} class:focus>
  <button class="cs-head" aria-expanded={expanded} onclick={() => (open = !expanded)}>
    <div class="cs-gen">
      <div class="cs-gen-icon">{@html getItemSVG(chain, shownTier, true)}</div>
      <div class="cs-gen-stars">{locked !== null ? `🔒 ${locked}` : tier ? "★".repeat(tier) + "☆".repeat(3 - tier) : "없음"}</div>
    </div>
    <div class="cs-body">
      <div class="cs-name">{locked !== null ? "???" : getGeneratorTierMeta(chain, shownTier).name}<span>{ch.name.replace(" 체인", "")}</span><i>{expanded ? "▴" : "▾"}</i></div>
      <div class="cs-items">
        {#each ch.items as it (it.level)}
          {@const known = it.level <= seen}
          <div class="cs-item cs-{kind(it.level)}" class:cs-unknown={!known} title={known ? `Lv.${it.level} ${it.name}` : `Lv.${it.level} ???`}>
            <div class="cs-svg">{@html getItemSVG(chain, it.level, false)}</div>
            <b>{it.level}</b>
          </div>
        {/each}
      </div>
    </div>
  </button>
  {#if expanded}
    <div class="cs-tiers">
      {#each tiers as t (t)}
        {@const reached = locked === null && tier !== null && t <= tier}
        {@const meta = getGeneratorTierMeta(chain, t)}
        <div class="cs-tier" class:cs-unknown={!reached} class:cs-current={reached && t === tier}>
          <div class="cs-tier-icon">{@html getItemSVG(chain, t, true)}</div>
          <div class="cs-tier-text">
            <strong>{"★".repeat(t)} {reached ? meta.name : "???"}</strong>
            <p>{reached ? meta.desc.replace(/^\[[^\]]*\]\s*/, "") : t === 1 ? "아직 받지 못했어요" : `${"★".repeat(t - 1)} 둘을 합치면 모습이 드러나요`}</p>
          </div>
        </div>
      {/each}
      <div class="cs-tier-note">재료는 같은 단계 둘을 합치면 한 단계 올라가요 — 못 본 단계는 만들면 도감에 나타나요</div>
    </div>
  {/if}
</div>
