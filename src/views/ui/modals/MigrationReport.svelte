<script lang="ts">
  import Modal from "./Modal.svelte";
  import { ROOMS } from "../../../core/rules/rooms";
  import type { MigrationReport } from "../../../services/save/migrations";
  let { report, onclose }: { report: MigrationReport; onclose: () => void } = $props();
  const lines = $derived(
    [
      report.energyTrimmed > 0 ? `⚡ 번개 ${100 + report.energyTrimmed} → 100 (💎+${report.gemsFromEnergy})` : "",
      report.comboRemoved > 0 ? `⚗️ 예전 조합품 ${report.comboRemoved}개 → +${report.coinsFromCombo}🪙` : "",
      report.zonesBackfilled.length > 0 ? `🏰 완성한 구역 보상 💎+${report.gemsFromZones} (${report.zonesBackfilled.map((z) => ROOMS[z].shortName).join(", ")})` : "",
      report.coinsFromStars > 0 ? `🌟 마력별 → +${report.coinsFromStars}🪙` : "",
      report.freeSpawnsTrimmed ? "🎃 명절 이벤트 무료 소환 횟수를 12회로 정리했어요" : "",
    ].filter(Boolean)
  );
</script>

<Modal title="🧹 세이브 정리 안내" subtitle="v3.0 업데이트로 예전 진행 데이터를 새 규칙에 맞게 한 번 정리했어요" headerStyle="background:linear-gradient(90deg,#065f46,#0f766e)" closeLabel="확인 ✕" {onclose}>
  <div class="codex-card" style="background:#ecfdf5;border-color:#10b981">
    <h4 style="margin-bottom:6px">진행도는 그대로 이어집니다 ✔</h4>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:#064e3b;font-weight:700">
      {#each lines as l (l)}<div class="migration-line">• {l}</div>{/each}
    </div>
  </div>
</Modal>
