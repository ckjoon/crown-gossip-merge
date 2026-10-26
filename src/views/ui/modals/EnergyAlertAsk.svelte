<script lang="ts">
  // 번개가 처음 바닥났을 때 한 번만 묻는 창 — 동의하면 알림 권한을 묻고, 아니면 다시 묻지 않음 (설정에서 언제든 바꿈)
  import Modal from "./Modal.svelte";
  import { markEnergyAlertAsked } from "../../../services/push";
  import { turnOnEnergyAlert } from "../energyAlert";
  import { pointOf } from "../ui.svelte";
  import { ENERGY_REGEN_SEC, NATURAL_ENERGY_CAP } from "../../../core/types";
  let { onclose }: { onclose: () => void } = $props();

  async function yes(e: MouseEvent) {
    const at = pointOf(e);
    onclose();
    await turnOnEnergyAlert(at);
  }
  function no() {
    markEnergyAlertAsked();
    onclose();
  }
</script>

<Modal title="🔔 번개 가득 알림" onclose={no}>
  <div class="codex-card ea-card">
    <p>번개는 {ENERGY_REGEN_SEC / 60}분마다 1개씩 차요. 게임을 닫아 두어도 <b>번개 {NATURAL_ENERGY_CAP}개가 다 차면</b> 폰 알림으로 알려 드릴까요?</p>
    <p class="setting-desc">⚙️ 설정에서 언제든 켜고 끌 수 있어요.</p>
    <div class="ea-btns">
      <button class="insp-btn ea-no" onclick={no}>괜찮아요</button>
      <button class="insp-btn spawn-btn" data-testid="energy-alert-yes" onclick={yes}>🔔 알림 받기</button>
    </div>
  </div>
</Modal>

<style>
  .ea-card p {
    margin: 0 0 8px;
    line-height: 1.5;
  }
  .ea-btns {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .ea-no {
    background: #e2e8f0;
    color: #334155;
  }
</style>
