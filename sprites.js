// sprites.js — 모든 체인의 모든 레벨(Lv.1~Lv.6)이 100% 서로 다른 고유 디자인을 갖는 커스텀 SVG 일러스트 렌더러

window.GameSprites = (function () {
  function svgWrap(inner, bgGradId, c1, c2) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="${bgGradId}" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </radialGradient>
        <filter id="dropGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.8" stdDeviation="1.6" flood-color="#000" flood-opacity="0.32"/>
        </filter>
      </defs>
      <g filter="url(#dropGlow)">${inner}</g>
    </svg>`;
  }

  function getItemSVG(chain, level, isGenerator = false) {
    if (isGenerator) return getGeneratorSVG(chain);
    switch (chain) {
      case "potion":
        return getPotionSVG(level);
      case "grimoire":
        return getGrimoireSVG(level);
      case "herb":
        return getHerbSVG(level);
      case "bakery":
        return getBakerySVG(level);
      case "tea":
        return getTeaSVG(level);
      case "gem":
        return getGemSVG(level);
      case "combo":
        return getComboSVG(level);
      case "coin":
        return getCoinSVG(level);
      case "energy":
        return getEnergySVG(level);
      default:
        return getGemSVG(1);
    }
  }

  // ==================== 5종 생성기 아이콘 ====================
  function getGeneratorSVG(chain) {
    const uid = `gen_${chain}`;
    if (chain === "potion") {
      return svgWrap(
        `
        <path d="M16 54 Q24 42 32 54 Q40 42 48 54 Z" fill="#ff6b35"/>
        <path d="M22 55 Q32 44 42 55 Z" fill="#fde047"/>
        <ellipse cx="32" cy="36" rx="20" ry="15" fill="url(#${uid})" stroke="#1e1b4b" stroke-width="2.5"/>
        <ellipse cx="32" cy="24" rx="17" ry="6" fill="#312e81" stroke="#1e1b4b" stroke-width="2"/>
        <ellipse cx="32" cy="24" rx="14" ry="4.5" fill="#c084fc"/>
        <circle cx="27" cy="22" r="3" fill="#f0abfc"/>
        <circle cx="36" cy="20" r="2.2" fill="#e879f9"/>
        <circle cx="32" cy="14" r="2.5" fill="#f0abfc"/>
      `,
        uid,
        "#4c1d95",
        "#1e1b4b"
      );
    }
    if (chain === "grimoire") {
      return svgWrap(
        `
        <rect x="12" y="10" width="40" height="46" rx="5" fill="url(#${uid})" stroke="#451a03" stroke-width="2.5"/>
        <rect x="16" y="15" width="32" height="16" rx="2" fill="#291507"/>
        <rect x="16" y="35" width="32" height="16" rx="2" fill="#291507"/>
        <rect x="18" y="17" width="6" height="14" rx="1" fill="#ef4444"/>
        <rect x="25" y="18" width="6" height="13" rx="1" fill="#3b82f6"/>
        <rect x="32" y="16" width="7" height="15" rx="1" fill="#a855f7"/>
        <rect x="40" y="19" width="6" height="12" rx="1" fill="#eab308"/>
        <circle cx="25" cy="43" r="6" fill="#38bdf8" stroke="#bae6fd" stroke-width="1.5"/>
        <rect x="34" y="38" width="11" height="13" rx="1.5" fill="#10b981"/>
      `,
        uid,
        "#b45309",
        "#78350f"
      );
    }
    if (chain === "herb") {
      return svgWrap(
        `
        <path d="M16 38 V24 A16 16 0 0 1 48 24 V38 Z" fill="rgba(186,230,253,0.45)" stroke="#38bdf8" stroke-width="2"/>
        <path d="M32 38 V20" stroke="#16a34a" stroke-width="3" stroke-linecap="round"/>
        <path d="M32 28 Q22 22 20 28 Q24 34 32 28 Z" fill="#4ade80"/>
        <path d="M32 25 Q42 19 44 25 Q40 31 32 25 Z" fill="#22c55e"/>
        <circle cx="32" cy="18" r="5" fill="#f472b6" stroke="#fbcfe8" stroke-width="1.5"/>
        <polygon points="14,38 50,38 44,54 20,54" fill="url(#${uid})" stroke="#7c2d12" stroke-width="2.5"/>
      `,
        uid,
        "#f97316",
        "#9a3412"
      );
    }
    if (chain === "bakery") {
      return svgWrap(
        `
        <path d="M12 52 V28 A20 20 0 0 1 52 28 V52 Z" fill="url(#${uid})" stroke="#7f1d1d" stroke-width="2.5"/>
        <path d="M20 52 V34 A12 12 0 0 1 44 34 V52 Z" fill="#450a0a" stroke="#fbbf24" stroke-width="2"/>
        <ellipse cx="32" cy="45" rx="9" ry="5" fill="#fb923c"/>
        <ellipse cx="32" cy="43" rx="7" ry="3.5" fill="#fde047"/>
      `,
        uid,
        "#dc2626",
        "#7f1d1d"
      );
    }
    if (chain === "tea") {
      return svgWrap(
        `
        <path d="M46 28 Q58 24 54 36 Q50 42 44 40" fill="none" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
        <path d="M18 28 Q8 28 12 38 Q15 44 20 40" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse cx="32" cy="36" rx="16" ry="14" fill="url(#${uid})" stroke="#fde047" stroke-width="2.5"/>
        <ellipse cx="32" cy="22" rx="10" ry="4" fill="#38bdf8" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="32" cy="17" r="3.5" fill="#fbbf24"/>
      `,
        uid,
        "#0284c7",
        "#1e3a8a"
      );
    }
    return getGemSVG(5);
  }

  // ==================== 1. 물약 체인 (Lv.1~6 모두 완전히 다른 디자인!) ====================
  function getPotionSVG(level) {
    const uid = `pot_${level}`;
    if (level === 1) {
      // Lv.1 마나 이슬 (맑은 푸른 물방울)
      return svgWrap(
        `
        <path d="M32 10 C32 10 48 30 48 42 A16 16 0 0 1 16 42 C16 30 32 10 32 10 Z" fill="url(#${uid})" stroke="#ffffff" stroke-width="2.2"/>
        <ellipse cx="25" cy="36" rx="3" ry="6" transform="rotate(-20 25 36)" fill="rgba(255,255,255,0.7)"/>
      `,
        uid,
        "#7dd3fc",
        "#0284c7"
      );
    }
    if (level === 2) {
      // Lv.2 초급 마나물약 (기울어진 코르크 유리 시험관)
      return svgWrap(
        `
        <g transform="rotate(18 32 32)">
          <rect x="26" y="8" width="12" height="7" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
          <path d="M23 15 H41 V46 A9 9 0 0 1 23 46 Z" fill="rgba(255,255,255,0.4)" stroke="#ffffff" stroke-width="2.5"/>
          <path d="M24.5 28 H39.5 V46 A7.5 7.5 0 0 1 24.5 46 Z" fill="url(#${uid})"/>
          <circle cx="29" cy="39" r="2.5" fill="rgba(255,255,255,0.7)"/>
        </g>
      `,
        uid,
        "#a78bfa",
        "#5b21b6"
      );
    }
    if (level === 3) {
      // Lv.3 달빛 플라스크 (삼각 플라스크 + 초승달 심볼)
      return svgWrap(
        `
        <rect x="26" y="8" width="12" height="5" rx="2" fill="#b45309"/>
        <polygon points="27,13 37,13 50,48 14,48" rx="6" fill="url(#${uid})" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- 초승달 마크 -->
        <path d="M34 28 A7 7 0 1 0 34 42 A5.5 5.5 0 1 1 34 28 Z" fill="#fef08a"/>
      `,
        uid,
        "#38bdf8",
        "#1e3a8a"
      );
    }
    if (level === 4) {
      // Lv.4 자수정 비약 (다이아몬드 커팅된 보라색 향수병 + 황금 날개 마개)
      return svgWrap(
        `
        <polygon points="24,10 40,10 36,18 28,18" fill="#fbbf24" stroke="#92400e" stroke-width="1.5"/>
        <rect x="26" y="18" width="12" height="4" fill="#d97706"/>
        <polygon points="22,22 42,22 52,34 42,52 22,52 12,34" fill="url(#${uid})" stroke="#f5d0fe" stroke-width="2.5"/>
        <polygon points="32,26 42,36 32,46 22,36" fill="rgba(255,255,255,0.35)" stroke="#fde047" stroke-width="1.5"/>
      `,
        uid,
        "#e879f9",
        "#701a75"
      );
    }
    if (level === 5) {
      // Lv.5 성운 엘릭서 (황금 행성 고리가 감싸고 있는 우주 구체 포션)
      return svgWrap(
        `
        <circle cx="32" cy="12" r="4" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>
        <circle cx="32" cy="35" r="16" fill="url(#${uid})" stroke="#ffffff" stroke-width="2.2"/>
        <!-- 별빛 점들 -->
        <circle cx="26" cy="30" r="2" fill="#fde047"/>
        <circle cx="37" cy="28" r="1.5" fill="#ffffff"/>
        <circle cx="35" cy="40" r="2.2" fill="#f472b6"/>
        <!-- 토성 황금 링 -->
        <ellipse cx="32" cy="35" rx="25" ry="6" transform="rotate(-18 32 35)" fill="none" stroke="#fbbf24" stroke-width="3.5"/>
      `,
        uid,
        "#6366f1",
        "#1e1b4b"
      );
    }
    // Lv.6 신성 날개비약 (천사 하얀 날개 한 쌍 + 황금 성배 + 왕관)
    return svgWrap(
      `
      <!-- 양쪽 천사 날개 -->
      <path d="M20 34 C6 28 4 14 16 18 C12 22 16 26 22 28 Z" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
      <path d="M44 34 C58 28 60 14 48 18 C52 22 48 26 42 28 Z" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
      <!-- 상단 왕관 -->
      <polygon points="23,14 27,7 32,12 37,7 41,14" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>
      <!-- 성배 몸통 -->
      <path d="M20 18 H44 L40 38 A10 10 0 0 1 24 38 Z" fill="url(#${uid})" stroke="#fde047" stroke-width="2.5"/>
      <rect x="29" y="42" width="6" height="8" fill="#fbbf24"/>
      <rect x="22" y="50" width="20" height="5" rx="2.5" fill="#d97706" stroke="#fde047" stroke-width="1.5"/>
      <polygon points="32,21 34,27 40,27 35,31 37,37 32,33 27,37 29,31 24,27 30,27" fill="#ffffff"/>
    `,
      uid,
      "#fde047",
      "#d97706"
    );
  }

  // ==================== 2. 마도서 체인 (Lv.1~6 모두 완전히 다른 디자인!) ====================
  function getGrimoireSVG(level) {
    const uid = `grim_${level}`;
    if (level === 1) {
      // Lv.1 마력 깃펜 (잉크병과 깃털 펜)
      return svgWrap(
        `
        <rect x="14" y="38" width="16" height="14" rx="3" fill="#312e81" stroke="#a5b4fc" stroke-width="1.8"/>
        <path d="M50 8 C34 10 24 24 22 40 L28 38 C42 32 52 20 50 8 Z" fill="url(#${uid})" stroke="#ffffff" stroke-width="1.8"/>
        <line x1="20" y1="44" x2="46" y2="12" stroke="#fde047" stroke-width="2.5" stroke-linecap="round"/>
      `,
        uid,
        "#f0abfc",
        "#9333ea"
      );
    }
    if (level === 2) {
      // Lv.2 봉인 주문서 (돌돌 말린 양피지 두루마리 + 붉은 인장)
      return svgWrap(
        `
        <rect x="18" y="12" width="28" height="40" rx="4" fill="url(#${uid})" stroke="#92400e" stroke-width="2"/>
        <rect x="13" y="10" width="38" height="6" rx="3" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
        <rect x="13" y="48" width="38" height="6" rx="3" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
        <rect x="18" y="28" width="28" height="6" fill="#dc2626"/>
        <circle cx="32" cy="31" r="6" fill="#ef4444" stroke="#fde047" stroke-width="2"/>
      `,
        uid,
        "#fef3c7",
        "#d97706"
      );
    }
    if (level === 3) {
      // Lv.3 화염 마도서 (닫혀 있는 붉은 가죽 마도서 + 불꽃 문양)
      return svgWrap(
        `
        <rect x="15" y="10" width="34" height="44" rx="4" fill="url(#${uid})" stroke="#fde047" stroke-width="2.5"/>
        <rect x="12" y="10" width="6" height="44" rx="2" fill="#7f1d1d"/>
        <path d="M32 20 C32 20 42 28 38 38 C36 43 28 43 26 38 C22 28 32 20 32 20 Z" fill="#fde047"/>
        <circle cx="32" cy="36" r="4" fill="#ef4444"/>
      `,
        uid,
        "#ef4444",
        "#991b1b"
      );
    }
    if (level === 4) {
      // Lv.4 심연 백과사전 (양쪽으로 활짝 펼쳐진 푸른 마법 백과사전 + 빛나는 룬)
      return svgWrap(
        `
        <path d="M8 20 Q20 16 32 22 Q44 16 56 20 V48 Q44 44 32 50 Q20 44 8 48 Z" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2.5"/>
        <path d="M11 17 Q21 13 32 19 Q43 13 53 17 V44 Q43 40 32 46 Q21 40 11 44 Z" fill="#fef9c3" stroke="#d97706" stroke-width="1.5"/>
        <line x1="32" y1="19" x2="32" y2="46" stroke="#b45309" stroke-width="2"/>
        <!-- 페이지 위 떠오르는 마법 심볼 -->
        <polygon points="21,25 25,33 17,33" fill="#3b82f6"/>
        <circle cx="43" cy="29" r="4.5" fill="#8b5cf6"/>
        <circle cx="32" cy="11" r="3.5" fill="#38bdf8"/>
      `,
        uid,
        "#60a5fa",
        "#1e3a8a"
      );
    }
    if (level === 5) {
      // Lv.5 예언의 마도서/수정구 (황금 받침대 위의 거대한 예언의 수정구슬)
      return svgWrap(
        `
        <polygon points="18,46 46,46 52,54 12,54" fill="#d97706" stroke="#78350f" stroke-width="2"/>
        <rect x="22" y="42" width="20" height="5" rx="2" fill="#fbbf24"/>
        <circle cx="32" cy="26" r="17" fill="url(#${uid})" stroke="#f5d0fe" stroke-width="2.5"/>
        <!-- 수정구 내부 은하수 소용돌이 -->
        <path d="M22 26 Q32 14 42 26 Q32 38 22 26 Z" fill="none" stroke="#fde047" stroke-width="2.2"/>
        <circle cx="32" cy="26" r="4" fill="#ffffff"/>
      `,
        uid,
        "#c084fc",
        "#4c1d95"
      );
    }
    // Lv.6 태고 신화비석 (황금 후광과 고대 신의 눈이 새겨진 에메랄드 오벨리스크 비석)
    return svgWrap(
      `
      <circle cx="32" cy="28" r="22" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="4 3"/>
      <polygon points="32,6 46,18 42,54 22,54 18,18" fill="url(#${uid})" stroke="#fde047" stroke-width="2.5"/>
      <!-- 신화의 눈 -->
      <path d="M22 28 Q32 18 42 28 Q32 38 22 28 Z" fill="#fef08a" stroke="#92400e" stroke-width="1.5"/>
      <circle cx="32" cy="28" r="4" fill="#0284c7"/>
      <line x1="25" y1="42" x2="39" y2="42" stroke="#fde047" stroke-width="2.5"/>
      <line x1="27" y1="47" x2="37" y2="47" stroke="#fde047" stroke-width="2.5"/>
    `,
      uid,
      "#34d399",
      "#064e3b"
    );
  }

  // ==================== 3. 마법식물 체인 (Lv.1~6 모두 완전히 다른 디자인!) ====================
  function getHerbSVG(level) {
    const uid = `herb_${level}`;
    if (level === 1) {
      // Lv.1 야광 포자 (초록 두 잎 새싹)
      return svgWrap(
        `
        <ellipse cx="32" cy="50" rx="12" ry="5" fill="#78350f"/>
        <path d="M32 50 V26" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>
        <path d="M32 34 Q14 22 16 14 Q28 14 32 34 Z" fill="#4ade80" stroke="#166534" stroke-width="1.8"/>
        <path d="M32 30 Q50 18 48 10 Q36 10 32 30 Z" fill="#22c55e" stroke="#166534" stroke-width="1.8"/>
      `,
        uid,
        "#86efac",
        "#15803d"
      );
    }
    if (level === 2) {
      // Lv.2 몽환 달버섯 (점무늬 보라색 버섯)
      return svgWrap(
        `
        <path d="M25 34 H39 L41 52 H23 Z" fill="#fef3c7" stroke="#b45309" stroke-width="2"/>
        <path d="M12 36 C12 12 52 12 52 36 Z" fill="url(#${uid})" stroke="#ffffff" stroke-width="2.2"/>
        <circle cx="23" cy="26" r="3.5" fill="#fde047"/>
        <circle cx="38" cy="23" r="4" fill="#fde047"/>
        <circle cx="32" cy="31" r="2.5" fill="#ffffff"/>
      `,
        uid,
        "#c084fc",
        "#6b21a8"
      );
    }
    if (level === 3) {
      // Lv.3 만드라고라 (귀여운 얼굴이 달린 통통한 인삼 뿌리 + 머리 위 꽃)
      return svgWrap(
        `
        <!-- 머리 위 잎과 빨간 꽃 -->
        <path d="M32 22 Q20 12 22 18" stroke="#16a34a" stroke-width="3" fill="none"/>
        <path d="M32 22 Q44 12 42 18" stroke="#16a34a" stroke-width="3" fill="none"/>
        <circle cx="32" cy="12" r="5.5" fill="#f43f5e" stroke="#fecdd3" stroke-width="1.5"/>
        <!-- 만드라고라 몸통 -->
        <ellipse cx="32" cy="35" rx="13" ry="15" fill="url(#${uid})" stroke="#78350f" stroke-width="2"/>
        <!-- 양팔/뿌리 다리 -->
        <path d="M19 34 Q12 38 15 44" stroke="#b45309" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M45 34 Q52 38 49 44" stroke="#b45309" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <!-- 눈과 입 -->
        <circle cx="27" cy="32" r="2.2" fill="#1e293b"/>
        <circle cx="37" cy="32" r="2.2" fill="#1e293b"/>
        <circle cx="32" cy="38" r="3.5" fill="#ef4444"/>
      `,
        uid,
        "#fcd34d",
        "#b45309"
      );
    }
    if (level === 4) {
      // Lv.4 영혼 꽃나비 (화려한 네 날개를 펼친 신비한 나비)
      return svgWrap(
        `
        <!-- 윗날개 -->
        <path d="M32 30 C14 8 6 22 18 34 Z" fill="url(#${uid})" stroke="#ffffff" stroke-width="2"/>
        <path d="M32 30 C50 8 58 22 46 34 Z" fill="url(#${uid})" stroke="#ffffff" stroke-width="2"/>
        <!-- 아랫날개 -->
        <path d="M32 32 C14 36 14 54 28 46 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="1.8"/>
        <path d="M32 32 C50 36 50 54 36 46 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="1.8"/>
        <!-- 나비 몸통 & 더듬이 -->
        <rect x="30" y="20" width="4" height="24" rx="2" fill="#fde047"/>
        <path d="M31 20 Q25 12 22 14" stroke="#fde047" stroke-width="1.8" fill="none"/>
        <path d="M33 20 Q39 12 42 14" stroke="#fde047" stroke-width="1.8" fill="none"/>
      `,
        uid,
        "#f472b6",
        "#7e22ce"
      );
    }
    if (level === 5) {
      // Lv.5 불사조의 알 (화려한 둥지 위에 놓인 불꽃 문양 황금 알)
      return svgWrap(
        `
        <!-- 둥지 -->
        <ellipse cx="32" cy="48" rx="18" ry="6" fill="#92400e" stroke="#451a03" stroke-width="2"/>
        <!-- 알 -->
        <ellipse cx="32" cy="30" rx="14" ry="18" fill="url(#${uid})" stroke="#fde047" stroke-width="2.5"/>
        <path d="M24 34 Q32 20 40 34 Q32 28 24 34 Z" fill="#fef08a"/>
        <circle cx="32" cy="24" r="3.5" fill="#ffffff"/>
      `,
        uid,
        "#fb923c",
        "#dc2626"
      );
    }
    // Lv.6 스타 드래곤 (뿔과 날개가 달린 귀여운 아기 드래곤 캐릭터!)
    return svgWrap(
      `
      <!-- 양쪽 드래곤 날개 -->
      <path d="M18 32 L6 20 L10 36 L18 38 Z" fill="#f472b6" stroke="#9d174d" stroke-width="1.5"/>
      <path d="M46 32 L58 20 L54 36 L46 38 Z" fill="#f472b6" stroke="#9d174d" stroke-width="1.5"/>
      <!-- 황금 뿔 -->
      <polygon points="22,18 16,8 27,15" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>
      <polygon points="42,18 48,8 37,15" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>
      <!-- 드래곤 얼굴 & 몸통 -->
      <circle cx="32" cy="28" r="14" fill="url(#${uid})" stroke="#ffffff" stroke-width="2"/>
      <ellipse cx="32" cy="44" rx="11" ry="9" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>
      <!-- 초롱초롱한 눈 -->
      <circle cx="26" cy="26" r="3" fill="#1e1b4b"/>
      <circle cx="38" cy="26" r="3" fill="#1e1b4b"/>
      <circle cx="25" cy="25" r="1" fill="#ffffff"/>
      <circle cx="37" cy="25" r="1" fill="#ffffff"/>
      <!-- 이마의 별 보석 -->
      <polygon points="32,16 35,21 29,21" fill="#fde047"/>
    `,
      uid,
      "#a855f7",
      "#4c1d95"
    );
  }

  // ==================== 4. 화로 베이커리 체인 (Lv.1~6 모두 완전히 다른 디자인!) ====================
  function getBakerySVG(level) {
    const uid = `bak_${level}`;
    if (level === 1) {
      // Lv.1 밀가루 반죽 (나무 밀대와 반죽)
      return svgWrap(
        `
        <line x1="12" y1="26" x2="52" y2="14" stroke="#b45309" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="32" cy="40" rx="18" ry="12" fill="url(#${uid})" stroke="#d97706" stroke-width="2"/>
        <ellipse cx="26" cy="36" rx="5" ry="3" fill="#ffffff" opacity="0.65"/>
      `,
        uid,
        "#fef9c3",
        "#fde047"
      );
    }
    if (level === 2) {
      // Lv.2 버터 크루아상 (초승달 모양 결 크루아상)
      return svgWrap(
        `
        <path d="M12 40 C10 20 28 14 32 14 C36 14 54 20 52 40 C48 46 42 38 40 32 C36 28 28 28 24 32 C22 38 16 46 12 40 Z" fill="url(#${uid})" stroke="#92400e" stroke-width="2.2"/>
        <path d="M22 22 Q32 18 42 22" stroke="#fef08a" stroke-width="2" fill="none"/>
      `,
        uid,
        "#fbbf24",
        "#b45309"
      );
    }
    if (level === 3) {
      // Lv.3 베리 타르트 (파이나무 틀 + 커스터드 + 딸기 & 블루베리)
      return svgWrap(
        `
        <polygon points="12,34 52,34 45,50 19,50" fill="#d97706" stroke="#78350f" stroke-width="2"/>
        <ellipse cx="32" cy="34" rx="20" ry="6" fill="#fef08a" stroke="#b45309" stroke-width="1.5"/>
        <circle cx="24" cy="30" r="6" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
        <circle cx="38" cy="30" r="6" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
        <circle cx="31" cy="24" r="6.5" fill="#dc2626" stroke="#fff" stroke-width="1.5"/>
        <circle cx="20" cy="34" r="3.2" fill="#3b82f6"/>
        <circle cx="43" cy="34" r="3.2" fill="#3b82f6"/>
      `,
        uid,
        "#fca5a5",
        "#dc2626"
      );
    }
    if (level === 4) {
      // Lv.4 달빛 마카롱 (핑크·민트·옐로우 3단 마카롱 타워!)
      return svgWrap(
        `
        <!-- 하단 민트 마카롱 -->
        <rect x="14" y="39" width="36" height="12" rx="6" fill="#34d399" stroke="#065f46" stroke-width="1.8"/>
        <line x1="15" y1="45" x2="49" y2="45" stroke="#ffffff" stroke-width="3"/>
        <!-- 중단 옐로우 마카롱 -->
        <rect x="17" y="26" width="30" height="12" rx="6" fill="#fde047" stroke="#ca8a04" stroke-width="1.8"/>
        <line x1="18" y1="32" x2="46" y2="32" stroke="#ffffff" stroke-width="3"/>
        <!-- 상단 핑크 마카롱 -->
        <rect x="20" y="13" width="24" height="12" rx="6" fill="#f472b6" stroke="#be185d" stroke-width="1.8"/>
        <line x1="21" y1="19" x2="43" y2="19" stroke="#ffffff" stroke-width="3"/>
      `,
        uid,
        "#f472b6",
        "#db2777"
      );
    }
    if (level === 5) {
      // Lv.5 쇼트케이크 (삼각형 딸기 생크림 조각 케이크!)
      return svgWrap(
        `
        <polygon points="14,26 48,18 48,48 14,48" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
        <!-- 딸기잼 레이어 줄무늬 -->
        <line x1="15" y1="37" x2="47" y2="37" stroke="#f43f5e" stroke-width="4"/>
        <!-- 상단 하얀 생크림 지붕 -->
        <polygon points="12,26 48,16 50,26 14,30" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <!-- 꼭대기 통딸기 -->
        <path d="M32 8 C38 8 40 18 32 20 C24 18 26 8 32 8 Z" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
      `,
        uid,
        "#ffffff",
        "#fce7f3"
      );
    }
    // Lv.6 로얄 3단케이크 (황금 왕관이 올라간 화려한 3단 웨딩 케이크!)
    return svgWrap(
      `
      <rect x="10" y="40" width="44" height="14" rx="3" fill="#fce7f3" stroke="#db2777" stroke-width="2"/>
      <rect x="16" y="27" width="32" height="13" rx="3" fill="#fbcfe8" stroke="#db2777" stroke-width="2"/>
      <rect x="22" y="16" width="20" height="11" rx="2.5" fill="#ffffff" stroke="#f472b6" stroke-width="2"/>
      <!-- 골드 왕관 토퍼 -->
      <polygon points="24,16 26,7 32,12 38,7 40,16" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>
      <path d="M10 45 Q17 50 24 45 Q32 50 40 45 Q47 50 54 45" fill="none" stroke="#ec4899" stroke-width="2.5"/>
    `,
      uid,
      "#f472b6",
      "#9d174d"
    );
  }

  // ==================== 5. 연금술 티 & 카페 체인 (Lv.1~5 모두 완전히 다른 디자인!) ====================
  function getTeaSVG(level) {
    const uid = `tea_${level}`;
    if (level === 1) {
      // Lv.1 향긋한 찻잎
      return svgWrap(
        `
        <path d="M18 46 Q16 18 46 14 Q44 44 18 46 Z" fill="url(#${uid})" stroke="#065f46" stroke-width="2"/>
        <line x1="18" y1="46" x2="42" y2="18" stroke="#bbf7d0" stroke-width="2.5"/>
      `,
        uid,
        "#4ade80",
        "#15803d"
      );
    }
    if (level === 2) {
      // Lv.2 캐모마일 허브티 (받침 접시 + 노란 꽃이 떠 있는 납작한 찻잔)
      return svgWrap(
        `
        <ellipse cx="30" cy="48" rx="20" ry="4.5" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
        <path d="M44 30 H52 A5 5 0 0 1 52 40 H44" fill="none" stroke="#ffffff" stroke-width="3.5"/>
        <path d="M14 26 H46 C46 42 38 46 30 46 C22 46 14 42 14 26 Z" fill="url(#${uid})" stroke="#ffffff" stroke-width="2.2"/>
        <circle cx="30" cy="26" r="5" fill="#ffffff"/>
        <circle cx="30" cy="26" r="2.5" fill="#f59e0b"/>
      `,
        uid,
        "#fde047",
        "#d97706"
      );
    }
    if (level === 3) {
      // Lv.3 에스프레소 라떼 (원통형 브라운 머그컵 + 하트 라떼아트 + 김)
      return svgWrap(
        `
        <path d="M26 8 Q23 13 27 17" stroke="#cbd5e1" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M36 7 Q33 12 37 16" stroke="#cbd5e1" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M44 26 H52 A6 6 0 0 1 52 42 H44" fill="none" stroke="#d97706" stroke-width="4"/>
        <rect x="16" y="20" width="28" height="30" rx="5" fill="url(#${uid})" stroke="#fef3c7" stroke-width="2.2"/>
        <!-- 하트 마크 -->
        <path d="M30 39 C30 39 22 33 25 29 C27 26 30 29 30 29 C30 29 33 26 35 29 C38 33 30 39 30 39 Z" fill="#fef3c7"/>
      `,
        uid,
        "#92400e",
        "#451a03"
      );
    }
    if (level === 4) {
      // Lv.4 오로라 버블 밀크티 (길쭉한 테이크아웃 컵 + 핑크 빨대 + 까만 타피오카 펄!)
      return svgWrap(
        `
        <line x1="36" y1="6" x2="30" y2="26" stroke="#ec4899" stroke-width="4.5" stroke-linecap="round"/>
        <polygon points="18,18 46,18 42,54 22,54" fill="url(#${uid})" stroke="#ffffff" stroke-width="2.2"/>
        <rect x="16" y="15" width="32" height="5" rx="2.5" fill="#f472b6"/>
        <!-- 타피오카 버블 펄 -->
        <circle cx="26" cy="48" r="2.8" fill="#1e1b4b"/>
        <circle cx="32" cy="49" r="2.8" fill="#1e1b4b"/>
        <circle cx="38" cy="48" r="2.8" fill="#1e1b4b"/>
        <circle cx="29" cy="43" r="2.6" fill="#1e1b4b"/>
        <circle cx="35" cy="43" r="2.6" fill="#1e1b4b"/>
      `,
        uid,
        "#c084fc",
        "#38bdf8"
      );
    }
    // Lv.5 황실 티세트 (2단 애프터눈 티 트레이 스탠드!)
    return svgWrap(
      `
      <line x1="32" y1="10" x2="32" y2="54" stroke="#fbbf24" stroke-width="3.5"/>
      <circle cx="32" cy="10" r="4" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>
      <!-- 상단 트레이 & 디저트 -->
      <ellipse cx="32" cy="26" rx="16" ry="4" fill="#38bdf8" stroke="#fde047" stroke-width="2"/>
      <circle cx="25" cy="22" r="4" fill="#f472b6"/>
      <circle cx="39" cy="22" r="4" fill="#fde047"/>
      <!-- 하단 트레이 & 티포트 -->
      <ellipse cx="32" cy="46" rx="22" ry="5" fill="#0284c7" stroke="#fde047" stroke-width="2"/>
      <circle cx="24" cy="41" r="5" fill="#a855f7"/>
      <circle cx="40" cy="41" r="5" fill="#34d399"/>
      <rect x="24" y="52" width="16" height="4" rx="2" fill="#d97706"/>
    `,
      uid,
      "#38bdf8",
      "#1d4ed8"
    );
  }

  // ==================== 6. 별빛 보석 체인 (Lv.1~5 모두 완전히 다른 디자인!) ====================
  function getGemSVG(level) {
    const uid = `gem_${level}`;
    if (level === 1) {
      // Lv.1 원석 파편 (바위에서 솟아난 크리스탈 조각 2개)
      return svgWrap(
        `
        <ellipse cx="32" cy="48" rx="18" ry="7" fill="#64748b" stroke="#334155" stroke-width="2"/>
        <polygon points="22,46 18,22 26,14 32,46" fill="#38bdf8" stroke="#bae6fd" stroke-width="1.8"/>
        <polygon points="30,46 36,18 46,24 42,46" fill="#0284c7" stroke="#bae6fd" stroke-width="1.8"/>
      `,
        uid,
        "#93c5fd",
        "#1d4ed8"
      );
    }
    if (level === 2) {
      // Lv.2 사파이어 (물방울 컷팅된 푸른 사파이어)
      return svgWrap(
        `
        <polygon points="32,8 50,32 42,52 22,52 14,32" fill="url(#${uid})" stroke="#ffffff" stroke-width="2.5"/>
        <polygon points="32,16 42,32 37,45 27,45 22,32" fill="rgba(255,255,255,0.35)"/>
      `,
        uid,
        "#38bdf8",
        "#1e3a8a"
      );
    }
    if (level === 3) {
      // Lv.3 문스톤 반지 (황금 링 + 보라색 보석 알)
      return svgWrap(
        `
        <circle cx="32" cy="38" r="14" fill="none" stroke="#fbbf24" stroke-width="6"/>
        <polygon points="22,22 32,10 42,22 37,28 27,28" fill="url(#${uid})" stroke="#ffffff" stroke-width="2"/>
      `,
        uid,
        "#e879f9",
        "#6b21a8"
      );
    }
    if (level === 4) {
      // Lv.4 태양석 목걸이 (황금 체인 + 태양 펜던트)
      return svgWrap(
        `
        <path d="M14 12 C14 36 50 36 50 12" fill="none" stroke="#fde047" stroke-width="3" stroke-dasharray="4 2"/>
        <circle cx="32" cy="40" r="13" fill="url(#${uid})" stroke="#fde047" stroke-width="3"/>
        <circle cx="32" cy="40" r="6" fill="#fef08a"/>
      `,
        uid,
        "#f97316",
        "#b91c1c"
      );
    }
    // Lv.5 여왕의 티아라 (다이아몬드와 루비가 박힌 황실 왕관!)
    return svgWrap(
      `
      <polygon points="8,44 14,18 26,30 32,10 38,30 50,18 56,44" fill="url(#${uid})" stroke="#92400e" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="8" y="44" width="48" height="7" rx="3" fill="#d97706" stroke="#78350f" stroke-width="1.8"/>
      <circle cx="32" cy="34" r="5" fill="#ec4899" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="19" cy="37" r="3.5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
      <circle cx="45" cy="37" r="3.5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
    `,
      uid,
      "#fde047",
      "#d97706"
    );
  }

  function getComboSVG(level) {
    const uid = `cmb_${level}`;
    if (level === 1) {
      return svgWrap(
        `
        <circle cx="32" cy="34" r="18" fill="url(#${uid})" stroke="#fde047" stroke-width="3"/>
        <polygon points="32,16 36,28 48,28 38,35 42,47 32,40 22,47 26,35 16,28 28,28" fill="#ffffff"/>
      `,
        uid,
        "#34d399",
        "#059669"
      );
    }
    if (level === 2) {
      return svgWrap(
        `
        <ellipse cx="32" cy="36" rx="22" ry="14" fill="#ffffff" stroke="#f59e0b" stroke-width="3"/>
        <path d="M16 36 Q24 22 34 32" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>
        <circle cx="41" cy="34" r="7" fill="#78350f" stroke="#fde68a" stroke-width="2"/>
      `,
        uid,
        "#fef3c7",
        "#f59e0b"
      );
    }
    return svgWrap(
      `
      <polygon points="32,8 54,32 32,56 10,32" fill="url(#${uid})" stroke="#fde047" stroke-width="3"/>
      <circle cx="32" cy="32" r="9" fill="#fef08a"/>
    `,
      uid,
      "#60a5fa",
      "#3b0764"
    );
  }

  function getCoinSVG(level) {
    const uid = `coin_${level}`;
    if (level === 1) {
      return svgWrap(
        `
        <circle cx="32" cy="32" r="16" fill="url(#${uid})" stroke="#fef08a" stroke-width="2.5"/>
        <circle cx="32" cy="32" r="11" fill="none" stroke="#92400e" stroke-width="1.5"/>
        <text x="32" y="37" text-anchor="middle" fill="#78350f" font-size="15" font-weight="900">G</text>
      `,
        uid,
        "#fde047",
        "#d97706"
      );
    }
    if (level === 2) {
      return svgWrap(
        `
        <circle cx="24" cy="34" r="13" fill="url(#${uid})" stroke="#fef08a" stroke-width="2"/>
        <circle cx="38" cy="30" r="14" fill="url(#${uid})" stroke="#fef08a" stroke-width="2"/>
        <circle cx="32" cy="40" r="13" fill="url(#${uid})" stroke="#fef08a" stroke-width="2"/>
      `,
        uid,
        "#fde047",
        "#ca8a04"
      );
    }
    return svgWrap(
      `
      <rect x="12" y="24" width="40" height="26" rx="4" fill="#b45309" stroke="#fde047" stroke-width="2.5"/>
      <path d="M12 26 Q32 12 52 26 Z" fill="url(#${uid})" stroke="#fde047" stroke-width="2.5"/>
      <rect x="28" y="28" width="8" height="10" rx="2" fill="#fde047"/>
    `,
      uid,
      "#f59e0b",
      "#78350f"
    );
  }

  function getEnergySVG(level) {
    const uid = `en_${level}`;
    if (level === 1) {
      return svgWrap(
        `
        <polygon points="35,12 20,34 31,34 28,52 44,30 33,30" fill="url(#${uid})" stroke="#ffffff" stroke-width="2"/>
      `,
        uid,
        "#67e8f9",
        "#0284c7"
      );
    }
    if (level === 2) {
      return svgWrap(
        `
        <polygon points="32,8 48,26 40,52 24,52 16,26" fill="url(#${uid})" stroke="#ffffff" stroke-width="2"/>
        <polygon points="34,16 24,32 32,32 29,46 41,28 33,28" fill="#fef08a"/>
      `,
        uid,
        "#38bdf8",
        "#1d4ed8"
      );
    }
    return svgWrap(
      `
      <circle cx="32" cy="32" r="20" fill="url(#${uid})" stroke="#fde047" stroke-width="3"/>
      <polygon points="35,12 20,34 31,34 28,52 44,30 33,30" fill="#fef08a" stroke="#ffffff" stroke-width="1.5"/>
    `,
      uid,
      "#22d3ee",
      "#3b0764"
    );
  }

  function getCrateSVG() {
    return svgWrap(
      `
      <rect x="10" y="12" width="44" height="42" rx="6" fill="url(#crateG)" stroke="#451a03" stroke-width="2.5"/>
      <line x1="10" y1="24" x2="54" y2="24" stroke="#451a03" stroke-width="2"/>
      <line x1="10" y1="40" x2="54" y2="40" stroke="#451a03" stroke-width="2"/>
      <line x1="14" y1="14" x2="50" y2="50" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="14" x2="14" y2="50" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="7" fill="#fbbf24" stroke="#451a03" stroke-width="2"/>
    `,
      "crateG",
      "#b45309",
      "#78350f"
    );
  }

  return {
    getItemSVG,
    getCrateSVG,
  };
})();
