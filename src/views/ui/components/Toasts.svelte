<script lang="ts">
  import { toasts } from "../ui.svelte";
</script>

<div class="toast-layer">
  {#each toasts as t (t.id)}
    <div class="fx-float-text" style="left:{t.x}px;top:{t.y}px;color:{t.color}">{t.text}</div>
  {/each}
</div>
