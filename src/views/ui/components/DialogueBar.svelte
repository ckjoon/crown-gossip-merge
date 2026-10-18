<script lang="ts">
  import { ui } from "../ui.svelte";
</script>

<div class="gh-dialogue-bar">
  <span class="speaker-tag">{ui.dialogue.speaker}:</span>
  <span class="dialogue-text">{ui.dialogue.text}</span>
</div>
