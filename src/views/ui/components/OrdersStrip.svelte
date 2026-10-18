<script lang="ts">
  import { app } from "../context";
  import { computeWanted } from "../../../core/actions/orders";
  import OrderCard from "./OrderCard.svelte";

  const game = app().store;
  const wanted = $derived(computeWanted($game));
</script>

<div class="gh-orders-strip">
  {#each $game.orders as order, idx (order.id)}
    <OrderCard {order} {idx} status={wanted.status[idx]} />
  {/each}
</div>
