<script lang="ts">
  // 열린 모달 하나와 컷신·레벨업 배너를 그린다. 첫 실행 시 세이브 정리 안내 → 패치노트 순서로 띄운다
  import { app } from "./context";
  import { ui } from "./ui.svelte";
  import { APP_VERSION } from "../../core/rules/versionHistory";
  import { markVersionSeen } from "../../core/actions/progress";
  import Codex from "./modals/Codex.svelte";
  import Bag from "./modals/Bag.svelte";
  import Level from "./modals/Level.svelte";
  import Settings from "./modals/Settings.svelte";
  import Changelog from "./modals/Changelog.svelte";
  import GemShop from "./modals/GemShop.svelte";
  import StoryLog from "./modals/StoryLog.svelte";
  import Holiday from "./modals/Holiday.svelte";
  import MigrationReport from "./modals/MigrationReport.svelte";
  import Cutscene from "./modals/Cutscene.svelte";
  import LevelUpBanner from "./modals/LevelUpBanner.svelte";

  const report = app().migrationReport;
  let showReport = $state(!!report);
  // 새 버전 첫 실행이면 (세이브 정리 안내를 닫은 뒤) 패치노트를 한 번만 띄운다
  let changelogPending = app().store.get().lastSeenVersion !== APP_VERSION;

  $effect(() => {
    if (!showReport && changelogPending && ui.modal === null) {
      changelogPending = false;
      app().store.dispatch(markVersionSeen, { version: APP_VERSION });
      setTimeout(() => (ui.modal = "changelog"), 350);
    }
  });

  const close = () => {
    app().sfx.tap();
    ui.modal = null;
  };
</script>

{#if showReport && report}
  <MigrationReport {report} onclose={() => (showReport = false)} />
{:else if ui.modal === "codex"}
  <Codex onclose={close} />
{:else if ui.modal === "bag"}
  <Bag onclose={close} />
{:else if ui.modal === "level"}
  <Level onclose={close} />
{:else if ui.modal === "settings"}
  <Settings onclose={close} />
{:else if ui.modal === "changelog"}
  <Changelog onclose={close} />
{:else if ui.modal === "gemShop"}
  <GemShop onclose={close} />
{:else if ui.modal === "storyLog"}
  <StoryLog onclose={close} />
{:else if ui.modal === "holiday"}
  <Holiday onclose={close} />
{/if}

{#if ui.cutscene}
  <Cutscene />
{/if}

<LevelUpBanner />
