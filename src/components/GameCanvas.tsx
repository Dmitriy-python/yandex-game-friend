import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import { createInitialState, updateGame } from '@/game/logic';
import { renderGame } from '@/game/renderer';
import { processGameEvents, startMusic, stopMusic } from '@/game/audio';
import { GameState, GameScreen, CharacterClass } from '@/game/types';
import LoadingScreen from './game/LoadingScreen';
import MainMenu from './game/MainMenu';
import PauseMenu from './game/PauseMenu';
import SettingsMenu from './game/SettingsMenu';
import CharacterSelect from './game/CharacterSelect';
import GameHUD from './game/GameHUD';
import UpgradeModal from './game/UpgradeModal';
import GameOverScreen from './game/GameOverScreen';

const HIGH_SCORE_KEY = 'survivor_high_score';
const HIGH_WAVE_KEY = 'survivor_high_wave';

function loadHighScore(): { score: number; wave: number } {
  try {
    return {
      score: parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0'),
      wave: parseInt(localStorage.getItem(HIGH_WAVE_KEY) || '0'),
    };
  } catch { return { score: 0, wave: 0 }; }
}

function saveHighScore(score: number, wave: number) {
  try {
    const prev = loadHighScore();
    if (wave > prev.wave || (wave === prev.wave && score > prev.score)) {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
      localStorage.setItem(HIGH_WAVE_KEY, String(wave));
    }
  } catch {}
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('fighter');
  const [highScoreData, setHighScoreData] = useState(loadHighScore);
  const [uiState, setUiState] = useState({
    hp: 100, maxHp: 100, xp: 0, xpToNext: 10, level: 1,
    score: 0, wave: 1, time: 0, gameOver: false,
    pendingUpgrade: false, upgradeOptions: [] as GameState['upgradeOptions'],
    enemyCount: 0, isBossWave: false, isBossReward: false,
  });

  // Keyboard handling
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      if (key === 'escape') {
        setScreen(prev => {
          if (prev === 'playing') {
            stateRef.current.paused = true;
            return 'paused';
          }
          if (prev === 'paused') {
            stateRef.current.paused = false;
            return 'playing';
          }
          return prev;
        });
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
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

  // Game loop
  useGameLoop((dt) => {
    if (screen !== 'playing' && screen !== 'paused') return;

    const keys = keysRef.current;
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;

    stateRef.current = updateGame(stateRef.current, dt, { dx, dy });

    // Process audio events
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

    // Check game over - save high score
    if (s.gameOver && screen === 'playing') {
      saveHighScore(s.score, s.wave);
      setHighScoreData(loadHighScore());
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
    stateRef.current = createInitialState(selectedClass);
    setScreen('playing');
    startMusic();
  }, [selectedClass]);

  const handleResume = useCallback(() => {
    stateRef.current.paused = false;
    setScreen('playing');
  }, []);

  const handleMainMenu = useCallback(() => {
    stopMusic();
    stateRef.current = createInitialState();
    setScreen('menu');
    setHighScoreData(loadHighScore());
  }, []);

  // Loading screen
  if (screen === 'loading') {
    return <LoadingScreen onLoaded={() => setScreen('menu')} />;
  }

  // Main menu
  if (screen === 'menu') {
    return <MainMenu highScore={highScoreData.score} highWave={highScoreData.wave}
      onPlay={handleStartGame} onCharacterSelect={() => setScreen('character_select')}
      onSettings={() => setScreen('settings')} />;
  }

  // Settings
  if (screen === 'settings') {
    return <SettingsMenu onBack={() => setScreen('menu')} />;
  }

  // Character select
  if (screen === 'character_select') {
    return <CharacterSelect selected={selectedClass} onSelect={setSelectedClass} onBack={() => setScreen('menu')} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#1a1f2e' }}>
      <canvas ref={canvasRef} className="block" />

      <GameHUD {...uiState} />

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs pointer-events-none"
        style={{ color: 'rgba(148,163,184,0.5)' }}>
        WASD / Стрелки • Авто-атака • ESC пауза
      </div>

      {/* Pause */}
      {screen === 'paused' && (
        <PauseMenu onResume={handleResume} onMainMenu={handleMainMenu} />
      )}

      {/* Upgrade modal */}
      {uiState.pendingUpgrade && !uiState.gameOver && (
        <UpgradeModal level={uiState.level} options={uiState.upgradeOptions}
          isBossReward={uiState.isBossReward} onSelect={handleUpgrade} />
      )}

      {/* Game Over */}
      {uiState.gameOver && (
        <GameOverScreen score={uiState.score} level={uiState.level}
          wave={uiState.wave} time={uiState.time}
          onRestart={handleStartGame} onMainMenu={handleMainMenu} />
      )}
    </div>
  );
}
