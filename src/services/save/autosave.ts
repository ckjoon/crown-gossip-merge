// autosave.ts — 상태가 바뀌면 묶어서 저장(기본 300ms), 보석·장소 복구·구역 완성·구매는 즉시 저장

import type { Store } from "../../core/store";
import type { SaveRepository } from "./repository";

export interface Autosave {
  flush(): Promise<void>;
  dispose(): void;
}

export function createAutosave(store: Store, repo: SaveRepository, opts: { debounceMs: number; now: () => number }): Autosave {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let first = true;

  const flush = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    await repo.save(store.get(), opts.now());
  };

  const unsubState = store.subscribe(() => {
    if (first) {
      first = false;
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void repo.save(store.get(), opts.now());
    }, opts.debounceMs);
  });

  const unsubEvents = store.onEvent((e) => {
    const important =
      (e.type === "currencyChanged" && e.currency === "gems") || e.type === "spotRestored" || e.type === "zoneCompleted" || e.type === "itemBought";
    if (important) void flush();
  });

  return {
    flush,
    dispose() {
      unsubState();
      unsubEvents();
      if (timer) clearTimeout(timer);
    },
  };
}
