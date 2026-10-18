// events.ts — core 행동이 발행하는 도메인 이벤트. 연출 계층(Pixi 보드·fx·성·보상)은 이벤트만 보고 재생한다

import type { BoardItem, ChainId, CoreChain, CustomerInfo, ZoneKey } from "./types";

export type RejectReason =
  | "noEnergy"
  | "boardFull"
  | "bagFull"
  | "notEnoughCoins"
  | "notEnoughGems"
  | "locked"
  | "cannotMerge"
  | "crateLocked"
  | "noCobweb"
  | "notNextChapter"
  | "eventBoardFull"
  | "missionNotReady"
  | "nothingSelected";

export type Currency = "coins" | "gems" | "energy";

export type GameEvent =
  | { type: "spawned"; from: number; to: number; item: BoardItem; boostSteps: number; energyCost: number }
  | { type: "moved"; from: number; to: number; swapped: boolean }
  | { type: "merged"; from: number; to: number; item: BoardItem; wasCobweb: boolean; generatorEvolved: boolean }
  | { type: "cratesOpened"; cells: number[] }
  | { type: "bonusDropped"; cell: number; item: BoardItem }
  | { type: "collected"; cell: number; currency: "coins" | "energy"; amount: number }
  | { type: "cobwebUnlocked"; cell: number }
  | { type: "boardSorted" }
  | { type: "bagStored"; from: number }
  | { type: "bagRetrieved"; to: number; bagIdx: number }
  | { type: "sold"; cell: number; coins: number }
  | { type: "rejected"; reason: RejectReason; cell?: number }
  | { type: "orderServed"; orderIdx: number; cells: number[]; coins: number; bonusCell: number | null; customer: CustomerInfo }
  | { type: "itemBought"; orderIdx: number; reqIdx: number; where: "board" | "bag"; cell: number | null; price: number }
  | { type: "currencyChanged"; currency: Currency; delta: number; reason: string }
  | { type: "levelUp"; level: number; coins: number; energy: number; gems: number; genChain: CoreChain }
  | { type: "generatorPartGranted"; chain: CoreChain; where: "board" | "bag" | "none"; cell: number | null }
  | { type: "spotRestored"; spotId: string; zoneKey: ZoneKey; chapter: number; coinCost: number; styleIdx: number }
  | { type: "spotRestyled"; spotId: string; styleIdx: number }
  | { type: "zoneCompleted"; zoneKey: ZoneKey; gems: number; revealKey: ZoneKey | null }
  | { type: "zoneSelected"; zoneKey: ZoneKey }
  | { type: "holidaySpawned"; cell: number; level: number; free: boolean }
  | { type: "holidayMerged"; from: number; to: number; level: number }
  | { type: "holidayMoved"; from: number; to: number }
  | { type: "holidayMissionCompleted"; gems: number; mainChain: ChainId; mainLv: number }
  | { type: "holidaySent"; cell: number; mainChain: ChainId; mainLv: number }
  | { type: "energyRegen"; energy: number }
  | { type: "settingsChanged" }
  | { type: "boostChanged"; boost: 1 | 2 | 4 };

export function rejected(reason: RejectReason, cell?: number): GameEvent {
  return cell === undefined ? { type: "rejected", reason } : { type: "rejected", reason, cell };
}
