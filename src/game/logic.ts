import { GameState, Enemy, EnemyType, BossVariant, BossVisual, Projectile, XpOrb, Chest, CoinChest, DeathParticle, BossProjectile, MAP_WIDTH, MAP_HEIGHT, Vec2, GameEvent, CharacterClass, Summon } from './types';
import { CLASS_ABILITY_COOLDOWNS, executeClassAbility } from './abilities';
import { getRandomUpgrades, getBossUpgrades } from './upgrades';

let nextId = 1;

const BOSS_VARIANTS: BossVariant[] = ['infernal', 'frost', 'shadow', 'thunder'];
const BOSS_VISUALS: BossVisual[] = ['infernal', 'frost', 'shadow', 'thunder', 'skeleton', 'spider', 'darkknight', 'chimera'];

const CLASS_STATS: Record<CharacterClass, Partial<GameState['player']>> = {
  fighter: {
    attackDamage: 20, attackCooldown: 0.5, attackRange: 300,
    projectileSpeed: 400, speed: 200, maxHp: 100,
    meleeDamage: 35, meleeRange: 60, meleeCooldown: 0.8,
  },
  mage: {
    attackDamage: 30, attackCooldown: 0.7, attackRange: 400,
    projectileSpeed: 350, speed: 170, maxHp: 75,
    meleeDamage: 15, meleeRange: 40, meleeCooldown: 1.2,
  },
  archer: {
    attackDamage: 18, attackCooldown: 0.3, attackRange: 450,
    projectileSpeed: 550, speed: 230, maxHp: 80,
    meleeDamage: 20, meleeRange: 45, meleeCooldown: 1.0,
  },
  knight: {
    attackDamage: 22, attackCooldown: 0.55, attackRange: 280,
    projectileSpeed: 380, speed: 180, maxHp: 120,
    meleeDamage: 30, meleeRange: 55, meleeCooldown: 0.85,
  },
  rogue: {
    attackDamage: 25, attackCooldown: 0.25, attackRange: 250,
    projectileSpeed: 500, speed: 250, maxHp: 70,
    meleeDamage: 40, meleeRange: 50, meleeCooldown: 0.6,
  },
  priest: {
    attackDamage: 15, attackCooldown: 0.6, attackRange: 350,
    projectileSpeed: 300, speed: 190, maxHp: 90,
    meleeDamage: 10, meleeRange: 35, meleeCooldown: 1.0,
  },
  barbarian: {
    attackDamage: 28, attackCooldown: 0.6, attackRange: 200,
    projectileSpeed: 350, speed: 210, maxHp: 130,
    meleeDamage: 50, meleeRange: 70, meleeCooldown: 0.7,
  },
  elf: {
    attackDamage: 20, attackCooldown: 0.28, attackRange: 480,
    projectileSpeed: 600, speed: 240, maxHp: 75,
    meleeDamage: 18, meleeRange: 45, meleeCooldown: 1.0,
  },
  dwarf: {
    attackDamage: 24, attackCooldown: 0.5, attackRange: 250,
    projectileSpeed: 350, speed: 170, maxHp: 140,
    meleeDamage: 45, meleeRange: 55, meleeCooldown: 0.75,
  },
  necromancer: {
    attackDamage: 32, attackCooldown: 0.8, attackRange: 420,
    projectileSpeed: 320, speed: 160, maxHp: 65,
    meleeDamage: 12, meleeRange: 35, meleeCooldown: 1.3,
  },
};

