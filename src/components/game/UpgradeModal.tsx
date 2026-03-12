import { UpgradeOption } from '@/game/types';

interface UpgradeModalProps {
  level: number;
  options: UpgradeOption[];
  isBossReward: boolean;
  onSelect: (id: string) => void;
}

export default function UpgradeModal({ level, options, isBossReward, onSelect }: UpgradeModalProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-40"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl max-w-md w-full mx-4"
        style={{
          background: '#1e293b',
          border: `2px solid ${isBossReward ? 'rgba(251,191,36,0.5)' : 'rgba(139,92,246,0.4)'}`,
          boxShadow: isBossReward ? '0 0 40px rgba(251,191,36,0.2)' : undefined,
        }}>
        <h2 className="text-2xl font-bold"
          style={{ color: isBossReward ? '#fbbf24' : '#c4b5fd' }}>
          {isBossReward ? '🎁 Награда босса!' : `⬆️ Уровень ${level}!`}
        </h2>
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          {isBossReward ? 'Выберите мощное улучшение:' : 'Выберите улучшение:'}
        </p>
        <div className="flex flex-col gap-3 w-full">
          {options.map(opt => (
            <button key={opt.id} onClick={() => onSelect(opt.id)}
              className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{
                background: isBossReward ? 'rgba(251,191,36,0.1)' : 'rgba(59,130,246,0.1)',
                border: `1px solid ${isBossReward ? 'rgba(251,191,36,0.3)' : 'rgba(59,130,246,0.3)'}`,
              }}>
              <div className="text-base font-bold" style={{ color: '#e2e8f0' }}>{opt.name}</div>
              <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{opt.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
