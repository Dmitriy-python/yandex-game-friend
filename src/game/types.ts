export type CharacterClass = 'fighter' | 'mage' | 'archer' | 'knight' | 'rogue' | 'priest' | 'barbarian' | 'elf' | 'dwarf' | 'necromancer';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vec2;
  vel: Vec2;
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
  characterClass: CharacterClass;
  meleeRange: number;
  meleeDamage: number;
  meleeCooldown: number;
  meleeTimer: number;
  meleeSwingTimer: number;
  meleeSwingDuration: number;
  abilityTimer: number;
  abilityCooldown: number;
  shieldActive: boolean;
  shieldTimer: number;
}

export interface Summon {
  id: number;
  pos: Vec2;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  radius: number;
  life: number;
  targetId?: number;
}

export type EnemyType = 'normal' | 'fast' | 'tank' | 'boss';

export type BossVariant = 'infernal' | 'frost' | 'shadow' | 'thunder';

// Visual boss identity — cycles through unique sprites
export type BossVisual = 'infernal' | 'frost' | 'shadow' | 'thunder' | 'skeleton' | 'spider' | 'darkknight' | 'chimera';

export interface Enemy {
  id: number;
  type: EnemyType;
  bossVariant?: BossVariant;
  bossVisual?: BossVisual;
  pos: Vec2;
  prevPos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  xpValue: number;
  flashTimer: number;
  abilityTimer?: number;
  abilityCooldown?: number;
  isDashing?: boolean;
  dashTimer?: number;
  armor?: number;
}

export interface DeathParticle {
  id: number;
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface BossProjectile {
  id: number;
  pos: Vec2;
  vel: Vec2;
  damage: number;
  radius: number;
  life: number;
  color: string;
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

export interface CoinChest {
  id: number;
  pos: Vec2;
  radius: number;
  value: number;
}

export type GameScreen = 'loading' | 'menu' | 'character_select' | 'settings' | 'shop' | 'playing' | 'paused' | 'game_over';

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  xpOrbs: XpOrb[];
  chests: Chest[];
  coinChests: CoinChest[];
  deathParticles: DeathParticle[];
  bossProjectiles: BossProjectile[];
  summons: Summon[];
  time: number;
  score: number;
  wave: number;
  coins: number;
  spawnTimer: number;
  spawnInterval: number;
  coinSpawnTimer: number;
  gameOver: boolean;
  paused: boolean;
  pendingUpgrade: boolean;
  upgradeOptions: UpgradeOption[];
  camera: Vec2;
  isBossWave: boolean;
  bossWaveCleared: boolean;
  coinsSaved: boolean; // guard against double-saving coins
  events: GameEvent[];
}

export type GameEvent = 
  | { type: 'shoot' }
  | { type: 'hit' }
  | { type: 'kill' }
  | { type: 'boss_kill' }
  | { type: 'melee_swing' }
  | { type: 'chest_open' }
  | { type: 'coin_collect' }
  | { type: 'level_up' }
  | { type: 'boss_spawn' }
  | { type: 'player_hit' }
  | { type: 'boss_ability' }
  | { type: 'ability_use' };

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  apply: (state: GameState) => void;
}

export const MAP_WIDTH = 4000;
export const MAP_HEIGHT = 4000;
