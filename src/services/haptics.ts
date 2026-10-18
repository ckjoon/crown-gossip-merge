// haptics.ts — 진동 피드백 (Android Chrome 등 navigator.vibrate 지원 기기에서만)

export const HAPTIC = { spawn: 10, merge: 15, bigMerge: 30 } as const;

export function vibrate(ms: number): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    // 지원하지 않는 기기는 무시
  }
}
