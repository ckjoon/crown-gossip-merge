<script lang="ts">
  import Modal from "./Modal.svelte";
  import { app } from "../context";
  import { act, pointOf } from "../ui.svelte";
  import { buyEnergyPack } from "../../../core/actions/progress";
  import { GEM_SHOP_ENERGY } from "../../../core/rules/progression";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
</script>

<Modal title="💎 보석 상점" subtitle="보유 💎{$game.gems}" headerStyle="background:linear-gradient(90deg,#4c1d95,#7c3aed)" {onclose}>
  <p style="font-size:11.5px;color:#475569;margin-bottom:8px">보석은 명절 이벤트 미션·구역 완성·레벨업으로 얻을 수 있어요. 주문 카드를 누르면 부족한 재료를 보석으로 바로 살 수도 있어요!</p>
  <div style="display:flex;flex-direction:column;gap:8px">
    {#each GEM_SHOP_ENERGY as p, i (i)}
      <button class="insp-btn spawn-btn gem-pack-btn" class:is-short={$game.gems < p.gems} aria-disabled={$game.gems < p.gems} onclick={(e) => act(buyEnergyPack, { pack: i }, pointOf(e))}>
        ⚡ 번개 +{p.energy} <small>💎{p.gems}</small>
      </button>
    {/each}
  </div>
</Modal>
