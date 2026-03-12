import { CharacterClass } from '@/game/types';
import playerImg from '@/assets/player.png';
import mageImg from '@/assets/player-mage.png';
import archerImg from '@/assets/player-archer.png';

interface CharacterSelectProps {
  onBack: () => void;
  onSelect: (characterClass: CharacterClass) => void;
  selected: CharacterClass;
}

const characters: { id: CharacterClass; name: string; desc: string; img: string; stats: string }[] = [
  { id: 'fighter', name: 'Боец', desc: 'Сбалансированный боец с сильной атакой ближнего боя', img: playerImg, stats: '⚔️ Урон: ★★★ | 🏃 Скорость: ★★☆ | ❤️ HP: ★★★' },
  { id: 'mage', name: 'Маг', desc: 'Мощные дальние атаки, но хрупкий', img: mageImg, stats: '⚔️ Урон: ★★★★ | 🏃 Скорость: ★★☆ | ❤️ HP: ★★☆' },
  { id: 'archer', name: 'Лучник', desc: 'Быстрая стрельба и высокая скорость', img: archerImg, stats: '⚔️ Урон: ★★☆ | 🏃 Скорость: ★★★★ | ❤️ HP: ★★☆' },
];

export default function CharacterSelect({ onBack, onSelect, selected }: CharacterSelectProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0f1218 0%, #1a2035 100%)' }}>
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl w-[480px]"
        style={{ background: '#1e293b', border: '2px solid rgba(139,92,246,0.3)' }}>
        
        <h2 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>👤 Выбор персонажа</h2>

        <div className="flex flex-col gap-3 w-full">
          {characters.map(c => {
            const isSelected = selected === c.id;
            return (
              <button key={c.id} onClick={() => onSelect(c.id)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '2px solid rgba(59,130,246,0.5)' : '2px solid rgba(255,255,255,0.08)',
                }}>
                <img src={c.img} alt={c.name} className="w-20 h-20 object-contain flex-shrink-0" />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{c.name}</span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>{c.desc}</span>
                  <span className="text-[10px] mt-1" style={{ color: '#64748b' }}>{c.stats}</span>
                </div>
              </button>
            );
          })}
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
