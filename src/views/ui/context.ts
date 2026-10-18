// context.ts — 앱 전역 서비스 묶음 (main.ts에서 한 번 설정)

import type { Store } from "../../core/store";
import type { SoundEngine } from "../../services/audio";
import type { SaveRepository } from "../../services/save/repository";
import type { Autosave } from "../../services/save/autosave";
import type { MigrationReport } from "../../services/save/migrations";

export interface AppContext {
  store: Store;
  sfx: SoundEngine;
  repo: SaveRepository;
  autosave: Autosave;
  migrationReport: MigrationReport | null;
}

let current: AppContext | null = null;

export function setApp(ctx: AppContext): void {
  current = ctx;
}

export function app(): AppContext {
  if (!current) throw new Error("app context not set");
  return current;
}
