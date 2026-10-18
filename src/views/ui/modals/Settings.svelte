<script lang="ts">
  import Modal from "./Modal.svelte";
  import { app } from "../context";
  import { act, toast, pointOf, ui } from "../ui.svelte";
  import { setSetting } from "../../../core/actions/progress";
  import { APP_VERSION } from "../../../core/rules/versionHistory";
  import { encodeBackup, decodeBackup } from "../../../services/save/backup";
  import { restoreState } from "../../../services/save/restore";
  import { createCtx } from "../../../core/ctx";
  import { installPrompt } from "../install";
  let { onclose }: { onclose: () => void } = $props();
  const game = app().store;
  let code = $state("");

  $effect(() => {
    void (async () => {
      await app().autosave.flush();
      const rec = await app().repo.load();
      code = rec ? encodeBackup(rec) : "";
    })();
  });

  async function exportSave(e: MouseEvent) {
    await app().autosave.flush();
    const rec = await app().repo.load();
    code = rec ? encodeBackup(rec) : "";
    navigator.clipboard?.writeText(code).catch(() => {});
    app().sfx.serve();
    toast("📤 백업 코드가 복사되었습니다!", e.clientX, e.clientY, "#10b981");
  }

  async function importSave(e: MouseEvent) {
    const rec = decodeBackup(code);
    if (!rec) {
      app().sfx.warn();
      toast("⚠️ 올바른 백업 코드가 아닙니다!", e.clientX, e.clientY, "#ef4444");
      return;
    }
    // v2·v4 백업 모두 복원 경로(마이그레이션 포함)를 거쳐 검증한 뒤 저장
    // v2처럼 복원 시점을 기준으로 삼는다 (백업 이후 경과 시간만큼 번개가 쌓이지 않게)
    const { state } = restoreState({ ...rec, updatedAt: Date.now() }, Date.now(), createCtx());
    app().store.replace(state);
    await app().repo.save(state, Date.now());
    app().sfx.serve();
    toast("📥 백업 데이터 복원 성공! 새로고침합니다...", e.clientX, e.clientY, "#10b981");
    setTimeout(() => location.reload(), 600);
  }

  async function install(e: MouseEvent) {
    const p = installPrompt();
    if (p) {
      await p.prompt();
      toast("📲 공식 웹앱 설치가 시작되었습니다!", e.clientX, e.clientY, "#10b981");
    } else {
      toast("크롬 우측 상단 메뉴(⋮) ➔ [홈 화면에 추가 / 앱 설치]를 눌러주세요!", e.clientX, e.clientY, "#38bdf8");
    }
  }
</script>

<Modal title="⚙️ 환경설정 & 시스템 관리" {onclose}>
  <div class="codex-card setting-row">
    <div>
      <h4>🔊 게임 효과음 (SFX)</h4>
      <p class="setting-desc">합성, 주문 완료, 복구 연출 사운드를 켜거나 끕니다.</p>
    </div>
    <button class="insp-btn spawn-btn" onclick={(e) => act(setSetting, { key: "sound", value: !$game.settings.sound }, pointOf(e))}>{$game.settings.sound ? "🔊 켜짐" : "🔇 꺼짐"}</button>
  </div>
  <div class="codex-card setting-row">
    <div>
      <h4>✨ 연출 줄이기</h4>
      <p class="setting-desc">화면 흔들림을 끄고 파티클과 비행 연출을 줄입니다.</p>
    </div>
    <button class="insp-btn spawn-btn" onclick={(e) => act(setSetting, { key: "reduceMotion", value: !$game.settings.reduceMotion }, pointOf(e))}>{$game.settings.reduceMotion ? "✅ 켜짐" : "⬜ 꺼짐"}</button>
  </div>
  <div class="codex-card setting-row" style="background:#fefce8;border-color:#f59e0b">
    <div>
      <h4 style="color:#92400e">🆕 현재 게임 버전: {APP_VERSION}</h4>
      <p class="setting-desc" style="color:#78350f">버전별 새로 추가된 기능과 개발 히스토리를 확인하세요.</p>
    </div>
    <button class="insp-btn sell-btn" onclick={() => (ui.modal = "changelog")}>📜 패치노트</button>
  </div>
  <div class="codex-card" style="background:#eff6ff;border-color:#3b82f6">
    <h4>🛡️ 안드로이드(Galaxy S25) PWA 설치</h4>
    <p class="setting-desc" style="color:#1e3a8a;margin-bottom:7px">홈 화면에 설치하면 앱처럼 전체 화면으로 실행되고 오프라인에서도 플레이할 수 있어요.</p>
    <button class="insp-btn spawn-btn" style="width:100%;padding:8px" onclick={install}>📲 웹앱 설치하기</button>
  </div>
  <div class="codex-card" style="background:#ecfdf5;border-color:#10b981">
    <h4>💾 저장소 & 백업 코드</h4>
    <p class="setting-desc" style="color:#065f46;margin-bottom:6px">IndexedDB + LocalStorage 이중 저장으로 업데이트되어도 진행도가 보존됩니다. 기기를 바꿀 때 백업 코드를 쓰세요.</p>
    <textarea bind:value={code} rows="2" class="backup-box" placeholder="백업 코드가 여기에 표시됩니다..."></textarea>
    <div style="display:flex;gap:6px;margin-top:6px">
      <button class="insp-btn spawn-btn" style="flex:1;padding:7px" onclick={exportSave}>📤 백업 코드 복사</button>
      <button class="insp-btn sell-btn" style="flex:1;padding:7px" onclick={importSave}>📥 코드로 복원</button>
    </div>
  </div>
</Modal>

<style>
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .setting-row h4 {
    margin-bottom: 2px;
  }
  .setting-desc {
    font-size: 11px;
    color: #64748b;
    line-height: 1.35;
  }
  .setting-row button {
    padding: 8px 12px;
    font-size: 12px;
    white-space: nowrap;
  }
  .backup-box {
    width: 100%;
    font-size: 10px;
    padding: 6px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    user-select: text;
    -webkit-user-select: text;
  }
</style>
