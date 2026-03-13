import { CharacterClass } from '@/game/types';
import playerImg from '@/assets/player.png';
import mageImg from '@/assets/player-mage.png';
import archerImg from '@/assets/player-archer.png';
import knightImg from '@/assets/player-knight.png';
import rogueImg from '@/assets/player-rogue.png';
import priestImg from '@/assets/player-priest.png';
import barbarianImg from '@/assets/player-barbarian.png';
import elfImg from '@/assets/player-elf.png';
import dwarfImg from '@/assets/player-dwarf.png';
import necromancerImg from '@/assets/player-necromancer.png';

interface CharacterSelectProps {
  onBack: () => void;
  onSelect: (characterClass: CharacterClass) => void;
  onUnlock: (characterClass: CharacterClass, cost: number) => void;
  selected: CharacterClass;
  unlockedCharacters: string[];
  coins: number;
}

interface CharacterDef {
  id: CharacterClass;
  name: string;
  desc: string;
  img: string;
  stats: string;
  cost: number; // 0 = free
}

const characters: CharacterDef[] = [
  { id: 'fighter', name: 'Боец', desc: 'Сбалансированный боец с сильной атакой ближнего боя', img: playerImg, stats: '⚔️★★★ | 🏃★★☆ | ❤️★★★', cost: 0 },
  { id: 'mage', name: 'Маг', desc: 'Мощные дальние атаки, но хрупкий', img: mageImg, stats: '⚔️★★★★ | 🏃★★☆ | ❤️★★☆', cost: 3000 },
  { id: 'archer', name: 'Лучник', desc: 'Быстрая стрельба и высокая скорость', img: archerImg, stats: '⚔️★★☆ | 🏃★★★★ | ❤️★★☆', cost: 3000 },
  { id: 'knight', name: 'Рыцарь', desc: 'Тяжёлая броня и высокое здоровье', img: knightImg, stats: '⚔️★★☆ | 🏃★★☆ | ❤️★★★★', cost: 3500 },
  { id: 'rogue', name: 'Разбойник', desc: 'Молниеносные атаки и максимальная скорость', img: rogueImg, stats: '⚔️★★★ | 🏃★★★★★ | ❤️★☆☆', cost: 4000 },
  { id: 'priest', name: 'Жрец', desc: 'Поддержка и средние атаки', img: priestImg, stats: '⚔️★★☆ | 🏃★★☆ | ❤️★★★', cost: 3500 },
  { id: 'barbarian', name: 'Варвар', desc: 'Огромный урон в ближнем бою', img: barbarianImg, stats: '⚔️★★★★★ | 🏃★★☆ | ❤️★★★★', cost: 4500 },
  { id: 'elf', name: 'Эльф', desc: 'Дальнобойный стрелок с огромной скоростью', img: elfImg, stats: '⚔️★★☆ | 🏃★★★★★ | ❤️★★☆', cost: 4000 },
  { id: 'dwarf', name: 'Гном', desc: 'Несокрушимый танк с молотом', img: dwarfImg, stats: '⚔️★★★ | 🏃★☆☆ | ❤️★★★★★', cost: 4500 },
  { id: 'necromancer', name: 'Некромант', desc: 'Тёмная магия с максимальным уроном', img: necromancerImg, stats: '⚔️★★★★★ | 🏃★☆☆ | ❤️★☆☆', cost: 5000 },
];

export default function CharacterSelect({ onBack, onSelect, onUnlock, selected, unlockedCharacters, coins }: CharacterSelectProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0f1218 0%, #1a2035 100%)' }}>
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl w-[520px] max-h-[90vh]"
        style={{ background: '#1e293b', border: '2px solid rgba(139,92,246,0.3)' }}>
        
        <h2 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>👤 Выбор персонажа</h2>

        {/* Coins */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <span>🪙</span>
          <span className="font-bold font-mono" style={{ color: '#fbbf24' }}>{coins}</span>
        </div>

        <div className="flex flex-col gap-2 w-full overflow-y-auto pr-1" style={{ maxHeight: '60vh' }}>
          {characters.map(c => {
            const isUnlocked = unlockedCharacters.includes(c.id);
            const isSelected = selected === c.id;
            const canAfford = coins >= c.cost;

            return (
              <button key={c.id}
                onClick={() => {
                  if (isUnlocked) {
                    onSelect(c.id);
                  } else if (canAfford) {
                    onUnlock(c.id, c.cost);
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer relative"
                style={{
                  background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '2px solid rgba(59,130,246,0.5)' : '2px solid rgba(255,255,255,0.08)',
                  opacity: !isUnlocked && !canAfford ? 0.5 : 1,
                }}>
                
                {/* Sprite */}
                <div className="relative w-14 h-14 flex-shrink-0">
                  <img src={c.img} alt={c.name}
                    className="w-full h-full object-contain"
                    style={{ filter: isUnlocked ? 'none' : 'brightness(0.3)' }} />
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center text-xl">🔒</div>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{c.name}</span>
                    {isSelected && isUnlocked && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-[11px]" style={{ color: '#94a3b8' }}>{c.desc}</span>
                  <span className="text-[9px]" style={{ color: '#64748b' }}>{c.stats}</span>
                </div>

                {/* Price / status */}
                <div className="flex-shrink-0 text-right">
                  {isUnlocked ? (
                    <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>✓</span>
                  ) : (
                    <span className="text-xs font-bold font-mono flex items-center gap-1"
                      style={{ color: canAfford ? '#fbbf24' : '#475569' }}>
                      🪙 {c.cost}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={onBack}
          className="px-8 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          ← Назад
        </button>
      </div>
    </div>
  );
}
