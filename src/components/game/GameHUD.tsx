import { CharacterClass } from '@/game/types';

interface GameHUDProps {
  hp: number; maxHp: number;
  xp: number; xpToNext: number;
  level: number; score: number;
  wave: number; time: number;
  enemyCount: number;
  isBossWave: boolean;
  coins: number;
  characterClass: CharacterClass;
}

export default function GameHUD(props: GameHUDProps) {
  const { hp, maxHp, xp, xpToNext, level, score, wave, time, enemyCount, isBossWave, coins } = props;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between pointer-events-none">
      {/* Left - HP & XP */}
      <div className="flex flex-col gap-2 min-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: '#ef4444' }}>❤️</span>
          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="h-full rounded-full transition-all duration-200"
              style={{ width: `${(hp / maxHp) * 100}%`, background: 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
          </div>
          <span className="text-xs font-mono" style={{ color: '#fca5a5' }}>{Math.ceil(hp)}/{maxHp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: '#4ade80' }}>⭐</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="h-full rounded-full transition-all duration-200"
              style={{ width: `${(xp / xpToNext) * 100}%`, background: 'linear-gradient(90deg, #4ade80, #22c55e)' }} />
          </div>
          <span className="text-xs font-mono" style={{ color: '#86efac' }}>Lv.{level}</span>
        </div>
      </div>

      {/* Center - Time & Wave */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>{formatTime(time)}</span>
        <span className="text-xs font-bold px-3 py-0.5 rounded-full"
          style={{
            background: isBossWave ? 'rgba(220,38,38,0.3)' : 'rgba(139,92,246,0.3)',
            color: isBossWave ? '#fca5a5' : '#c4b5fd',
            border: isBossWave ? '1px solid rgba(220,38,38,0.4)' : 'none',
          }}>
          {isBossWave ? '⚠️ БОСС' : `Волна ${wave}`}
        </span>
      </div>

      {/* Right - Score, Coins & Enemies */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-bold font-mono" style={{ color: '#fbbf24' }}>💀 {score}</span>
        <span className="text-sm font-bold font-mono" style={{ color: '#f59e0b' }}>🪙 {coins}</span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>👾 {enemyCount}</span>
      </div>
    </div>
  );
}
