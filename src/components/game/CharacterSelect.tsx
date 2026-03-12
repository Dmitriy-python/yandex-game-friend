import playerImg from '@/assets/player.png';

interface CharacterSelectProps {
  onBack: () => void;
}

export default function CharacterSelect({ onBack }: CharacterSelectProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0f1218 0%, #1a2035 100%)' }}>
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl w-96"
        style={{ background: '#1e293b', border: '2px solid rgba(139,92,246,0.3)' }}>
        
        <h2 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>👤 Выбор персонажа</h2>

        {/* Current character */}
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl w-full"
          style={{ background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.4)' }}>
          <img src={playerImg} alt="Герой" className="w-24 h-24 object-contain" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>Боец</span>
            <span className="text-xs" style={{ color: '#94a3b8' }}>Дальний + ближний бой</span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
            ✓ Выбран
          </span>
        </div>

        {/* Locked characters */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {['Маг', 'Лучник'].map(name => (
            <div key={name} className="flex flex-col items-center gap-2 p-4 rounded-xl opacity-40"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-3xl">🔒</span>
              <span className="text-xs font-bold" style={{ color: '#64748b' }}>{name}</span>
              <span className="text-[10px]" style={{ color: '#475569' }}>Скоро</span>
            </div>
          ))}
        </div>

        <button onClick={onBack}
          className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          ← Назад
        </button>
      </div>
    </div>
  );
}
