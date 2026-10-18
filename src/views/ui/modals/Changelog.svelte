<script lang="ts">
  import Modal from "./Modal.svelte";
  import { APP_VERSION, VERSION_HISTORY } from "../../../core/rules/versionHistory";
  let { onclose }: { onclose: () => void } = $props();
</script>

<Modal title="🆕 업데이트 노트 ({APP_VERSION})" subtitle="새 버전이 배포될 때마다 추가된 기능이 자동으로 기록됩니다" headerStyle="background:linear-gradient(90deg,#1e3a8a,#5b21b6)" closeLabel="확인 ✕" {onclose}>
  {#each VERSION_HISTORY as v, idx (v.version)}
    <div class="codex-card" style="background:{idx === 0 ? '#fefce8' : '#ffffff'};border-color:{idx === 0 ? '#f59e0b' : '#cbd5e1'}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:6px">
        <strong style="font-size:13px;color:#3b0764">🚀 {v.version} — {v.title}</strong>
        <span style="font-size:9.5px;font-weight:900;padding:2px 7px;border-radius:99px;background:{idx === 0 ? '#ea580c' : '#64748b'};color:#fff;white-space:nowrap">{v.badge} · {v.date}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#1e293b;line-height:1.42">
        {#each v.changes as line, i (i)}<div>• {line}</div>{/each}
      </div>
    </div>
  {/each}
</Modal>
