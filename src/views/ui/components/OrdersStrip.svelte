<script lang="ts">
  import { app } from "../context";
  import { computeWanted } from "../../../core/actions/orders";
  import OrderCard from "./OrderCard.svelte";
  import { coachStep } from "../coach";

  const game = app().store;
  const wanted = $derived(computeWanted($game));
  const coachOrder = $derived(coachStep($game)?.order ?? -1);
</script>

<div class="gh-orders-strip">
  {#each $game.orders as order, idx (order.id)}
    <OrderCard {order} {idx} status={wanted.status[idx]} coached={coachOrder === idx} />
  {/each}
</div>
