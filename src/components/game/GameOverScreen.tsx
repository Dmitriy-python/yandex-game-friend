interface GameOverScreenProps {
  score: number;
  level: number;
  wave: number;
  time: number;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverScreen({ score, level, wave, time, onRestart, onMainMenu }: GameOverScreenProps) {
  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl"
        style={{ background: '#1e293b', border: '2px solid rgba(239,68,68,0.4)' }}>
        <h2 className="text-3xl font-bold" style={{ color: '#ef4444' }}>💀 Вы погибли!</h2>
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-mono" style={{ color: '#e2e8f0' }}>Счёт: {score}</span>
          <span className="text-sm" style={{ color: '#94a3b8' }}>Уровень: {level} • Волна: {wave}</span>
          <span className="text-sm" style={{ color: '#94a3b8' }}>Время: {formatTime(time)}</span>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button onClick={onRestart}
            className="px-8 py-3 rounded-xl text-base font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
            🔄 Играть снова
          </button>
          <button onClick={onMainMenu}
            className="px-8 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
            🏠 Главное меню
          </button>
        </div>
      </div>
    </div>
  );
}
