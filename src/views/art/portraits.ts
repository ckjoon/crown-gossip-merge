// portraits.ts — 치비 캐릭터 초상화 생성기 (코드로 그린 벡터, 표정 4종). 외부 이미지 없이 캐릭터별 머리·눈·소품 파라미터로 그린다

import type { Expression } from "../../core/rules/expressions";

export const EXPRESSIONS: Expression[] = ["neutral", "happy", "surprised", "worried"];

type HairStyle = "long" | "short" | "bob" | "spiky" | "bun" | "slick";
type Acc =
  | "witchHat"
  | "detectiveHat"
  | "crown"
  | "captainHat"
  | "flowerCrown"
  | "glasses"
  | "beard"
  | "gardenerHat"
  | "fairyWings"
  | "maidCap"
  | "wizardHat"
  | "beret"
  | "fangs"
  | "bow"
  | "miniCat";

interface Look {
  kind?: "human" | "cat" | "bird";
  bg: string;
  skin: string;
  hair: string;
  style: HairStyle;
  eye: string;
  acc: Acc[];
}

const LOOKS: Record<string, Look> = {
  selene: { bg: "#7c3aed", skin: "#fde2cf", hair: "#4c1d95", style: "long", eye: "#a855f7", acc: ["witchHat"] },
  quinn: { bg: "#0e7490", skin: "#f8d7c0", hair: "#b45309", style: "bob", eye: "#0f766e", acc: ["detectiveHat"] },
  nero: { kind: "cat", bg: "#312e81", skin: "#111827", hair: "#111827", style: "short", eye: "#84cc16", acc: [] },
  quinn_nero: { bg: "#155e75", skin: "#f8d7c0", hair: "#b45309", style: "bob", eye: "#0f766e", acc: ["detectiveHat", "miniCat"] },
  lucian: { bg: "#7f1d1d", skin: "#f1f5f9", hair: "#e5e7eb", style: "slick", eye: "#dc2626", acc: ["fangs"] },
  olivia: { bg: "#db2777", skin: "#fde2cf", hair: "#f59e0b", style: "bun", eye: "#92400e", acc: ["bow"] },
  harrison: { bg: "#92400e", skin: "#e8b48f", hair: "#57534e", style: "short", eye: "#44403c", acc: ["beard"] },
  carmen: { bg: "#ea580c", skin: "#e8b48f", hair: "#1c1917", style: "bob", eye: "#78350f", acc: ["beret"] },
  marco: { bg: "#1e3a8a", skin: "#d6a07c", hair: "#78716c", style: "short", eye: "#1e293b", acc: ["captainHat", "beard"] },
  ella: { bg: "#0891b2", skin: "#fde2cf", hair: "#a16207", style: "long", eye: "#1d4ed8", acc: ["glasses"] },
  pip: { kind: "bird", bg: "#38bdf8", skin: "#ffffff", hair: "#ffffff", style: "short", eye: "#111827", acc: [] },
  rowan: { bg: "#15803d", skin: "#e8b48f", hair: "#854d0e", style: "spiky", eye: "#3f6212", acc: ["gardenerHat"] },
  lily: { bg: "#f472b6", skin: "#fff1f2", hair: "#f9a8d4", style: "long", eye: "#be185d", acc: ["fairyWings", "flowerCrown"] },
  verna: { bg: "#0d9488", skin: "#f8d7c0", hair: "#7c2d12", style: "bun", eye: "#065f46", acc: ["glasses"] },
  arthur: { bg: "#ca8a04", skin: "#fde2cf", hair: "#facc15", style: "short", eye: "#1d4ed8", acc: ["crown"] },
  margaret: { bg: "#6b7280", skin: "#f1d5c2", hair: "#d4d4d8", style: "bun", eye: "#374151", acc: ["maidCap", "glasses"] },
  oberon: { bg: "#312e81", skin: "#f1d5c2", hair: "#e5e7eb", style: "long", eye: "#4338ca", acc: ["wizardHat", "beard"] },
};

export const PORTRAIT_IDS = Object.keys(LOOKS);

