import { GameState, Enemy, EnemyType, BossVariant, Projectile, XpOrb, Chest, MAP_WIDTH, MAP_HEIGHT, Vec2, GameEvent, CharacterClass } from './types';
import { getRandomUpgrades, getBossUpgrades } from './upgrades';

let nextId = 1;

const BOSS_VARIANTS: BossVariant[] = ['infernal', 'frost', 'shadow', 'thunder'];

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
    },
    enemies: [], projectiles: [], xpOrbs: [], chests: [],
    time: 0, score: 0, wave: 1,
    spawnTimer: 0, spawnInterval: 1.5,
    gameOver: false, paused: false,
    pendingUpgrade: false, upgradeOptions: [],
    camera: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
    isBossWave: false, bossWaveCleared: false,
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

function spawnEnemy(state: GameState, forceType?: EnemyType, bossVariant?: BossVariant): Enemy {
  const wm = 1 + (state.wave - 1) * 0.15;

  let type: EnemyType = forceType || 'normal';
  if (!forceType) {
    const roll = Math.random();
    if (state.wave >= 3 && roll < 0.2) type = 'fast';
    else if (state.wave >= 4 && roll < 0.35) type = 'tank';
  }

  const configs: Record<EnemyType, Omit<Enemy, 'id' | 'pos' | 'prevPos' | 'flashTimer' | 'type' | 'bossVariant'>> = {
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
      hp: 500 * wm, maxHp: 500 * wm,
      speed: 45 + state.wave,
      damage: 30 + state.wave * 4, radius: 36,
      xpValue: 20 + state.wave * 2,
    },
  };

  const cfg = configs[type];
  const pos = spawnPos(state, type === 'boss' ? 200 : 0);
  return {
    id: nextId++, type, pos, prevPos: { ...pos },
    ...cfg, flashTimer: 0,
    bossVariant: type === 'boss' ? (bossVariant || getBossVariantForWave(state.wave)) : undefined,
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
  };
  s.camera = { ...s.player.pos };

  // Wave progression
  const isBossWave = s.wave % 5 === 0;
  s.isBossWave = isBossWave;

  if (s.time > s.wave * 25) {
    s.wave++;
    s.spawnInterval = Math.max(0.3, s.spawnInterval * 0.9);

    // Check if entering a boss wave
    if (s.wave % 5 === 0) {
      s.isBossWave = true;
      s.bossWaveCleared = false;
      // Clear normal enemies for boss wave
      s.enemies = [];
      // Spawn bosses
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
      // During boss wave, only check if bosses are alive
      const bossesAlive = s.enemies.filter(e => e.type === 'boss').length;
      if (bossesAlive === 0 && !s.bossWaveCleared) {
        s.bossWaveCleared = true;
        // Drop chest at center of where bosses died
        s.chests = [...s.chests, {
          id: nextId++,
          pos: { ...s.player.pos },
          radius: 18,
          collected: false,
        }];
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
    // Check for enemies in melee range
    const meleeTargets = s.enemies.filter(e =>
      dist(e.pos, s.player.pos) < s.player.meleeRange + e.radius
    );
    if (meleeTargets.length > 0) {
      s.player.meleeTimer = s.player.meleeCooldown;
      s.player.meleeSwingTimer = s.player.meleeSwingDuration;
      s.enemies = s.enemies.map(e => {
        if (dist(e.pos, s.player.pos) < s.player.meleeRange + e.radius) {
          return { ...e, hp: e.hp - s.player.meleeDamage, flashTimer: 0.1 };
        }
        return e;
      });
      s.events.push({ type: 'melee_swing' });
    }
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

  // Projectile-enemy collisions
  const deadEnemyIds = new Set<number>();
  const deadProjIds = new Set<number>();
  const newOrbs: XpOrb[] = [];

  for (const p of s.projectiles) {
    for (const e of s.enemies) {
      if (deadEnemyIds.has(e.id) || deadProjIds.has(p.id)) continue;
      if (dist(p.pos, e.pos) < p.radius + e.radius) {
        e.hp -= p.damage;
        e.flashTimer = 0.1;
        deadProjIds.add(p.id);
        s.events.push({ type: 'hit' });
        if (e.hp <= 0) {
          deadEnemyIds.add(e.id);
          s.score += e.type === 'boss' ? 100 : 10;
          s.events.push({ type: 'kill' });
          newOrbs.push({
            id: nextId++, pos: { ...e.pos },
            value: e.xpValue, radius: 6,
          });
          // Boss drops chest
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

  // Check melee kills from previous melee damage
  for (const e of s.enemies) {
    if (e.hp <= 0 && !deadEnemyIds.has(e.id)) {
      deadEnemyIds.add(e.id);
      s.score += e.type === 'boss' ? 100 : 10;
      s.events.push({ type: 'kill' });
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
  for (const e of s.enemies) {
    if (dist(e.pos, s.player.pos) < e.radius + s.player.radius) {
      s.player.hp -= e.damage * dt;
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
