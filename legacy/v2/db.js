// db.js — IndexedDB + LocalStorage 이중 영구 저장소 & 버전 호환 마이그레이션 엔진
// 앱 업데이트나 새로고침, 재설치 시에도 유저의 진행도(레벨, 코인, 번개, 보드 타일, 마녀의 성 3D 복구 상태, 명절 이벤트 보드)가 절대 깨지지 않도록 보장합니다.

window.GameDB = (function () {
  const DB_NAME = "CrownGossipMergeDB";
  const DB_VERSION = 2;
  const STORE_NAME = "player_progress";
  const SAVE_KEY = "main_save_v1";
  const LS_BACKUP_KEY = "crown_gossip_save_backup_v1";

  // Gossip Harbor 표준 번개(⚡) 자연 회복 규칙: 최대 100개까지 5분(300초)당 1개 충전
  const NATURAL_ENERGY_CAP = 100;
  const ENERGY_REGEN_INTERVAL_SEC = 300; // 5분 = 300초

  let dbInstance = null;

  function openDB() {
    return new Promise((resolve) => {
      if (dbInstance) return resolve(dbInstance);
      if (!window.indexedDB) return resolve(null);

      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id" });
          }
        };
        req.onsuccess = (e) => {
          dbInstance = e.target.result;
          resolve(dbInstance);
        };
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  // 데이터 저장 (IndexedDB 비동기 저장 + LocalStorage 즉시 동기 미러링)
  async function saveProgress(payload) {
    const record = {
      id: SAVE_KEY,
      schemaVersion: 3,
      updatedAt: Date.now(),
      data: payload,
    };

    // 1. LocalStorage 즉시 백업 (브라우저 강제 종료 대비)
    try {
      localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(record));
    } catch (e) {
      // 용량 초과 등 예외 무시
    }

    // 2. IndexedDB 영구 저장
    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(record);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  // 데이터 로드 (IndexedDB 우선, 실패 또는 최신본 비교 후 LocalStorage 폴백)
  async function loadProgress() {
    let idbRecord = null;
    let lsRecord = null;

    try {
      const raw = localStorage.getItem(LS_BACKUP_KEY);
      if (raw) lsRecord = JSON.parse(raw);
    } catch (e) {}

    const db = await openDB();
    if (db) {
      idbRecord = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(SAVE_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }

    // 두 저장소 중 더 최신(updatedAt 기준) 데이터를 채택
    let chosen = null;
    if (idbRecord && lsRecord) {
      chosen = (idbRecord.updatedAt || 0) >= (lsRecord.updatedAt || 0) ? idbRecord : lsRecord;
    } else {
      chosen = idbRecord || lsRecord;
    }

    if (!chosen || !chosen.data) return null;
    return chosen;
  }

  // 스키마 마이그레이션 & 병합: 게임 코드가 업데이트되어 새로운 체인/방/이벤트가 추가되어도 기존 세이브 데이터를 안전하게 보존
  function mergeWithDefaultState(defaultState, savedRecord, validChains, totalCells) {
    if (!savedRecord || !savedRecord.data) return { merged: false };
    const saved = savedRecord.data;

    // 1. 기본 수치 복원 (NaN이나 범위 이탈 방어)
    if (typeof saved.playerLv === "number" && saved.playerLv >= 1) {
      defaultState.playerLv = Math.floor(saved.playerLv);
    }
    if (typeof saved.xp === "number" && saved.xp >= 0) {
      defaultState.xp = Math.floor(saved.xp);
    }
    defaultState.maxEnergy = NATURAL_ENERGY_CAP; // 자연 회복 상한선 100⚡ 고정

    if (typeof saved.coins === "number" && saved.coins >= 0) {
      defaultState.coins = Math.floor(saved.coins);
    }
    // v2.5.0: 🌟 별 폐지 — 남아 있던 별은 1🌟 = 100🪙로 환산 (환산 후 저장본엔 stars가 없으므로 한 번만 일어남)
    const convertedStarCoins = window.GameProgression ? window.GameProgression.convertLegacyStars(saved.stars) : 0;
    if (convertedStarCoins > 0) {
      defaultState.coins += convertedStarCoins;
    }
    if (typeof saved.gems === "number" && saved.gems >= 0) {
      defaultState.gems = Math.floor(saved.gems);
    }
    if (typeof saved.energy === "number" && saved.energy >= 0) {
      defaultState.energy = Math.floor(saved.energy);
    }
    if (typeof saved.energyCountdown === "number" && saved.energyCountdown > 0 && saved.energyCountdown <= ENERGY_REGEN_INTERVAL_SEC) {
      defaultState.energyCountdown = Math.floor(saved.energyCountdown);
    } else {
      defaultState.energyCountdown = ENERGY_REGEN_INTERVAL_SEC;
    }

    // 오프라인 경과 시간 동안 번개(⚡) 자동 회복 계산 (5분=300초당 +1 번개, 최대 100개까지 자연 충전)
    const elapsedSec = Math.max(0, Math.floor((Date.now() - (savedRecord.updatedAt || Date.now())) / 1000));
    if (defaultState.energy < NATURAL_ENERGY_CAP && elapsedSec > 0) {
      const totalWaitNeeded = defaultState.energyCountdown;
      if (elapsedSec >= totalWaitNeeded) {
        const remainingAfterFirst = elapsedSec - totalWaitNeeded;
        const recovered = 1 + Math.floor(remainingAfterFirst / ENERGY_REGEN_INTERVAL_SEC);
        defaultState.energy = Math.min(NATURAL_ENERGY_CAP, defaultState.energy + recovered);
        defaultState.energyCountdown =
          defaultState.energy >= NATURAL_ENERGY_CAP
            ? ENERGY_REGEN_INTERVAL_SEC
            : ENERGY_REGEN_INTERVAL_SEC - (remainingAfterFirst % ENERGY_REGEN_INTERVAL_SEC);
      } else {
        defaultState.energyCountdown = Math.max(1, totalWaitNeeded - elapsedSec);
      }
    } else if (defaultState.energy >= NATURAL_ENERGY_CAP) {
      defaultState.energyCountdown = ENERGY_REGEN_INTERVAL_SEC;
    }

    // 2. 보드 타일 안전 복원 (유효한 체인인지 검증하고, 필수 생성기가 누락되었으면 자동 보충!)
    if (Array.isArray(saved.board) && saved.board.length === totalCells) {
      const restoredBoard = new Array(totalCells).fill(null);
      for (let i = 0; i < totalCells; i++) {
        const cell = saved.board[i];
        if (cell && cell.chain && validChains[cell.chain]) {
          const maxLv = cell.isGenerator
            ? 3
            : validChains[cell.chain].items
            ? validChains[cell.chain].items.length
            : 1;
          restoredBoard[i] = {
            uid: cell.uid || "restored_" + i + "_" + Date.now(),
            state: ["crate", "cobweb", "active"].includes(cell.state) ? cell.state : "active",
            isGenerator: !!cell.isGenerator,
            chain: cell.chain,
            level: Math.max(1, Math.min(maxLv, cell.level || 1)),
          };
        }
      }

      // 필수 생성기(potion, grimoire, herb, bakery, tea)가 보드에 없다면 빈 칸에 자동 지급
      const requiredGenerators = ["potion", "grimoire", "herb", "bakery", "tea"];
      for (const reqGen of requiredGenerators) {
        const exists = restoredBoard.some((it) => it && it.isGenerator && it.chain === reqGen);
        if (!exists) {
          const emptyIdx = restoredBoard.findIndex((it) => it === null);
          if (emptyIdx !== -1) {
            restoredBoard[emptyIdx] = {
              uid: "gen_auto_" + reqGen,
              state: "active",
              isGenerator: true,
              chain: reqGen,
              level: 1,
            };
          }
        }
      }

      // 가마솥 생성기 합성을 바로 체험해볼 수 있도록, 아직 가마솥이 Lv.1 1개뿐이고 v2.4.0 첫 진입이면 보조 가마솥 Lv.1 지급
      const cauldronCount = restoredBoard.filter((it) => it && it.isGenerator && it.chain === "potion").length;
      const hasLv2Cauldron = restoredBoard.some((it) => it && it.isGenerator && it.chain === "potion" && it.level >= 2);
      if (cauldronCount === 1 && !hasLv2Cauldron && !saved.cauldronPartGranted) {
        const emptyIdx = restoredBoard.findIndex((it) => it === null);
        if (emptyIdx !== -1) {
          restoredBoard[emptyIdx] = {
            uid: "gen_bonus_potion_" + Date.now(),
            state: "active",
            isGenerator: true,
            chain: "potion",
            level: 1,
          };
          defaultState.cauldronPartGranted = true;
        }
      } else if (saved.cauldronPartGranted) {
        defaultState.cauldronPartGranted = true;
      }

      defaultState.board = restoredBoard;
    }

    // 3. 인벤토리 보관함(bag) 복원
    if (Array.isArray(saved.bag)) {
      defaultState.bag = saved.bag
        .filter((it) => it && it.chain && validChains[it.chain])
        .slice(0, 6);
    }

    // 4. 손님 주문(orders) 복원
    if (Array.isArray(saved.orders) && saved.orders.length === 3) {
      const validOrders = saved.orders.every(
        (o) =>
          o &&
          o.customer &&
          Array.isArray(o.reqs) &&
          o.reqs.every((r) => r && validChains[r.chain])
      );
      if (validOrders) {
        defaultState.orders = saved.orders;
      }
    }

    // 5. 명절 팝업 이벤트 상태(eventState) 복원
    if (saved.eventState && typeof saved.eventState === "object") {
      defaultState.eventState = {
        ...defaultState.eventState,
        ...saved.eventState,
      };
    }

    if (typeof saved.soundEnabled === "boolean") {
      defaultState.soundEnabled = saved.soundEnabled;
    }

    // v2.5.0 배속 부스트 선택값 (1·2·4 외 값은 1로)
    defaultState.boostMultiplier = window.GameProgression
      ? window.GameProgression.sanitizeBoost(saved.boostMultiplier)
      : 1;

    return {
      merged: true,
      convertedStarCoins,
      interiorRooms: saved.interiorRooms || null,
      currentThemeKey: saved.currentThemeKey || "alchemy",
      lastSeenVersion: saved.lastSeenVersion || null,
      updatedAt: savedRecord.updatedAt,
    };
  }

  // 세이브 파일 JSON 문자열 내보내기 / 가져오기 (기기 변경 시 백업용)
  async function exportBackupString() {
    const rec = await loadProgress();
    if (!rec) return "";
    return btoa(encodeURIComponent(JSON.stringify(rec)));
  }

  async function importBackupString(str) {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(str.trim())));
      if (!decoded || !decoded.data) return false;
      await saveProgress(decoded.data);
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    NATURAL_ENERGY_CAP,
    ENERGY_REGEN_INTERVAL_SEC,
    saveProgress,
    loadProgress,
    mergeWithDefaultState,
    exportBackupString,
    importBackupString,
  };
})();
