<script lang="ts">
  // 공통 모달: 배경 페이드 + 카드 튀어나옴, 닫기 버튼
  import { fade, scale } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import type { Snippet } from "svelte";
  let { title, subtitle = "", headerStyle = "", closeLabel = "✕", onclose, wide = "", children }: { title: string; subtitle?: string; headerStyle?: string; closeLabel?: string; onclose: () => void; wide?: string; children: Snippet } = $props();
</script>

<div class="gh-modal-backdrop" transition:fade={{ duration: 160 }} role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="gh-modal {wide}" transition:scale={{ duration: 260, start: 0.85, easing: backOut }}>
    <div class="gh-modal-header" style={headerStyle}>
      <div>
        <h2>{title}</h2>
        {#if subtitle}<small class="modal-sub">{subtitle}</small>{/if}
      </div>
      <button class="gh-close-btn" onclick={onclose}>{closeLabel}</button>
    </div>
    <div class="gh-modal-body">
      {@render children()}
    </div>
  </div>
</div>

<style>
  .modal-sub {
    color: #ede9fe;
    font-size: 10.5px;
  }
</style>