const INK = "#3b1d2e";

function eyes(expr: Expression, color: string, cy = 57): string {
  switch (expr) {
    case "happy":
      return `<path d="M34 ${cy + 1} Q40 ${cy - 6} 46 ${cy + 1}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M54 ${cy + 1} Q60 ${cy - 6} 66 ${cy + 1}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    case "surprised":
      return `<circle cx="40" cy="${cy}" r="6.2" fill="#fff" stroke="${INK}" stroke-width="1.8"/><circle cx="60" cy="${cy}" r="6.2" fill="#fff" stroke="${INK}" stroke-width="1.8"/><circle cx="40" cy="${cy}" r="3.4" fill="${color}"/><circle cx="60" cy="${cy}" r="3.4" fill="${color}"/>`;
    case "worried":
      return `<path d="M33 ${cy - 10} L46 ${cy - 7}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M67 ${cy - 10} L54 ${cy - 7}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="40" cy="${cy + 1}" rx="4" ry="4.8" fill="${color}" stroke="${INK}" stroke-width="1.5"/><ellipse cx="60" cy="${cy + 1}" rx="4" ry="4.8" fill="${color}" stroke="${INK}" stroke-width="1.5"/><circle cx="41.5" cy="${cy - 0.5}" r="1.4" fill="#fff"/><circle cx="61.5" cy="${cy - 0.5}" r="1.4" fill="#fff"/>`;
    default:
      return `<ellipse cx="40" cy="${cy}" rx="4.6" ry="5.6" fill="${color}" stroke="${INK}" stroke-width="1.5"/><ellipse cx="60" cy="${cy}" rx="4.6" ry="5.6" fill="${color}" stroke="${INK}" stroke-width="1.5"/><circle cx="41.8" cy="${cy - 2}" r="1.7" fill="#fff"/><circle cx="61.8" cy="${cy - 2}" r="1.7" fill="#fff"/>`;
  }
}