export function createInitialState(characterClass: CharacterClass = 'fighter'): GameState {
  const classStats = CLASS_STATS[characterClass];
  const maxHp = classStats.maxHp || 100;
  return {
    player: {
      pos: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
      vel: { x: 0, y: 0 },
      hp: maxHp, maxHp, speed: classStats.speed || 200,
      xp: 0, xpToNext: 10, level: 1,
      attackCooldown: classStats.attackCooldown || 0.5, attackTimer: 0,
      attackDamage: classStats.attackDamage || 20, attackRange: classStats.attackRange || 300,
      projectileSpeed: classStats.projectileSpeed || 400, radius: 16,
      characterClass,
      meleeRange: classStats.meleeRange || 60, meleeDamage: classStats.meleeDamage || 35,
      meleeCooldown: classStats.meleeCooldown || 0.8, meleeTimer: 0,
      meleeSwingTimer: 0, meleeSwingDuration: 0.3,
      abilityTimer: 0, abilityCooldown: CLASS_ABILITY_COOLDOWNS[characterClass],
      shieldActive: false, shieldTimer: 0,
    },
    enemies: [], projectiles: [], xpOrbs: [], chests: [],
    coinChests: [], deathParticles: [], bossProjectiles: [],
    summons: [],
    time: 0, score: 0, wave: 1, coins: 0,
    spawnTimer: 0, spawnInterval: 1.5, coinSpawnTimer: 0,
    gameOver: false, paused: false,
    pendingUpgrade: false, upgradeOptions: [],
    camera: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
    isBossWave: false, bossWaveCleared: false,
    coinsSaved: false,
    events: [],
  };
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function spawnPos(state: GameState, extraDist = 0): Vec2 {
  const angle = Math.random() * Math.PI * 2;
  const spawnDist = 400 + Math.random() * 200 + extraDist;
  return {
    x: Math.max(0, Math.min(MAP_WIDTH, state.player.pos.x + Math.cos(angle) * spawnDist)),
    y: Math.max(0, Math.min(MAP_HEIGHT, state.player.pos.y + Math.sin(angle) * spawnDist)),
  };
}

function getBossVariantForWave(wave: number): BossVariant {
  const index = Math.floor((wave / 5 - 1) % BOSS_VARIANTS.length);
  return BOSS_VARIANTS[index];
}

function getBossVisualForWave(wave: number): BossVisual {
  const index = Math.floor((wave / 5 - 1) % BOSS_VISUALS.length);
  return BOSS_VISUALS[index];
}

// Nonlinear boss scaling: wave 5=x1, wave 10=x2.5, wave 15=x5, wave 20=x9, wave 25=x14
function getBossScaling(wave: number): { hpMult: number; dmgMult: number; speedMult: number; cdMult: number } {
  const bossNum = Math.floor(wave / 5); // 1, 2, 3, 4, 5...
  const hpMult = 1 + (bossNum - 1) * 0.8 + Math.pow(bossNum - 1, 1.7) * 0.3;
  const dmgMult = 1 + (bossNum - 1) * 0.5;
  const speedMult = 1 + (bossNum - 1) * 0.08;
  const cdMult = Math.max(0.4, 1 - (bossNum - 1) * 0.08); // abilities get faster
  return { hpMult, dmgMult, speedMult, cdMult };
}

const DEATH_COLORS: Record<EnemyType, string[]> = {
  normal: ['#ef4444', '#f97316', '#fbbf24'],
  fast: ['#3b82f6', '#60a5fa', '#93c5fd'],
  tank: ['#6b7280', '#9ca3af', '#d1d5db'],
  boss: ['#dc2626', '#fbbf24', '#f59e0b', '#ef4444', '#ff6b6b'],
};

const BOSS_VARIANT_COLORS: Record<BossVariant, string[]> = {
  infernal: ['#ff4500', '#ff6347', '#ffa500', '#ff0000'],
  frost: ['#00bfff', '#87ceeb', '#add8e6', '#ffffff'],
  shadow: ['#4b0082', '#8b00ff', '#9400d3', '#2d1b69'],
  thunder: ['#ffd700', '#ffff00', '#f0e68c', '#daa520'],
};

function spawnDeathParticles(pos: Vec2, type: EnemyType, variant?: BossVariant): DeathParticle[] {
  const colors = type === 'boss' && variant ? BOSS_VARIANT_COLORS[variant] : DEATH_COLORS[type];
  const count = type === 'boss' ? 20 : type === 'tank' ? 12 : 8;
  const particles: DeathParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 80 + Math.random() * 200;
    const life = 0.3 + Math.random() * 0.3;
    particles.push({
      id: nextId++,
      pos: { x: pos.x + (Math.random() - 0.5) * 10, y: pos.y + (Math.random() - 0.5) * 10 },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      life, maxLife: life,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: type === 'boss' ? 6 + Math.random() * 6 : 3 + Math.random() * 4,
    });
  }
  return particles;
}

