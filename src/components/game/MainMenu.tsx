interface MainMenuProps {
  highScore: number;
  highWave: number;
  onPlay: () => void;
  onCharacterSelect: () => void;
  onSettings: () => void;
}

export default function MainMenu({ highScore, highWave, onPlay, onCharacterSelect, onSettings }: MainMenuProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0f1218 0%, #1a2035 100%)' }}>
      
      {/* Title */}
      <div className="flex flex-col items-center gap-2 mb-10">
        <h1 className="text-6xl font-black tracking-wider"
          style={{ color: '#e2e8f0', textShadow: '0 0 40px rgba(59,130,246,0.5)' }}>
          ⚔️ SURVIVOR
        </h1>
        <p className="text-lg font-mono" style={{ color: '#8b5cf6' }}>ARENA</p>
      </div>

      {/* High Score */}
      {highWave > 0 && (
        <div className="mb-8 flex flex-col items-center gap-1 p-4 rounded-xl"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>🏆 РЕКОРД</span>
          <span className="text-lg font-mono font-bold" style={{ color: '#e2e8f0' }}>
            Волна {highWave} • {highScore} очков
          </span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-64">
        <button onClick={onPlay}
          className="px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}>
          🎮 В БОЙ
        </button>
        
        <button onClick={onCharacterSelect}
          className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
          👤 Выбрать персонажа
        </button>
        
        <button onClick={onSettings}
          className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          ⚙️ Настройки
        </button>
      </div>

      {/* Controls hint */}
      <p className="mt-10 text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>
        WASD / Стрелки • Авто-атака • ESC пауза
      </p>
    </div>
  );
}
