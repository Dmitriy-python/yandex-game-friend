import { SHOP_UPGRADES, getUpgradeCost } from '@/game/shopUpgrades';

interface UpgradeShopProps {
  coins: number;
  upgrades: Record<string, number>;
  onBuy: (id: string, cost: number) => void;
  onBack: () => void;
}

export default function UpgradeShop({ coins, upgrades, onBuy, onBack }: UpgradeShopProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0f1218 0%, #1a2035 100%)' }}>

      <h1 className="text-3xl font-black mb-2"
        style={{ color: '#e2e8f0', textShadow: '0 0 20px rgba(251,191,36,0.4)' }}>
        🏪 Магазин
      </h1>

      <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
        style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
        <span className="text-lg">🪙</span>
        <span className="text-lg font-bold font-mono" style={{ color: '#fbbf24' }}>{coins}</span>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md mx-4 max-h-[60vh] overflow-y-auto px-4">
        {SHOP_UPGRADES.map(upg => {
          const level = upgrades[upg.id] || 0;
          const maxed = level >= upg.maxLevel;
          const cost = maxed ? 0 : getUpgradeCost(upg, level);
          const canBuy = !maxed && coins >= cost;

          return (
            <div key={upg.id} className="p-4 rounded-xl flex items-center gap-4"
              style={{
                background: 'rgba(30,41,59,0.8)',
                border: `1px solid ${maxed ? 'rgba(74,222,128,0.3)' : 'rgba(59,130,246,0.2)'}`,
              }}>
              <span className="text-2xl">{upg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ color: '#e2e8f0' }}>{upg.name}</span>
                  <span className="text-xs font-mono" style={{ color: maxed ? '#4ade80' : '#94a3b8' }}>
                    {level}/{upg.maxLevel}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{upg.description}</p>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(level / upg.maxLevel) * 100}%`,
                      background: maxed ? '#4ade80' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    }} />
                </div>
              </div>
              <button
                onClick={() => canBuy && onBuy(upg.id, cost)}
                disabled={!canBuy}
                className="px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                style={{
                  background: maxed ? 'rgba(74,222,128,0.1)' : canBuy ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${maxed ? 'rgba(74,222,128,0.3)' : canBuy ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: maxed ? '#4ade80' : canBuy ? '#fbbf24' : '#475569',
                  opacity: !canBuy && !maxed ? 0.5 : 1,
                }}>
                {maxed ? 'МАКС' : `🪙 ${cost}`}
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={onBack}
        className="mt-6 px-8 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
        ← Назад
      </button>
    </div>
  );
}
