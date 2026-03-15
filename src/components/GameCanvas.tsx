import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import { createInitialState, updateGame } from '@/game/logic';
import { renderGame } from '@/game/renderer';
import { processGameEvents, startMusic, stopMusic } from '@/game/audio';
import { GameState, GameScreen, CharacterClass } from '@/game/types';
import { SaveData, initYandexSDK, loadSave, saveSaveData, setLeaderboardScore } from '@/game/save';
import { applyShopUpgrades } from '@/game/shopUpgrades';
import LoadingScreen from './game/LoadingScreen';
import MainMenu from './game/MainMenu';
import PauseMenu from './game/PauseMenu';
import SettingsMenu from './game/SettingsMenu';
import CharacterSelect from './game/CharacterSelect';
import UpgradeShop from './game/UpgradeShop';
import GameHUD from './game/GameHUD';
import UpgradeModal from './game/UpgradeModal';
import GameOverScreen from './game/GameOverScreen';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const saveDataRef = useRef<SaveData>({ highScore: 0, highWave: 0, coins: 0, upgrades: {}, unlockedCharacters: ['fighter'] });
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('fighter');
  const [saveData, setSaveData] = useState<SaveData>({ highScore: 0, highWave: 0, coins: 0, upgrades: {}, unlockedCharacters: ['fighter'] });
  const [uiState, setUiState] = useState({
    hp: 100, maxHp: 100, xp: 0, xpToNext: 10, level: 1,
    score: 0, wave: 1, time: 0, gameOver: false,
    pendingUpgrade: false, upgradeOptions: [] as GameState['upgradeOptions'],
    enemyCount: 0, isBossWave: false, isBossReward: false, coins: 0,
    abilityTimer: 0, abilityCooldown: 6, characterClass: 'fighter' as CharacterClass,
    shieldActive: false,
  });

  // Keep saveDataRef in sync
  useEffect(() => { saveDataRef.current = saveData; }, [saveData]);

  // Load save data on mount
  useEffect(() => {
    (async () => {
      await initYandexSDK();
      const data = await loadSave();
      setSaveData(data);
    })();
  }, []);

  // Keyboard handling
  useEffect(() => {
    const gameKeys = new Set(['w','a','s','d','escape',' ']);
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (gameKeys.has(key)) e.preventDefault();
      keysRef.current.add(key);
      if (key === 'escape') {
        setScreen(prev => {
          if (prev === 'playing') { stateRef.current.paused = true; return 'paused'; }
          if (prev === 'paused') { stateRef.current.paused = false; return 'playing'; }
          return prev;
        });
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down, { capture: true });
    window.addEventListener('keyup', up, { capture: true });
    return () => { window.removeEventListener('keydown', down, { capture: true }); window.removeEventListener('keyup', up, { capture: true }); };
  }, []);

  // Canvas resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Persist save helper
  const persistSave = useCallback(async (data: SaveData) => {
    setSaveData(data);
    saveDataRef.current = data;
    await saveSaveData(data);
  }, []);

  // Game loop
  useGameLoop((dt) => {
    if (screen !== 'playing' && screen !== 'paused') return;

    const keys = keysRef.current;
    let dx = 0, dy = 0;
    if (keys.has('w')) dy -= 1;
    if (keys.has('s')) dy += 1;
    if (keys.has('a')) dx -= 1;
    if (keys.has('d')) dx += 1;

    stateRef.current = updateGame(stateRef.current, dt, { dx, dy });

    if (stateRef.current.events.length > 0) {
      processGameEvents(stateRef.current.events);
      stateRef.current.events = [];
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGame(ctx, stateRef.current, canvas.width, canvas.height);

    const s = stateRef.current;

    // Game over — save ONCE using coinsSaved guard
    if (s.gameOver && !s.coinsSaved) {
      s.coinsSaved = true;
      const sd = saveDataRef.current;
      const totalCoins = sd.coins + s.coins;
      const newHighScore = s.score > sd.highScore ? s.score : sd.highScore;
      const newHighWave = s.wave > sd.highWave ? s.wave : sd.highWave;
      persistSave({ ...sd, coins: totalCoins, highScore: newHighScore, highWave: newHighWave });
      setLeaderboardScore(s.score);
      stopMusic();
    }

    setUiState({
      hp: s.player.hp, maxHp: s.player.maxHp,
      xp: s.player.xp, xpToNext: s.player.xpToNext,
      level: s.player.level, score: s.score,
      wave: s.wave, time: s.time, gameOver: s.gameOver,
      pendingUpgrade: s.pendingUpgrade,
      upgradeOptions: s.upgradeOptions,
      enemyCount: s.enemies.length,
      isBossWave: s.isBossWave && !s.bossWaveCleared,
      isBossReward: s.upgradeOptions.some(o => o.id.startsWith('boss_')),
      coins: s.coins,
      abilityTimer: s.player.abilityTimer,
      abilityCooldown: s.player.abilityCooldown,
      characterClass: s.player.characterClass,
      shieldActive: s.player.shieldActive,
    });
  });

  const handleUpgrade = useCallback((id: string) => {
    const s = stateRef.current;
    const opt = s.upgradeOptions.find(o => o.id === id);
    if (opt) {
      opt.apply(s);
      s.pendingUpgrade = false;
      s.upgradeOptions = [];
    }
  }, []);

  const handleStartGame = useCallback(() => {
    const state = createInitialState(selectedClass);
    applyShopUpgrades(saveDataRef.current.upgrades, state.player);
    state.player.hp = state.player.maxHp;
    stateRef.current = state;
    setScreen('playing');
    startMusic();
  }, [selectedClass]);

  const handleResume = useCallback(() => {
    stateRef.current.paused = false;
    setScreen('playing');
  }, []);

  const handleMainMenu = useCallback(() => {
    // Only save coins if game wasn't already over (coins already saved on game over)
    const s = stateRef.current;
    if (!s.coinsSaved && s.coins > 0) {
      const sd = saveDataRef.current;
      persistSave({ ...sd, coins: sd.coins + s.coins });
    }
    stopMusic();
    stateRef.current = createInitialState();
    setScreen('menu');
  }, [persistSave]);

  const handleBuyUpgrade = useCallback((id: string, cost: number) => {
    const sd = saveDataRef.current;
    const newUpgrades = { ...sd.upgrades, [id]: (sd.upgrades[id] || 0) + 1 };
    const newData = { ...sd, coins: sd.coins - cost, upgrades: newUpgrades };
    persistSave(newData);
  }, [persistSave]);

  const handleUnlockCharacter = useCallback((charId: string, cost: number) => {
    const sd = saveDataRef.current;
    if (sd.coins < cost || sd.unlockedCharacters.includes(charId)) return;
    const newData = {
      ...sd,
      coins: sd.coins - cost,
      unlockedCharacters: [...sd.unlockedCharacters, charId],
    };
    persistSave(newData);
    setSelectedClass(charId as CharacterClass);
  }, [persistSave]);

  if (screen === 'loading') {
    return <LoadingScreen onLoaded={() => setScreen('menu')} />;
  }

  if (screen === 'menu') {
    return <MainMenu highScore={saveData.highScore} highWave={saveData.highWave} coins={saveData.coins}
      onPlay={handleStartGame} onCharacterSelect={() => setScreen('character_select')}
      onShop={() => setScreen('shop')} onSettings={() => setScreen('settings')} />;
  }

  if (screen === 'settings') {
    return <SettingsMenu onBack={() => setScreen('menu')} />;
  }

  if (screen === 'character_select') {
    return <CharacterSelect selected={selectedClass} onSelect={setSelectedClass}
      onUnlock={handleUnlockCharacter} unlockedCharacters={saveData.unlockedCharacters}
      coins={saveData.coins} onBack={() => setScreen('menu')} />;
  }

  if (screen === 'shop') {
    return <UpgradeShop coins={saveData.coins} upgrades={saveData.upgrades}
      onBuy={handleBuyUpgrade} onBack={() => setScreen('menu')} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#1a1f2e' }}>
      <canvas ref={canvasRef} className="block" />

      <GameHUD {...uiState} />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs pointer-events-none"
        style={{ color: 'rgba(148,163,184,0.5)' }}>
        WASD / Стрелки • Авто-атака • ESC пауза
      </div>

      {screen === 'paused' && (
        <PauseMenu onResume={handleResume} onMainMenu={handleMainMenu} />
      )}

      {uiState.pendingUpgrade && !uiState.gameOver && (
        <UpgradeModal level={uiState.level} options={uiState.upgradeOptions}
          isBossReward={uiState.isBossReward} onSelect={handleUpgrade} />
      )}

      {uiState.gameOver && (
        <GameOverScreen score={uiState.score} level={uiState.level}
          wave={uiState.wave} time={uiState.time}
          onRestart={handleStartGame} onMainMenu={handleMainMenu} />
      )}
    </div>
  );
}