function mouth(expr: Expression, y = 70): string {
  switch (expr) {
    case "happy":
      return `<path d="M42 ${y - 3} Q50 ${y + 8} 58 ${y - 3} Z" fill="#be123c" stroke="${INK}" stroke-width="1.6"/><path d="M45 ${y + 1} Q50 ${y + 4} 55 ${y + 1}" fill="#fda4af"/>`;
    case "surprised":
      return `<ellipse cx="50" cy="${y + 1}" rx="3.6" ry="4.6" fill="#7f1d1d" stroke="${INK}" stroke-width="1.4"/>`;
    case "worried":
      return `<path d="M43 ${y + 1} Q46.5 ${y - 2.5} 50 ${y + 1} Q53.5 ${y + 4.5} 57 ${y + 1}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    default:
      return `<path d="M45 ${y} Q50 ${y + 3} 55 ${y}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
}

function hairBack(l: Look): string {
  if (l.style === "long") return `<path d="M22 52 Q22 22 50 20 Q78 22 78 52 L80 92 L20 92 Z" fill="${l.hair}" stroke="${INK}" stroke-width="2"/>`;
  if (l.style === "bob") return `<path d="M22 54 Q22 22 50 20 Q78 22 78 54 L78 74 L22 74 Z" fill="${l.hair}" stroke="${INK}" stroke-width="2"/>`;
  if (l.style === "bun") return `<circle cx="50" cy="20" r="11" fill="${l.hair}" stroke="${INK}" stroke-width="2"/>`;
  return "";
}

function hairFront(l: Look): string {
  switch (l.style) {
    case "spiky":
      return `<path d="M24 50 L28 30 L34 40 L40 24 L46 38 L52 22 L58 38 L64 26 L68 40 L74 30 L76 50 Q64 38 50 38 Q36 38 24 50 Z" fill="${l.hair}" stroke="${INK}" stroke-width="2"/>`;
    case "slick":
      return `<path d="M24 50 Q24 26 50 25 Q76 26 76 50 Q70 36 56 34 L52 42 L48 34 Q32 36 24 50 Z" fill="${l.hair}" stroke="${INK}" stroke-width="2"/>`;
    case "short":
      return `<path d="M24 52 Q24 26 50 25 Q76 26 76 52 Q68 40 50 40 Q32 40 24 52 Z" fill="${l.hair}" stroke="${INK}" stroke-width="2"/>`;
    default:
      return `<path d="M24 54 Q24 26 50 25 Q76 26 76 54 Q72 42 62 40 Q56 46 50 40 Q44 46 38 40 Q28 42 24 54 Z" fill="${l.hair}" stroke="${INK}" stroke-width="2"/>`;
  }
}

function accessory(a: Acc, l: Look): string {
  switch (a) {
    case "witchHat":
      return `<path d="M30 30 L52 -2 L70 30 Z" fill="#4c1d95" stroke="${INK}" stroke-width="2"/><rect x="34" y="23" width="32" height="5" fill="#fde047"/><ellipse cx="50" cy="31" rx="30" ry="6" fill="#5b21b6" stroke="${INK}" stroke-width="2"/>`;
    case "detectiveHat":
      return `<path d="M26 34 Q26 16 50 15 Q74 16 74 34 Z" fill="#a16207" stroke="${INK}" stroke-width="2"/><path d="M22 34 L78 34 L72 39 L28 39 Z" fill="#854d0e" stroke="${INK}" stroke-width="1.6"/><path d="M34 22 L66 22" stroke="#713f12" stroke-width="2" stroke-dasharray="3 2"/>`;
    case "crown":
      return `<path d="M30 30 L32 12 L41 22 L50 8 L59 22 L68 12 L70 30 Z" fill="#facc15" stroke="#a16207" stroke-width="2"/><circle cx="50" cy="20" r="2.6" fill="#ef4444"/><circle cx="38" cy="24" r="2" fill="#3b82f6"/><circle cx="62" cy="24" r="2" fill="#22c55e"/>`;
    case "captainHat":
      return `<path d="M26 32 Q26 14 50 14 Q74 14 74 32 Z" fill="#1e3a8a" stroke="${INK}" stroke-width="2"/><rect x="24" y="30" width="52" height="6" rx="3" fill="#0f172a"/><circle cx="50" cy="24" r="4.5" fill="#fde047" stroke="#a16207" stroke-width="1.2"/>`;
    case "flowerCrown":
      return [26, 38, 50, 62, 74].map((x, i) => `<circle cx="${x}" cy="${30 - (i % 2) * 3}" r="4.6" fill="${["#f9a8d4", "#fde047", "#a5f3fc", "#fde047", "#f9a8d4"][i]}" stroke="${INK}" stroke-width="1.2"/><circle cx="${x}" cy="${30 - (i % 2) * 3}" r="1.6" fill="#fff"/>`).join("");
    case "glasses":
      return `<circle cx="40" cy="57" r="8" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="60" cy="57" r="8" fill="none" stroke="${INK}" stroke-width="2"/><path d="M48 57 L52 57" stroke="${INK}" stroke-width="2"/>`;
    case "beard":
      return `<path d="M27 64 Q30 88 50 92 Q70 88 73 64 Q66 76 50 76 Q34 76 27 64 Z" fill="${l.hair}" stroke="${INK}" stroke-width="2"/><path d="M42 72 Q50 68 58 72" fill="none" stroke="${INK}" stroke-width="2"/>`;
    case "gardenerHat":
      return `<ellipse cx="50" cy="32" rx="32" ry="7" fill="#a3e635" stroke="${INK}" stroke-width="2"/><path d="M34 32 Q34 16 50 16 Q66 16 66 32 Z" fill="#84cc16" stroke="${INK}" stroke-width="2"/><path d="M56 18 Q62 10 68 14" stroke="#15803d" stroke-width="3" fill="none"/>`;
    case "fairyWings":
      return `<ellipse cx="14" cy="50" rx="10" ry="18" fill="#e0f2fe" fill-opacity="0.85" stroke="#7dd3fc" stroke-width="1.6"/><ellipse cx="86" cy="50" rx="10" ry="18" fill="#e0f2fe" fill-opacity="0.85" stroke="#7dd3fc" stroke-width="1.6"/>`;
    case "maidCap":
      return `<path d="M30 30 Q34 18 42 22 Q50 14 58 22 Q66 18 70 30 Z" fill="#ffffff" stroke="${INK}" stroke-width="2"/><path d="M30 30 L70 30" stroke="#f9a8d4" stroke-width="3"/>`;
    case "wizardHat":
      return `<path d="M28 32 L48 -4 L72 32 Z" fill="#1d4ed8" stroke="${INK}" stroke-width="2"/><ellipse cx="50" cy="33" rx="30" ry="6" fill="#1e40af" stroke="${INK}" stroke-width="2"/><path d="M47 14 l2 4 4 0 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 0 z" fill="#fde047"/>`;
    case "beret":
      return `<ellipse cx="44" cy="28" rx="26" ry="9" fill="#dc2626" stroke="${INK}" stroke-width="2"/><circle cx="46" cy="18" r="2.5" fill="${INK}"/>`;
    case "fangs":
      return `<path d="M45 72 L46.5 77 L48 72 Z" fill="#fff" stroke="${INK}" stroke-width="0.8"/><path d="M52 72 L53.5 77 L55 72 Z" fill="#fff" stroke="${INK}" stroke-width="0.8"/><path d="M20 92 L34 76 L50 84 L66 76 L80 92 Z" fill="#450a0a" stroke="${INK}" stroke-width="2"/>`;
    case "bow":
      return `<path d="M50 26 L36 18 L36 34 Z M50 26 L64 18 L64 34 Z" fill="#ec4899" stroke="${INK}" stroke-width="1.8"/><circle cx="50" cy="26" r="3.5" fill="#be185d"/>`;
    case "miniCat":
      return `<circle cx="80" cy="80" r="11" fill="#111827" stroke="#fff" stroke-width="1.6"/><path d="M71 74 L73 64 L78 71 Z M89 74 L87 64 L82 71 Z" fill="#111827"/><circle cx="76.5" cy="80" r="2" fill="#84cc16"/><circle cx="83.5" cy="80" r="2" fill="#84cc16"/>`;
  }
}

function catFace(l: Look, expr: Expression): string {
  const eye = expr === "happy"
    ? `<path d="M33 57 Q39 51 45 57" fill="none" stroke="${l.eye}" stroke-width="3.2" stroke-linecap="round"/><path d="M55 57 Q61 51 67 57" fill="none" stroke="${l.eye}" stroke-width="3.2" stroke-linecap="round"/>`
    : expr === "surprised"
    ? `<circle cx="39" cy="56" r="7" fill="${l.eye}"/><circle cx="61" cy="56" r="7" fill="${l.eye}"/><ellipse cx="39" cy="56" rx="2" ry="5.5" fill="#111"/><ellipse cx="61" cy="56" rx="2" ry="5.5" fill="#111"/>`
    : expr === "worried"
    ? `<path d="M31 46 L45 50 M69 46 L55 50" stroke="#e5e7eb" stroke-width="2.2"/><ellipse cx="39" cy="57" rx="5" ry="4" fill="${l.eye}"/><ellipse cx="61" cy="57" rx="5" ry="4" fill="${l.eye}"/>`
    : `<ellipse cx="39" cy="56" rx="5.5" ry="6" fill="${l.eye}"/><ellipse cx="61" cy="56" rx="5.5" ry="6" fill="${l.eye}"/><ellipse cx="39" cy="56" rx="1.4" ry="5" fill="#111"/><ellipse cx="61" cy="56" rx="1.4" ry="5" fill="#111"/>`;
  const m = expr === "surprised" ? `<ellipse cx="50" cy="70" rx="3" ry="3.6" fill="#f472b6"/>` : expr === "happy" ? `<path d="M44 67 Q47 72 50 67 Q53 72 56 67" fill="none" stroke="#f9a8d4" stroke-width="2.2"/>` : `<path d="M45 68 Q47.5 70.5 50 68 Q52.5 70.5 55 68" fill="none" stroke="#9ca3af" stroke-width="2"/>`;
  return `<path d="M24 40 L28 14 L44 32 Z M76 40 L72 14 L56 32 Z" fill="${l.skin}" stroke="#e5e7eb" stroke-width="1.6"/><path d="M29 22 L32 33 L39 30 Z M71 22 L68 33 L61 30 Z" fill="#f9a8d4"/><ellipse cx="50" cy="56" rx="28" ry="25" fill="${l.skin}" stroke="#e5e7eb" stroke-width="1.6"/>${eye}<path d="M48 63 L52 63 L50 65.5 Z" fill="#f472b6"/>${m}<path d="M24 62 L34 64 M24 68 L34 67 M76 62 L66 64 M76 68 L66 67" stroke="#d1d5db" stroke-width="1.4"/>`;
}

function birdFace(l: Look, expr: Expression): string {
  const e = eyes(expr, l.eye, 50);
  const beak = expr === "surprised" ? `<path d="M40 62 L60 62 L50 76 Z" fill="#f97316" stroke="${INK}" stroke-width="1.6"/><path d="M43 66 L57 66" stroke="#7c2d12" stroke-width="1.6"/>` : expr === "happy" ? `<path d="M40 60 L60 60 L50 74 Z" fill="#fb923c" stroke="${INK}" stroke-width="1.6"/>` : `<path d="M41 61 L59 61 L50 72 Z" fill="#f97316" stroke="${INK}" stroke-width="1.6"/>`;
  return `<ellipse cx="50" cy="58" rx="28" ry="27" fill="${l.skin}" stroke="#94a3b8" stroke-width="2"/><path d="M30 30 Q50 18 70 30 L64 34 Q50 28 36 34 Z" fill="#1d4ed8" stroke="${INK}" stroke-width="1.6"/><rect x="40" y="22" width="20" height="6" rx="2" fill="#facc15"/>${e}${beak}${expr === "worried" ? `<path d="M64 40 q3 5 0 7" stroke="#60a5fa" stroke-width="2" fill="none"/>` : ""}`;
}

export function getPortraitSVG(id: string, expr: Expression = "neutral"): string {
  const l = LOOKS[id] ?? LOOKS.selene;
  let body: string;
  if (l.kind === "cat") body = catFace(l, expr);
  else if (l.kind === "bird") body = birdFace(l, expr);
  else {
    const behind = l.acc.includes("fairyWings") ? accessory("fairyWings", l) : "";
    const blush = `<ellipse cx="32" cy="65" rx="5" ry="3" fill="#fb7185" opacity="${expr === "happy" ? 0.6 : 0.35}"/><ellipse cx="68" cy="65" rx="5" ry="3" fill="#fb7185" opacity="${expr === "happy" ? 0.6 : 0.35}"/>`;
    const sweat = expr === "worried" ? `<path d="M74 44 q4 6 0 9 q-4 -3 0 -9 z" fill="#93c5fd" stroke="#3b82f6" stroke-width="1"/>` : "";
    const front = l.acc.filter((a) => a !== "fairyWings").map((a) => accessory(a, l)).join("");
    body = `${behind}${hairBack(l)}<path d="M38 80 L62 80 L66 96 L34 96 Z" fill="${l.skin}" stroke="${INK}" stroke-width="1.6"/><ellipse cx="50" cy="57" rx="26" ry="27" fill="${l.skin}" stroke="${INK}" stroke-width="2"/>${blush}${eyes(expr, l.eye)}${mouth(expr)}${hairFront(l)}${front}${sweat}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><clipPath id="pc"><circle cx="50" cy="50" r="48"/></clipPath></defs><circle cx="50" cy="50" r="48" fill="${l.bg}"/><g clip-path="url(#pc)"><circle cx="30" cy="22" r="22" fill="#ffffff" opacity="0.12"/>${body}</g><circle cx="50" cy="50" r="47" fill="none" stroke="#fff" stroke-width="3"/></svg>`;
}

export function portraitDataUrl(id: string, expr: Expression = "neutral"): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(getPortraitSVG(id, expr));
}
