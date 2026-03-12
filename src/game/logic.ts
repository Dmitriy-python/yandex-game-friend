import { GameState, Enemy, EnemyType, Projectile, XpOrb, MAP_WIDTH, MAP_HEIGHT, Vec2 } from './types';
import { getRandomUpgrades } from './upgrades';

let nextId = 1;

export function createInitialState(): GameState {
  return {
    player: {
      pos: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
      hp: 100,
      maxHp: 100,
      speed: 200,
      xp: 0,
      xpToNext: 10,
      level: 1,
      attackCooldown: 0.5,
      attackTimer: 0,
      attackDamage: 20,
      attackRange: 300,
      projectileSpeed: 400,
      radius: 16,
    },
    enemies: [],
    projectiles: [],
    xpOrbs: [],
    time: 0,
    score: 0,
    wave: 1,
    spawnTimer: 0,
    spawnInterval: 1.5,
    gameOver: false,
    paused: false,
    pendingUpgrade: false,
    upgradeOptions: [],
    camera: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
  };
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function spawnEnemy(state: GameState): Enemy {
  const angle = Math.random() * Math.PI * 2;
  const spawnDist = 500 + Math.random() * 200;
  const waveMultiplier = 1 + (state.wave - 1) * 0.15;
  
  return {
    id: nextId++,
    pos: {
      x: Math.max(0, Math.min(MAP_WIDTH, state.player.pos.x + Math.cos(angle) * spawnDist)),
      y: Math.max(0, Math.min(MAP_HEIGHT, state.player.pos.y + Math.sin(angle) * spawnDist)),
    },
    hp: 30 * waveMultiplier,
    maxHp: 30 * waveMultiplier,
    speed: 60 + Math.random() * 40 + state.wave * 3,
    damage: 10 + state.wave * 2,
    radius: 12 + Math.random() * 6,
    xpValue: 1 + Math.floor(state.wave / 3),
    flashTimer: 0,
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

  // Player movement
  const moveDir = normalize({ x: input.dx, y: input.dy });
  s.player = { ...s.player };
  s.player.pos = {
    x: Math.max(s.player.radius, Math.min(MAP_WIDTH - s.player.radius, s.player.pos.x + moveDir.x * s.player.speed * dt)),
    y: Math.max(s.player.radius, Math.min(MAP_HEIGHT - s.player.radius, s.player.pos.y + moveDir.y * s.player.speed * dt)),
  };

  // Camera follows player
  s.camera = { ...s.player.pos };

  // Spawn enemies
  s.spawnTimer += dt;
  const maxEnemies = 30 + s.wave * 10;
  if (s.spawnTimer >= s.spawnInterval && s.enemies.length < maxEnemies) {
    const spawnCount = Math.min(2 + Math.floor(s.wave / 2), 8);
    s.enemies = [...s.enemies];
    for (let i = 0; i < spawnCount; i++) {
      s.enemies.push(spawnEnemy(s));
    }
    s.spawnTimer = 0;
  }

  // Wave progression
  if (s.time > s.wave * 30) {
    s.wave++;
    s.spawnInterval = Math.max(0.3, s.spawnInterval * 0.9);
  }

  // Auto-attack
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
        damage: s.player.attackDamage,
        radius: 5,
        life: s.player.attackRange / s.player.projectileSpeed,
      }];
      s.player.attackTimer = s.player.attackCooldown;
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
      pos: {
        x: e.pos.x + dir.x * e.speed * dt,
        y: e.pos.y + dir.y * e.speed * dt,
      },
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
        if (e.hp <= 0) {
          deadEnemyIds.add(e.id);
          s.score += 10;
          newOrbs.push({
            id: nextId++,
            pos: { ...e.pos },
            value: e.xpValue,
            radius: 6,
          });
        }
        break;
      }
    }
  }

  s.projectiles = s.projectiles.filter(p => !deadProjIds.has(p.id));
  s.enemies = s.enemies.filter(e => !deadEnemyIds.has(e.id));
  s.xpOrbs = [...s.xpOrbs, ...newOrbs];

  // Enemy-player collisions
  for (const e of s.enemies) {
    if (dist(e.pos, s.player.pos) < e.radius + s.player.radius) {
      s.player.hp -= e.damage * dt;
    }
  }

  if (s.player.hp <= 0) {
    s.player.hp = 0;
    s.gameOver = true;
    return s;
  }

  // XP orb collection
  const collectedOrbs = new Set<number>();
  for (const orb of s.xpOrbs) {
    if (dist(orb.pos, s.player.pos) < 80) {
      // Magnet effect - move toward player
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
  }

  return s;
}