function spawnEnemy(state: GameState, forceType?: EnemyType, bossVariant?: BossVariant): Enemy {
  const wm = 1 + (state.wave - 1) * 0.15;

  let type: EnemyType = forceType || 'normal';
  if (!forceType) {
    const roll = Math.random();
    if (state.wave >= 3 && roll < 0.2) type = 'fast';
    else if (state.wave >= 4 && roll < 0.35) type = 'tank';
  }

  const configs: Record<EnemyType, Omit<Enemy, 'id' | 'pos' | 'prevPos' | 'flashTimer' | 'type' | 'bossVariant' | 'bossVisual' | 'abilityTimer' | 'abilityCooldown' | 'isDashing' | 'dashTimer' | 'armor'>> = {
    normal: {
      hp: 30 * wm, maxHp: 30 * wm,
      speed: 60 + Math.random() * 40 + state.wave * 3,
      damage: 10 + state.wave * 2, radius: 13,
      xpValue: 1 + Math.floor(state.wave / 3),
    },
    fast: {
      hp: 15 * wm, maxHp: 15 * wm,
      speed: 130 + Math.random() * 40 + state.wave * 4,
      damage: 6 + state.wave, radius: 8,
      xpValue: 1 + Math.floor(state.wave / 3),
    },
    tank: {
      hp: 100 * wm, maxHp: 100 * wm,
      speed: 35 + state.wave * 2,
      damage: 20 + state.wave * 3, radius: 22,
      xpValue: 3 + Math.floor(state.wave / 2),
    },
    boss: {
      hp: 1500 * wm, maxHp: 1500 * wm,
      speed: 65 + state.wave * 2,
      damage: 50 + state.wave * 5, radius: 36,
      xpValue: 20 + state.wave * 2,
    },
  };

  const cfg = configs[type];
  const pos = spawnPos(state, type === 'boss' ? 200 : 0);
  const variant = type === 'boss' ? (bossVariant || getBossVariantForWave(state.wave)) : undefined;
  const visual = type === 'boss' ? getBossVisualForWave(state.wave) : undefined;

  // Apply nonlinear boss scaling
  let armor = 0;
  let speed = cfg.speed;
  let hp = cfg.hp;
  let maxHp = cfg.maxHp;
  let damage = cfg.damage;
  let abilityCooldown = 4;

  if (type === 'boss') {
    const scaling = getBossScaling(state.wave);
    hp *= scaling.hpMult;
    maxHp *= scaling.hpMult;
    damage *= scaling.dmgMult;
    speed *= scaling.speedMult;
    abilityCooldown *= scaling.cdMult;

    // Variant-specific modifications on top
    if (variant) {
      switch (variant) {
        case 'infernal':
          break;
        case 'frost':
          speed *= 1.3;
          break;
        case 'shadow':
          hp *= 0.8;
          maxHp *= 0.8;
          break;
        case 'thunder':
          speed *= 0.6;
          hp *= 1.8;
          maxHp *= 1.8;
          armor = 0.4;
          break;
      }
    }
  }

  return {
    id: nextId++, type, pos, prevPos: { ...pos },
    hp, maxHp, speed, damage, radius: cfg.radius,
    xpValue: cfg.xpValue, flashTimer: 0,
    bossVariant: variant,
    bossVisual: visual,
    abilityTimer: type === 'boss' ? 2 + Math.random() * 2 : undefined,
    abilityCooldown: type === 'boss' ? abilityCooldown : undefined,
    isDashing: false,
    dashTimer: 0,
    armor: armor > 0 ? armor : undefined,
  };
}

function findClosestEnemy(state: GameState): Enemy | null {
  let closest: Enemy | null = null;
  let closestDist = Infinity;
  for (const e of state.enemies) {
    const d = dist(state.player.pos, e.pos);
    if (d < closestDist && d <= state.player.attackRange) {
      closest = e;
      closestDist = d;
    }
  }
  return closest;
}

function applyDamage(enemy: Enemy, damage: number): number {
  const actualDamage = enemy.armor ? damage * (1 - enemy.armor) : damage;
  enemy.hp -= actualDamage;
  enemy.flashTimer = 0.1;
  return actualDamage;
}

