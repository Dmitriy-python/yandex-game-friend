// Yandex Games SDK save/load system with localStorage fallback

export interface SaveData {
  highScore: number;
  highWave: number;
  coins: number;
  upgrades: Record<string, number>; // upgrade id -> level
}

const DEFAULT_SAVE: SaveData = {
  highScore: 0,
  highWave: 0,
  coins: 0,
  upgrades: {},
};

const LOCAL_KEY = 'survivor_save';

let ysdk: any = null;
let player: any = null;
let sdkReady = false;

export async function initYandexSDK(): Promise<void> {
  try {
    if (typeof (window as any).YaGames !== 'undefined') {
      ysdk = await (window as any).YaGames.init();
      try {
        player = await ysdk.getPlayer({ scopes: false });
        sdkReady = true;
        console.log('Yandex SDK initialized');
      } catch {
        console.warn('Yandex player not available, using localStorage');
      }
    }
  } catch (e) {
    console.warn('Yandex SDK not available, using localStorage', e);
  }
}

export async function loadSave(): Promise<SaveData> {
  // Try Yandex SDK first
  if (sdkReady && player) {
    try {
      const data = await player.getData();
      if (data && typeof data.highScore === 'number') {
        return { ...DEFAULT_SAVE, ...data };
      }
    } catch (e) {
      console.warn('Failed to load from Yandex SDK', e);
    }
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SAVE, ...parsed };
    }
  } catch {}

  return { ...DEFAULT_SAVE };
}

export async function saveSaveData(data: SaveData): Promise<void> {
  // Save to Yandex SDK
  if (sdkReady && player) {
    try {
      await player.setData(data);
    } catch (e) {
      console.warn('Failed to save to Yandex SDK', e);
    }
  }

  // Always save to localStorage as backup
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {}
}

// Leaderboard integration
export async function setLeaderboardScore(score: number): Promise<void> {
  if (!sdkReady || !ysdk) return;
  try {
    const lb = await ysdk.getLeaderboards();
    await lb.setLeaderboardScore('main', score);
  } catch {}
}
