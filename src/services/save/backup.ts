// backup.ts — 기기 이전용 백업 코드 (v2와 같은 인코딩: base64(encodeURIComponent(JSON)))

import type { SaveRecord } from "./repository";

export function encodeBackup(record: SaveRecord): string {
  return btoa(encodeURIComponent(JSON.stringify(record)));
}

export function decodeBackup(code: string): SaveRecord | null {
  try {
    const rec = JSON.parse(decodeURIComponent(atob(code.trim())));
    if (!rec || typeof rec !== "object" || !rec.data) return null;
    return { id: "main_save_v1", schemaVersion: typeof rec.schemaVersion === "number" ? rec.schemaVersion : 3, updatedAt: typeof rec.updatedAt === "number" ? rec.updatedAt : 0, data: rec.data };
  } catch {
    return null;
  }
}
