// repository.ts — IndexedDB + localStorage 이중 저장소 (v2와 같은 DB·키를 그대로 사용해 기존 세이브를 이어받음)

import type { GameState } from "../../core/types";

export const SAVE_SCHEMA_VERSION = 4;
const DB_NAME = "CrownGossipMergeDB";
const DB_VERSION = 2;
const STORE_NAME = "player_progress";
const SAVE_KEY = "main_save_v1";
const LS_BACKUP_KEY = "crown_gossip_save_backup_v1";

export interface SaveRecord {
  id: "main_save_v1";
  schemaVersion: number;
  updatedAt: number;
  data: unknown;
}

export interface SaveRepository {
  load(): Promise<SaveRecord | null>;
  save(state: GameState, now: number): Promise<void>;
  saveRecord?(record: SaveRecord): Promise<void>;
}

function isRecord(v: unknown): v is SaveRecord {
  return !!v && typeof v === "object" && "data" in (v as object) && !!(v as SaveRecord).data;
}

export function createRepository(idb: IDBFactory | null, ls: Storage | null): SaveRepository {
  let dbPromise: Promise<IDBDatabase | null> | null = null;

  const openDB = (): Promise<IDBDatabase | null> => {
    if (!idb) return Promise.resolve(null);
    if (!dbPromise) {
      dbPromise = new Promise((resolve) => {
        try {
          const req = idb.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
          req.onblocked = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    return dbPromise;
  };

  const readIdb = async (): Promise<SaveRecord | null> => {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(SAVE_KEY);
        req.onsuccess = () => resolve(isRecord(req.result) ? req.result : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  };

  const readLs = (): SaveRecord | null => {
    try {
      const raw = ls?.getItem(LS_BACKUP_KEY);
      const rec = raw ? JSON.parse(raw) : null;
      return isRecord(rec) ? rec : null;
    } catch {
      return null;
    }
  };

  const writeRecord = async (record: SaveRecord): Promise<void> => {
    // 1. localStorage 즉시 동기 기록 (강제 종료 대비)
    try {
      ls?.setItem(LS_BACKUP_KEY, JSON.stringify(record));
    } catch {
      // 용량 초과 등은 무시하고 IndexedDB에 맡긴다
    }
    // 2. IndexedDB 영구 저장
    const db = await openDB();
    if (!db) return;
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  };

  return {
    async load() {
      const lsRec = readLs();
      const idbRec = await readIdb();
      if (idbRec && lsRec) return (idbRec.updatedAt || 0) >= (lsRec.updatedAt || 0) ? idbRec : lsRec;
      return idbRec ?? lsRec;
    },
    save(state, now) {
      return writeRecord({ id: SAVE_KEY, schemaVersion: SAVE_SCHEMA_VERSION, updatedAt: now, data: state });
    },
    saveRecord: writeRecord,
  };
}
