// energyAlert.ts — 번개 가득 알림 켜기·끄기 (설정과 번개가 바닥났을 때 묻는 창이 같이 씀)

import { disableEnergyAlert, enableEnergyAlert } from "../../services/push";
import { toast } from "./ui.svelte";

const RESULT_TEXT = {
  on: ["🔔 번개가 다 차면 알려 드릴게요!", "#10b981"],
  denied: ["알림이 막혀 있어요. 폰 설정 ➔ 앱 ➔ 알림에서 허용해 주세요.", "#ef4444"],
  unsupported: ["이 브라우저에서는 알림을 받을 수 없어요. 홈 화면에 설치한 앱에서 켜 주세요.", "#ef4444"],
  error: ["알림을 켜지 못했어요. 잠시 뒤 다시 해 주세요.", "#ef4444"],
} as const;

export async function turnOnEnergyAlert(at?: { x: number; y: number }): Promise<boolean> {
  const r = await enableEnergyAlert();
  const [text, color] = RESULT_TEXT[r];
  toast(text, at?.x, at?.y, color);
  return r === "on";
}

export async function turnOffEnergyAlert(at?: { x: number; y: number }): Promise<void> {
  await disableEnergyAlert();
  toast("🔕 번개 가득 알림을 껐어요.", at?.x, at?.y, "#64748b");
}
