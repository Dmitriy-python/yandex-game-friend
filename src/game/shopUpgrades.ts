export interface ShopUpgrade {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number; // cost = baseCost * (costMultiplier ^ level)
}

export const SHOP_UPGRADES: ShopUpgrade[] = [
  {
    id: 'shop_dmg', name: 'Сила атаки', icon: '⚔️',
    description: 'Увеличивает урон на 10% за уровень',
    maxLevel: 10, baseCost: 500, costMultiplier: 1.8,
  },
  {
    id: 'shop_hp', name: 'Здоровье', icon: '❤️',
    description: 'Увеличивает макс. HP на 15 за уровень',
    maxLevel: 10, baseCost: 400, costMultiplier: 1.7,
  },
  {
    id: 'shop_speed', name: 'Скорость', icon: '👟',
    description: 'Увеличивает скорость на 5% за уровень',
    maxLevel: 8, baseCost: 600, costMultiplier: 1.8,
  },
  {
    id: 'shop_atkspd', name: 'Скорострельность', icon: '🔫',
    description: 'Увеличивает скорость атаки на 8% за уровень',
    maxLevel: 8, baseCost: 700, costMultiplier: 1.9,
  },
  {
    id: 'shop_melee', name: 'Ближний бой', icon: '🗡️',
    description: 'Увеличивает урон ближнего боя на 12% за уровень',
    maxLevel: 8, baseCost: 550, costMultiplier: 1.8,
  },
];

export function getUpgradeCost(upgrade: ShopUpgrade, currentLevel: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

export function applyShopUpgrades(upgrades: Record<string, number>, stats: {
  attackDamage: number;
  maxHp: number;
  speed: number;
  attackCooldown: number;
  meleeDamage: number;
}) {
  const dmgLvl = upgrades['shop_dmg'] || 0;
  const hpLvl = upgrades['shop_hp'] || 0;
  const spdLvl = upgrades['shop_speed'] || 0;
  const atkLvl = upgrades['shop_atkspd'] || 0;
  const meleeLvl = upgrades['shop_melee'] || 0;

  stats.attackDamage *= (1 + dmgLvl * 0.1);
  stats.maxHp += hpLvl * 15;
  stats.speed *= (1 + spdLvl * 0.05);
  stats.attackCooldown *= (1 - atkLvl * 0.08);
  stats.meleeDamage *= (1 + meleeLvl * 0.12);
}
