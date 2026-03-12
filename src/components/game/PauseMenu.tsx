interface PauseMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
}

export default function PauseMenu({ onResume, onMainMenu }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl"
        style={{ background: '#1e293b', border: '2px solid rgba(139,92,246,0.3)' }}>
        
        <h2 className="text-3xl font-bold" style={{ color: '#e2e8f0' }}>⏸️ Пауза</h2>
        
        <div className="flex flex-col gap-3 w-56">
          <button onClick={onResume}
            className="px-6 py-3 rounded-xl text-base font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
            ▶️ Продолжить
          </button>
          <button onClick={onMainMenu}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            🏠 Главное меню
          </button>
        </div>
        
        <p className="text-xs" style={{ color: '#64748b' }}>ESC — продолжить</p>
      </div>
    </div>
  );
}
