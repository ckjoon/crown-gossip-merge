<script lang="ts">
  import Modal from "./Modal.svelte";
  import { app } from "../context";
  import { act, pointOf, ui } from "../ui.svelte";
  import { retrieveFromBag } from "../../../core/actions/board";
  import { getItemMeta, getGeneratorTierMeta } from "../../../core/rules/chains";
  import { getItemSVG } from "../../art/sprites";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  function take(i: number, e: MouseEvent) {
    const ev = act(retrieveFromBag, { bagIdx: i }, pointOf(e));
    const got = ev.find((x) => x.type === "bagRetrieved");
    if (got && got.type === "bagRetrieved") ui.selectedCell = got.to;
  }
</script>

<Modal title="🎒 인벤토리 보관함 (최대 6칸)" {onclose}>
  <p class="bag-help">보드가 좁을 때 재료나 여분의 생성기 파츠를 보관해 두세요. 슬롯을 탭하면 보드로 꺼냅니다.</p>
  <div class="bag-grid">
    {#each Array(6) as _, i (i)}
      {@const it = $game.bag[i]}
      <div class="bag-slot" role="button" tabindex="0" onclick={(e) => it && take(i, e)} onkeydown={() => {}}>
        {#if it}
          {@const name = it.isGenerator ? getGeneratorTierMeta(it.chain, it.level).name : getItemMeta(it.chain, it.level).name}
          <div class="gh-tile {it.isGenerator ? 'is-generator' : getItemMeta(it.chain, it.level).css}" style="width:68px;height:62px">
            <div class="tile-svg-wrap">{@html getItemSVG(it.chain, it.level || 1, it.isGenerator)}</div>
            <span class="tile-label">{name}</span>
          </div>
        {:else}
          <span style="color:#94a3b8;font-size:11px">빈 슬롯</span>
        {/if}
      </div>
    {/each}
  </div>
</Modal>
