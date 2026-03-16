import { isSfxEnabled, setSfxEnabled } from '@/game/audio';
import { useState } from 'react';

interface SettingsMenuProps {
  onBack: () => void;
}

export default function SettingsMenu({ onBack }: SettingsMenuProps) {
  const [sfx, setSfx] = useState(isSfxEnabled());

  const toggleSfx = () => {
    const newVal = !sfx;
    setSfx(newVal);
    setSfxEnabled(newVal);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0f1218 0%, #1a2035 100%)' }}>
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl w-80"
        style={{ background: '#1e293b', border: '2px solid rgba(139,92,246,0.3)' }}>
        
        <h2 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>⚙️ Настройки</h2>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>🎵 Музыка</span>
            <button onClick={toggleMusic}
              className="px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all"
              style={{
                background: music ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)',
                border: `1px solid ${music ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: music ? '#4ade80' : '#ef4444',
              }}>
              {music ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>🔊 Звуки</span>
            <button onClick={toggleSfx}
              className="px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all"
              style={{
                background: sfx ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)',
                border: `1px solid ${sfx ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: sfx ? '#4ade80' : '#ef4444',
              }}>
              {sfx ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
          </div>
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