function updateBossAbilities(s: GameState, dt: number): void {
  for (const e of s.enemies) {
    if (e.type !== 'boss' || !e.bossVariant) continue;

    if (e.isDashing && e.dashTimer !== undefined && e.dashTimer > 0) {
      e.dashTimer -= dt;
      if (e.dashTimer <= 0) {
        e.isDashing = false;
        e.speed /= 3;
      }
    }

    if (e.abilityTimer !== undefined) {
      e.abilityTimer -= dt;
      if (e.abilityTimer <= 0) {
        e.abilityTimer = e.abilityCooldown || 4;

        switch (e.bossVariant) {
          case 'infernal': {
            const slamRange = 120;
            const d = dist(e.pos, s.player.pos);
            if (d < slamRange) {
              s.player.hp -= e.damage * 0.8;
              s.events.push({ type: 'player_hit' });
            }
            s.events.push({ type: 'boss_ability' });
            for (let i = 0; i < 12; i++) {
              const angle = (Math.PI * 2 * i) / 12;
              s.deathParticles.push({
                id: nextId++,
                pos: { ...e.pos },
                vel: { x: Math.cos(angle) * 200, y: Math.sin(angle) * 200 },
                life: 0.4, maxLife: 0.4,
                color: '#ff4500', size: 5,
              });
            }
            break;
          }
          case 'frost': {
            if (!e.isDashing) {
              e.isDashing = true;
              e.dashTimer = 0.5;
              e.speed *= 3;
              s.events.push({ type: 'boss_ability' });
            }
            break;
          }
          case 'shadow': {
            const dir = normalize({
              x: s.player.pos.x - e.pos.x,
              y: s.player.pos.y - e.pos.y,
            });
            const projSpeed = 300;
            // Later waves: more spread projectiles
            const bossNum = Math.floor(s.wave / 5);
            const projCount = bossNum >= 4 ? 5 : 3;
            const halfSpread = projCount === 5 ? 2 : 1;
            for (let i = -halfSpread; i <= halfSpread; i++) {
              const spread = i * 0.25;
              const px = dir.x * Math.cos(spread) - dir.y * Math.sin(spread);
              const py = dir.x * Math.sin(spread) + dir.y * Math.cos(spread);
              s.bossProjectiles.push({
                id: nextId++,
                pos: { ...e.pos },
                vel: { x: px * projSpeed, y: py * projSpeed },
                damage: e.damage * 0.5,
                radius: 8,
                life: 3,
                color: '#8b00ff',
              });
            }
            s.events.push({ type: 'boss_ability' });

            // Summon minions — more on later waves
            const summonChance = Math.min(0.7, 0.3 + bossNum * 0.08);
            if (Math.random() < summonChance) {
              const minionCount = bossNum >= 3 ? 3 : 2;
              for (let i = 0; i < minionCount; i++) {
                const minionPos = {
                  x: e.pos.x + (Math.random() - 0.5) * 80,
                  y: e.pos.y + (Math.random() - 0.5) * 80,
                };
                s.enemies.push({
                  id: nextId++, type: 'fast',
                  pos: minionPos, prevPos: { ...minionPos },
                  hp: 20, maxHp: 20,
                  speed: 100 + Math.random() * 50,
                  damage: 8, radius: 8,
                  xpValue: 1, flashTimer: 0,
                });
              }
            }
            break;
          }
          case 'thunder': {
            const shockRange = 150;
            const d = dist(e.pos, s.player.pos);
            if (d < shockRange) {
              s.player.hp -= e.damage * 0.4;
              s.events.push({ type: 'player_hit' });
            }
            for (let i = 0; i < 16; i++) {
              const angle = (Math.PI * 2 * i) / 16;
              s.deathParticles.push({
                id: nextId++,
                pos: { ...e.pos },
                vel: { x: Math.cos(angle) * 150, y: Math.sin(angle) * 150 },
                life: 0.3, maxLife: 0.3,
                color: '#ffd700', size: 4,
              });
            }
            s.events.push({ type: 'boss_ability' });
            break;
          }
        }
      }
    }
  }
}

