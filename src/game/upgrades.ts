import { UpgradeOption, GameState } from './types';

const allUpgrades: (() => UpgradeOption)[] = [
  () => ({
    id: 'dmg',
    name: '⚔️ Урон +25%',
    description: 'Увеличивает урон снарядов',
    apply: (s: GameState) => { s.player.attackDamage *= 1.25; },
  }),
  () => ({
    id: 'speed',
    name: '👟 Скорость +15%',
    description: 'Увеличивает скорость передвижения',
    apply: (s: GameState) => { s.player.speed *= 1.15; },
  }),
  () => ({
    id: 'atkspd',
    name: '🔫 Скорострельность +20%',
    description: 'Уменьшает задержку между выстрелами',
    apply: (s: GameState) => { s.player.attackCooldown *= 0.8; },
  }),
  () => ({
    id: 'hp',
    name: '❤️ Здоровье +30',
    description: 'Увеличивает максимальное HP и лечит',
    apply: (s: GameState) => {
      s.player.maxHp += 30;
      s.player.hp = s.player.maxHp;
    },
  }),
  () => ({
    id: 'range',
    name: '🎯 Дальность +20%',
    description: 'Увеличивает дальность стрельбы',
    apply: (s: GameState) => { s.player.attackRange *= 1.2; },
  }),
  () => ({
    id: 'projspd',
    name: '💨 Скорость снарядов +25%',
    description: 'Снаряды летят быстрее',
    apply: (s: GameState) => { s.player.projectileSpeed *= 1.25; },
  }),
];

export function getRandomUpgrades(count: number): UpgradeOption[] {
  const shuffled = [...allUpgrades].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(fn => fn());
}
