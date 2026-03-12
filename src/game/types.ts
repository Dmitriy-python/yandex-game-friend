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
  // Melee
  meleeRange: number;
  meleeDamage: number;
  meleeCooldown: number;
  meleeTimer: number;
  meleeSwingTimer: number; // visual swing animation timer
  meleeSwingDuration: number;
}

export type EnemyType = 'normal' | 'fast' | 'tank' | 'boss';

export type BossVariant = 'infernal' | 'frost' | 'shadow' | 'thunder';

export interface Enemy {
  id: number;
  type: EnemyType;
  bossVariant?: BossVariant;
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

export interface Chest {
  id: number;
  pos: Vec2;
  radius: number;
  collected: boolean;
}

export type GameScreen = 'loading' | 'menu' | 'character_select' | 'settings' | 'playing' | 'paused' | 'game_over';

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  xpOrbs: XpOrb[];
  chests: Chest[];
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
  isBossWave: boolean;
  bossWaveCleared: boolean;
  // Events for audio
  events: GameEvent[];
}

export type GameEvent = 
  | { type: 'shoot' }
  | { type: 'hit' }
  | { type: 'kill' }
  | { type: 'melee_swing' }
  | { type: 'chest_open' }
  | { type: 'level_up' }
  | { type: 'boss_spawn' }
  | { type: 'player_hit' };

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  apply: (state: GameState) => void;
}

export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 2000;
