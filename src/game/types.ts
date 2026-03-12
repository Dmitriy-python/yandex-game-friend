export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  xp: number;
  xpToNext: number;
  level: number;
  attackCooldown: number;
  attackTimer: number;
  attackDamage: number;
  attackRange: number;
  projectileSpeed: number;
  radius: number;
}

export type EnemyType = 'normal' | 'fast' | 'tank' | 'boss';

export interface Enemy {
  id: number;
  type: EnemyType;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  xpValue: number;
  flashTimer: number;
}

export interface Projectile {
  id: number;
  pos: Vec2;
  vel: Vec2;
  damage: number;
  radius: number;
  life: number;
}

export interface XpOrb {
  id: number;
  pos: Vec2;
  value: number;
  radius: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  xpOrbs: XpOrb[];
  time: number;
  score: number;
  wave: number;
  spawnTimer: number;
  spawnInterval: number;
  gameOver: boolean;
  paused: boolean;
  pendingUpgrade: boolean;
  upgradeOptions: UpgradeOption[];
  camera: Vec2;
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  apply: (state: GameState) => void;
}

export const MAP_WIDTH = 3000;
export const MAP_HEIGHT = 3000;
