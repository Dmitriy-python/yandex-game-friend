import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import { createInitialState, updateGame } from '@/game/logic';
import { renderGame } from '@/game/renderer';
import { GameState } from '@/game/types';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const [uiState, setUiState] = useState({
    hp: 100, maxHp: 100, xp: 0, xpToNext: 10, level: 1,
    score: 0, wave: 1, time: 0, gameOver: false,
    pendingUpgrade: false, upgradeOptions: [] as GameState['upgradeOptions'],
    enemyCount: 0,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

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

  useGameLoop((dt) => {
    const keys = keysRef.current;
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;

    stateRef.current = updateGame(stateRef.current, dt, { dx, dy });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGame(ctx, stateRef.current, canvas.width, canvas.height);

    const s = stateRef.current;
    setUiState({
      hp: s.player.hp, maxHp: s.player.maxHp,
      xp: s.player.xp, xpToNext: s.player.xpToNext,
      level: s.player.level, score: s.score,
      wave: s.wave, time: s.time, gameOver: s.gameOver,
      pendingUpgrade: s.pendingUpgrade,
      upgradeOptions: s.upgradeOptions,
      enemyCount: s.enemies.length,
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

  const handleRestart = useCallback(() => {
    stateRef.current = createInitialState();
  }, []);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#1a1f2e' }}>
      <canvas ref={canvasRef} className="block" />

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between pointer-events-none">
        {/* Left - HP & XP */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          {/* HP */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: '#ef4444' }}>❤️</span>
            <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${(uiState.hp / uiState.maxHp) * 100}%`,
                  background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: '#fca5a5' }}>
              {Math.ceil(uiState.hp)}/{uiState.maxHp}
            </span>
          </div>
          {/* XP */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: '#4ade80' }}>⭐</span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${(uiState.xp / uiState.xpToNext) * 100}%`,
                  background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: '#86efac' }}>
              Lv.{uiState.level}
            </span>
          </div>
        </div>

        {/* Center - Time & Wave */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>
            {formatTime(uiState.time)}
          </span>
          <span className="text-xs font-bold px-3 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
            Волна {uiState.wave}
          </span>
        </div>

        {/* Right - Score & Enemies */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-bold font-mono" style={{ color: '#fbbf24' }}>
            💀 {uiState.score}
          </span>
          <span className="text-xs" style={{ color: '#94a3b8' }}>
            👾 {uiState.enemyCount}
          </span>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs pointer-events-none" style={{ color: 'rgba(148,163,184,0.5)' }}>
        WASD / Стрелки для перемещения • Авто-атака
      </div>

      {/* Upgrade modal */}
      {uiState.pendingUpgrade && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="flex flex-col items-center gap-4 p-6 rounded-2xl max-w-md w-full mx-4" style={{ background: '#1e293b', border: '2px solid rgba(139,92,246,0.4)' }}>
            <h2 className="text-2xl font-bold" style={{ color: '#c4b5fd' }}>
              ⬆️ Уровень {uiState.level}!
            </h2>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Выберите улучшение:</p>
            <div className="flex flex-col gap-3 w-full">
              {uiState.upgradeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleUpgrade(opt.id)}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }}
                >
                  <div className="text-base font-bold" style={{ color: '#e2e8f0' }}>{opt.name}</div>
                  <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {uiState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl" style={{ background: '#1e293b', border: '2px solid rgba(239,68,68,0.4)' }}>
            <h2 className="text-3xl font-bold" style={{ color: '#ef4444' }}>💀 Вы погибли!</h2>
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-mono" style={{ color: '#e2e8f0' }}>Счёт: {uiState.score}</span>
              <span className="text-sm" style={{ color: '#94a3b8' }}>Уровень: {uiState.level} • Волна: {uiState.wave}</span>
              <span className="text-sm" style={{ color: '#94a3b8' }}>Время: {formatTime(uiState.time)}</span>
            </div>
            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-xl text-base font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}
            >
              🔄 Играть снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
