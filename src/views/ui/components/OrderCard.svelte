<script lang="ts">
  import { app } from "../context";
  import { ui, act, say } from "../ui.svelte";
  import { getItemSVG } from "../../art/sprites";
  import { getItemMeta, CHAINS } from "../../../core/rules/chains";
  import { getItemGemPrice } from "../../../core/rules/progression";
  import { serveOrder, buyOrderRequirement, type OrderStatus } from "../../../core/actions/orders";
  import type { Order } from "../../../core/types";
  import Portrait from "./Portrait.svelte";

  let { order, idx, status }: { order: Order; idx: number; status: OrderStatus } = $props();
  const game = app().store;
  const selected = $derived(ui.selectedOrderIdx === idx);

  // 카드를 누르면 필요한 재료의 출처를 대화 바에 안내하고, 해당 생성기를 선택한다
  function explain() {
    app().sfx.tap();
    ui.selectedOrderIdx = selected ? null : idx;
    const lines = order.reqs.map((r) => {
      const meta = getItemMeta(r.chain, r.level);
      const ch = CHAINS[r.chain];
      return `${meta.name}(Lv.${r.level}) ← ${ch.generator ? ch.generator.name : ch.name}`;
    });
    say(`${order.customer.face} ${order.customer.name}`, lines.join(" · "));
    const genIdx = $game.board.findIndex((it) => it && it.isGenerator && it.chain === order.reqs[0].chain);
    if (genIdx !== -1) ui.selectedCell = genIdx;
  }

  function serve(e: MouseEvent) {
    e.stopPropagation();
    act(serveOrder, { orderIdx: idx }, { x: e.clientX, y: e.clientY });
    ui.selectedOrderIdx = null;
  }

  function buy(e: MouseEvent, reqIdx: number) {
    e.stopPropagation();
    act(buyOrderRequirement, { orderIdx: idx, reqIdx }, { x: e.clientX, y: e.clientY });
  }
</script>

<div class="gh-order-card" class:order-complete={status.allReady} data-order-idx={idx} role="button" tabindex="0" onclick={explain} onkeydown={(e) => e.key === "Enter" && explain()}>
  <!-- v3.2: 얼굴 + 요청 그림 + 체크만 (설명은 카드를 누르면 말풍선으로) -->
  <div class="order-items-row">
    <div class="cust-avatar"><Portrait name={order.customer.name} face={order.customer.face} size={34} /></div>
    <div class="order-req-list">
      {#each order.reqs as req, rIdx (rIdx)}
        <div class="order-req-box" class:fulfilled={status.reqFulfilled[rIdx]} title={getItemMeta(req.chain, req.level).name}>
          {#if status.reqFulfilled[rIdx]}<span class="req-check">✔</span>{/if}
          <div class="order-req-svg">{@html getItemSVG(req.chain, req.level, false)}</div>
        </div>
      {/each}
    </div>
  </div>
  {#if status.allReady}<button class="gh-serve-btn" onclick={serve}>완성!</button>{:else}<span class="order-reward-tag">🪙{order.coins}</span>{/if}
  {#if selected && !status.allReady}
    <div class="order-buy-row">
      {#each order.reqs as req, rIdx (rIdx)}
        {#if !status.reqFulfilled[rIdx]}
          <button class="order-buy-btn" aria-disabled={$game.gems < getItemGemPrice(req.level)} class:is-short={$game.gems < getItemGemPrice(req.level)} onclick={(e) => buy(e, rIdx)}>
            Lv.{req.level} 💎{getItemGemPrice(req.level)} 구매
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</div>
