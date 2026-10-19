// tidyNote.ts — 불러올 때 정리한 내용(남는 생성기·흡수·주문 조정, v3.9)을 셀레네가 한 줄로 알려 줄 문구
// 백업 복원은 정리된 상태를 저장하고 새로고침하므로, 문구를 sessionStorage로 넘겨 새로고침 뒤에 알린다

import type { LoadTidy } from "../../services/save/restore";

const KEY = "crown_gossip_tidy_note";

export function tidyText(t: LoadTidy): string | null {
  const lines: string[] = [];
  if (t.trimmed.length) {
    const n = t.trimmed.reduce((k, x) => k + x.count, 0);
    const coins = t.trimmed.reduce((k, x) => k + x.coins, 0);
    lines.push(`★★★가 있는 체인의 겹치는 생성기 ${n}개를 ${coins}🪙로 바꿔 두었어 (체인마다 ★★★ 하나면 충분해)`);
  }
  if (t.absorbed) lines.push(`짝을 더 만들 수 없는 Lv.1 재료 ${t.absorbed}개는 생성기가 흡수해 코인으로 바꿨어`);
  if (t.adjusted) lines.push(`더 만들 수 없는 Lv.1 주문 ${t.adjusted}건은 Lv.2로 바꿨어`);
  return lines.length ? lines.join(" · ") : null;
}

export function stashTidyNote(text: string | null): void {
  if (!text) return;
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    // 저장 못 하면 알림만 생략
  }
}

export function takeTidyNote(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return v;
  } catch {
    return null;
  }
}
