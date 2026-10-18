// expressions.ts — 대사 분위기에 맞춰 캐릭터 표정 고르기 (걱정 > 놀람 > 기쁨 > 기본)

export type Expression = "neutral" | "happy" | "surprised" | "worried";

const WORRIED = ["걱정", "하지만", "…", "큰일"];

export function expressionFor(line: string): Expression {
  if (WORRIED.some((w) => line.includes(w))) return "worried";
  if (line.includes("?")) return "surprised";
  if (line.includes("!")) return "happy";
  return "neutral";
}
