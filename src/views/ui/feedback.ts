// feedback.ts — 보드 밖 행동 결과를 알림·대화 바·효과음으로 알려 준다 (보드 위 연출은 views/fx/juice.ts)

import type { Store } from "../../core/store";
import type { SoundEngine } from "../../services/audio";
import { getGeneratorTierMeta, getItemMeta } from "../../core/rules/chains";
import { getGeneratorTierCap } from "../../core/rules/progression";
import { say, toast } from "./ui.svelte";

export function attachFeedback(store: Store, sfx: SoundEngine): () => void {
  // 구역 완성 선물 생성기는 진화 파츠 안내 대신 선물 장면(RewardDirector)이 알린다 — 바로 뒤 지급 이벤트 하나를 건너뜀
  let giftChain: string | null = null;
  return store.onEvent((e) => {
    switch (e.type) {
      case "orderServed":
        say(`${e.customer.face} ${e.customer.name}`, e.customer.line);
        toast(`🎉 주문 완료! +${e.coins}🪙${e.bonusCell !== null ? " +번개조각⚡" : ""}`, undefined, 160, "#10b981");
        break;
      case "collected":
        sfx.serve();
        toast(e.currency === "coins" ? `+${e.amount}🪙 획득!` : `+${e.amount}⚡ 번개 획득!`, undefined, 200, e.currency === "coins" ? "#fbbf24" : "#38bdf8");
        break;
      case "cobwebUnlocked":
        sfx.merge(3, true);
        toast("🕸️ 거미줄 즉시 해제!", undefined, 220, "#10b981");
        break;
      case "boardSorted":
        sfx.tap();
        toast("🧹 재료 정렬 완료!", undefined, 220, "#38bdf8");
        break;
      case "sold":
        sfx.tap();
        toast(`+${e.coins}🪙 판매`, undefined, 220, "#fbbf24");
        break;
      case "bagStored":
      case "bagRetrieved":
        sfx.tap();
        break;
      case "merged":
        if (e.generatorEvolved) {
          const meta = getGeneratorTierMeta(e.item.chain, e.item.level);
          say("🔥 생성기 합성 진화 성공!", `${meta.name}(${"★".repeat(e.item.level)})으로 진화! 이제 한 번에 최대 Lv.${getGeneratorTierCap(e.item.level)}까지 나옵니다!`);
        }
        break;
      case "chainUnlocked":
        giftChain = e.chain;
        break;
      case "generatorPartGranted": {
        if (giftChain === e.chain) {
          giftChain = null;
          break;
        }
        const meta = getGeneratorTierMeta(e.chain, 1);
        if (e.where === "board") say("🔥 생성기 진화 파츠 획득", `[${meta.name} ★]을 획득했습니다! 같은 생성기끼리 드래그해 합치면 등급이 올라갑니다!`);
        else if (e.where === "bag") say("🎒 보관함 지급", `보드가 가득 차서 [${meta.name} ★] 진화 파츠가 보관함(🎒)으로 지급되었습니다!`);
        break;
      }
      case "itemBought": {
        sfx.serve();
        toast(`💎-${e.price} 재료 구매 → ${e.where === "board" ? "보드" : "보관함"}`, undefined, 200, "#a78bfa");
        break;
      }
      case "holidaySent":
      case "holidayMissionCompleted": {
        const meta = getItemMeta(e.mainChain, e.mainLv);
        sfx.serve();
        toast(e.type === "holidayMissionCompleted" ? `🎃 이벤트 미션 달성! ${e.gems > 0 ? `+💎${e.gems} & ` : ""}[${meta.name}] 획득!` : `🎁 본게임 [${meta.name}] 전송 완료!`, undefined, 200, "#10b981");
        break;
      }
      default:
        break;
    }
  });
}
