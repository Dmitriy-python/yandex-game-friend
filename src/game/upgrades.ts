import { UpgradeOption, GameState } from './types';

const allUpgrades: (() => UpgradeOption)[] = [
  () => ({
    id: 'dmg', name: '⚔️ Урон +25%',
    description: 'Увеличивает урон снарядов',
    apply: (s: GameState) => { s.player.attackDamage *= 1.25; },
  }),
  () => ({
    id: 'speed', name: '👟 Скорость +15%',
    description: 'Увеличивает скорость передвижения',
    apply: (s: GameState) => { s.player.speed *= 1.15; },
  }),
  () => ({
    id: 'atkspd', name: '🔫 Скорострельность +20%',
    description: 'Уменьшает задержку между выстрелами',
    apply: (s: GameState) => { s.player.attackCooldown *= 0.8; },
  }),
  () => ({
    id: 'hp', name: '❤️ Здоровье +30',
    description: 'Увеличивает максимальное HP и лечит',
    apply: (s: GameState) => { s.player.maxHp += 30; s.player.hp = s.player.maxHp; },
  }),
  () => ({
    id: 'range', name: '🎯 Дальность +20%',
    description: 'Увеличивает дальность стрельбы',
    apply: (s: GameState) => { s.player.attackRange *= 1.2; },
  }),
  () => ({
    id: 'projspd', name: '💨 Скорость снарядов +25%',
    description: 'Снаряды летят быстрее',
    apply: (s: GameState) => { s.player.projectileSpeed *= 1.25; },
  }),
];

const bossUpgrades: (() => UpgradeOption)[] = [
  () => ({
    id: 'boss_dmg', name: '🗡️ Мощный удар',
    description: 'Урон +50% и урон ближнего боя +50%',
    apply: (s: GameState) => { s.player.attackDamage *= 1.5; s.player.meleeDamage *= 1.5; },
  }),
  () => ({
    id: 'boss_hp', name: '🛡️ Стальное тело',
    description: 'Макс. здоровье +80 и полное исцеление',
    apply: (s: GameState) => { s.player.maxHp += 80; s.player.hp = s.player.maxHp; },
  }),
  () => ({
    id: 'boss_speed', name: '⚡ Молниеносность',
    description: 'Скорость +30% и скорострельность +30%',
    apply: (s: GameState) => { s.player.speed *= 1.3; s.player.attackCooldown *= 0.7; },
  }),
  () => ({
    id: 'boss_melee', name: '🪓 Вихрь клинков',
    description: 'Дальность и урон ближнего боя +60%',
    apply: (s: GameState) => { s.player.meleeRange *= 1.6; s.player.meleeDamage *= 1.6; },
  }),
  () => ({
    id: 'boss_range', name: '🏹 Снайпер',
    description: 'Дальность +40% и скорость снарядов +40%',
    apply: (s: GameState) => { s.player.attackRange *= 1.4; s.player.projectileSpeed *= 1.4; },
  }),
];

export function getRandomUpgrades(count: number): UpgradeOption[] {
  const shuffled = [...allUpgrades].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(fn => fn());
}

export function getBossUpgrades(count: number): UpgradeOption[] {
  const shuffled = [...bossUpgrades].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(fn => fn());
}