export function updateGame(state: GameState, dt: number, input: { dx: number; dy: number }): GameState {
  if (state.gameOver || state.paused || state.pendingUpgrade) return state;

  const s = { ...state };
  s.time += dt;
  s.events = [];

  // Player movement
  const moveDir = normalize({ x: input.dx, y: input.dy });
  s.player = { ...s.player };
  s.player.vel = { x: moveDir.x * s.player.speed, y: moveDir.y * s.player.speed };
  s.player.pos = {
    x: Math.max(s.player.radius, Math.min(MAP_WIDTH - s.player.radius, s.player.pos.x + moveDir.x * s.player.speed * dt)),
    y: Math.max(s.player.radius, Math.min(MAP_HEIGHT - s.player.radius, s.player.pos.y + moveDir.y * s.player.speed * dt)),
  };
  s.camera = { ...s.player.pos };

  // Wave progression
  const isBossWave = s.wave % 5 === 0;
  s.isBossWave = isBossWave;

  const canAdvanceWave = !isBossWave || s.bossWaveCleared;

  if (canAdvanceWave && s.time > s.wave * 25) {
    s.wave++;
    s.spawnInterval = Math.max(0.3, s.spawnInterval * 0.9);

    if (s.wave % 5 === 0) {
      s.isBossWave = true;
      s.bossWaveCleared = false;
      s.enemies = [];
      const bossCount = Math.min(1 + Math.floor(s.wave / 15), 3);
      const variant = getBossVariantForWave(s.wave);
      for (let i = 0; i < bossCount; i++) {
        s.enemies.push(spawnEnemy(s, 'boss', variant));
      }
      s.events.push({ type: 'boss_spawn' });
    }
  }

  // Spawn enemies
  s.spawnTimer += dt;
  if (s.spawnTimer >= s.spawnInterval) {
    if (isBossWave) {
      const bossesAlive = s.enemies.filter(e => e.type === 'boss').length;
      if (bossesAlive === 0 && !s.bossWaveCleared) {
        s.bossWaveCleared = true;
      }
    } else {
      const maxEnemies = 30 + s.wave * 8;
      if (s.enemies.length < maxEnemies) {
        const spawnCount = Math.min(2 + Math.floor(s.wave / 2), 8);
        s.enemies = [...s.enemies];
        for (let i = 0; i < spawnCount; i++) {
          s.enemies.push(spawnEnemy(s));
        }
      }
    }
    s.spawnTimer = 0;
  }

  // Coin chest spawning
  s.coinSpawnTimer += dt;
  const coinInterval = Math.max(20, 35 - s.wave * 0.3);
  if (s.coinSpawnTimer >= coinInterval && s.coinChests.length < 3) {
    const pos = spawnPos(s, -200);
    s.coinChests = [...s.coinChests, {
      id: nextId++, pos,
      radius: 12,
      value: 3 + Math.floor(Math.random() * 4) + Math.floor(s.wave / 5),
    }];
    s.coinSpawnTimer = 0;
  }

  // Boss abilities
  updateBossAbilities(s, dt);

  // Update boss projectiles
  s.bossProjectiles = s.bossProjectiles
    .map(p => ({
      ...p,
      pos: { x: p.pos.x + p.vel.x * dt, y: p.pos.y + p.vel.y * dt },
      life: p.life - dt,
    }))
    .filter(p => p.life > 0);

  // Boss projectile-player collisions
  for (const bp of s.bossProjectiles) {
    if (dist(bp.pos, s.player.pos) < bp.radius + s.player.radius) {
      s.player.hp -= bp.damage;
      bp.life = 0;
      s.events.push({ type: 'player_hit' });
    }
  }
  s.bossProjectiles = s.bossProjectiles.filter(p => p.life > 0);

  // Auto-attack (ranged)
  s.player.attackTimer -= dt;
  if (s.player.attackTimer <= 0) {
    const target = findClosestEnemy(s);
    if (target) {
      const dir = normalize({
        x: target.pos.x - s.player.pos.x,
        y: target.pos.y - s.player.pos.y,
      });
      s.projectiles = [...s.projectiles, {
        id: nextId++,
        pos: { ...s.player.pos },
        vel: { x: dir.x * s.player.projectileSpeed, y: dir.y * s.player.projectileSpeed },
        damage: s.player.attackDamage, radius: 5,
        life: s.player.attackRange / s.player.projectileSpeed,
      }];
      s.player.attackTimer = s.player.attackCooldown;
      s.events.push({ type: 'shoot' });
    }
  }

  // Melee attack
  s.player.meleeTimer -= dt;
  s.player.meleeSwingTimer = Math.max(0, s.player.meleeSwingTimer - dt);

  if (s.player.meleeTimer <= 0) {
    const meleeTargets = s.enemies.filter(e =>
      dist(e.pos, s.player.pos) < s.player.meleeRange + e.radius
    );
    if (meleeTargets.length > 0) {
      s.player.meleeTimer = s.player.meleeCooldown;
      s.player.meleeSwingTimer = s.player.meleeSwingDuration;
      s.enemies = s.enemies.map(e => {
        if (dist(e.pos, s.player.pos) < s.player.meleeRange + e.radius) {
          const dmg = e.armor ? s.player.meleeDamage * (1 - e.armor) : s.player.meleeDamage;
          return { ...e, hp: e.hp - dmg, flashTimer: 0.1 };
        }
        return e;
      });
      s.events.push({ type: 'melee_swing' });
    }
  }

  // Class ability auto-cast
  s.player.abilityTimer -= dt;
  if (s.player.abilityTimer <= 0 && s.enemies.length > 0) {
    s.player.abilityTimer = s.player.abilityCooldown;
    executeClassAbility(s);
  }

  // Shield timer
  if (s.player.shieldActive) {
    s.player.shieldTimer -= dt;
    if (s.player.shieldTimer <= 0) {
      s.player.shieldActive = false;
    }
  }

  // Update summons (necromancer skeletons)
  if (s.summons.length > 0) {
    s.summons = s.summons.map(summon => {
      summon.life -= dt;
      // Find nearest enemy to attack
      let nearest: Enemy | null = null;
      let nearDist = Infinity;
      for (const e of s.enemies) {
        const d = dist(summon.pos, e.pos);
        if (d < nearDist) { nearest = e; nearDist = d; }
      }
      if (nearest) {
        const dir = normalize({ x: nearest.pos.x - summon.pos.x, y: nearest.pos.y - summon.pos.y });
        summon.pos = {
          x: summon.pos.x + dir.x * summon.speed * dt,
          y: summon.pos.y + dir.y * summon.speed * dt,
        };
        // Attack if close
        if (nearDist < summon.radius + nearest.radius + 5) {
          const dmg = nearest.armor ? summon.damage * dt * 2 * (1 - nearest.armor) : summon.damage * dt * 2;
          nearest.hp -= dmg;
          nearest.flashTimer = 0.05;
        }
      }
      return summon;
    }).filter(s => s.life > 0 && s.hp > 0);
  }
  // Update projectiles
  s.projectiles = s.projectiles
    .map(p => ({
      ...p,
      pos: { x: p.pos.x + p.vel.x * dt, y: p.pos.y + p.vel.y * dt },
      life: p.life - dt,
    }))
    .filter(p => p.life > 0);

  // Update enemies
  s.enemies = s.enemies.map(e => {
    const dir = normalize({
      x: s.player.pos.x - e.pos.x,
      y: s.player.pos.y - e.pos.y,
    });
    return {
      ...e,
      prevPos: { ...e.pos },
      pos: { x: e.pos.x + dir.x * e.speed * dt, y: e.pos.y + dir.y * e.speed * dt },
      flashTimer: Math.max(0, e.flashTimer - dt),
    };
  });

  // Update death particles
  s.deathParticles = s.deathParticles
    .map(p => ({
      ...p,
      pos: { x: p.pos.x + p.vel.x * dt, y: p.pos.y + p.vel.y * dt },
      vel: { x: p.vel.x * 0.95, y: p.vel.y * 0.95 + 100 * dt },
      life: p.life - dt,
    }))
    .filter(p => p.life > 0);

  // Projectile-enemy collisions
  const deadEnemyIds = new Set<number>();
  const deadProjIds = new Set<number>();
  const newOrbs: XpOrb[] = [];

  for (const p of s.projectiles) {
    for (const e of s.enemies) {
      if (deadEnemyIds.has(e.id) || deadProjIds.has(p.id)) continue;
      if (dist(p.pos, e.pos) < p.radius + e.radius) {
        applyDamage(e, p.damage);
        deadProjIds.add(p.id);
        s.events.push({ type: 'hit' });
        if (e.hp <= 0) {
          deadEnemyIds.add(e.id);
          s.score += e.type === 'boss' ? 100 : 10;
          s.events.push({ type: e.type === 'boss' ? 'boss_kill' : 'kill' });
          s.deathParticles.push(...spawnDeathParticles(e.pos, e.type, e.bossVariant));
          newOrbs.push({
            id: nextId++, pos: { ...e.pos },
            value: e.xpValue, radius: 6,
          });
          if (e.type === 'boss') {
            s.chests = [...s.chests, {
              id: nextId++, pos: { ...e.pos },
              radius: 18, collected: false,
            }];
          }
        }
        break;
      }
    }
  }

  // Check melee kills
  for (const e of s.enemies) {
    if (e.hp <= 0 && !deadEnemyIds.has(e.id)) {
      deadEnemyIds.add(e.id);
      s.score += e.type === 'boss' ? 100 : 10;
      s.events.push({ type: e.type === 'boss' ? 'boss_kill' : 'kill' });
      s.deathParticles.push(...spawnDeathParticles(e.pos, e.type, e.bossVariant));
      newOrbs.push({
        id: nextId++, pos: { ...e.pos },
        value: e.xpValue, radius: 6,
      });
      if (e.type === 'boss') {
        s.chests = [...s.chests, {
          id: nextId++, pos: { ...e.pos },
          radius: 18, collected: false,
        }];
      }
    }
  }

  s.projectiles = s.projectiles.filter(p => !deadProjIds.has(p.id));
  s.enemies = s.enemies.filter(e => !deadEnemyIds.has(e.id));
  s.xpOrbs = [...s.xpOrbs, ...newOrbs];

  // Enemy-player collisions
  let playerWasHit = false;
  const shieldMult = s.player.shieldActive ? 0.3 : 1;
  for (const e of s.enemies) {
    if (dist(e.pos, s.player.pos) < e.radius + s.player.radius) {
      s.player.hp -= e.damage * dt * shieldMult;
      playerWasHit = true;
    }
  }
  if (playerWasHit && Math.random() < dt * 3) {
    s.events.push({ type: 'player_hit' });
  }

  if (s.player.hp <= 0) {
    s.player.hp = 0;
    s.gameOver = true;
    return s;
  }

  // Chest collection
  for (const chest of s.chests) {
    if (!chest.collected && dist(chest.pos, s.player.pos) < s.player.radius + chest.radius) {
      chest.collected = true;
      s.pendingUpgrade = true;
      s.upgradeOptions = getBossUpgrades(3);
      s.events.push({ type: 'chest_open' });
    }
  }
  s.chests = s.chests.filter(c => !c.collected);

  // Coin chest collection
  const collectedCoins = new Set<number>();
  for (const cc of s.coinChests) {
    if (dist(cc.pos, s.player.pos) < s.player.radius + cc.radius) {
      s.coins += cc.value;
      collectedCoins.add(cc.id);
      s.events.push({ type: 'coin_collect' });
    }
  }
  s.coinChests = s.coinChests.filter(c => !collectedCoins.has(c.id));

  // XP orb collection
  const collectedOrbs = new Set<number>();
  for (const orb of s.xpOrbs) {
    if (dist(orb.pos, s.player.pos) < 80) {
      const dir = normalize({
        x: s.player.pos.x - orb.pos.x,
        y: s.player.pos.y - orb.pos.y,
      });
      orb.pos.x += dir.x * 300 * dt;
      orb.pos.y += dir.y * 300 * dt;
    }
    if (dist(orb.pos, s.player.pos) < s.player.radius + orb.radius) {
      s.player.xp += orb.value;
      collectedOrbs.add(orb.id);
    }
  }
  s.xpOrbs = s.xpOrbs.filter(o => !collectedOrbs.has(o.id));

  // Level up
  if (s.player.xp >= s.player.xpToNext) {
    s.player.xp -= s.player.xpToNext;
    s.player.level++;
    s.player.xpToNext = Math.floor(s.player.xpToNext * 1.5);
    s.pendingUpgrade = true;
    s.upgradeOptions = getRandomUpgrades(3);
    s.events.push({ type: 'level_up' });
  }

  return s;
}
