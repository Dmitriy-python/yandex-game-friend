import { GameState, Vec2, CharacterClass, Enemy, DeathParticle } from './types';

let nextAbilityId = 100000;

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

// Ability cooldowns per class (seconds)
export const CLASS_ABILITY_COOLDOWNS: Record<CharacterClass, number> = {
  fighter: 6,
  mage: 5,
  archer: 4,
  knight: 8,
  rogue: 5,
  priest: 7,
  barbarian: 6,
  elf: 4,
  dwarf: 7,
  necromancer: 8,
};

export const CLASS_ABILITY_NAMES: Record<CharacterClass, string> = {
  fighter: 'Мощный удар',
  mage: 'Огненный шар',
  archer: 'Залп стрел',
  knight: 'Щит',
  rogue: 'Теневой рывок',
  priest: 'Исцеление',
  barbarian: 'Вихрь',
  elf: 'Дождь стрел',
  dwarf: 'Удар по земле',
  necromancer: 'Призыв скелетов',
};

function findClosestEnemy(state: GameState, range: number): Enemy | null {
  let closest: Enemy | null = null;
  let closestDist = Infinity;
  for (const e of state.enemies) {
    const d = dist(state.player.pos, e.pos);
    if (d < closestDist && d <= range) {
      closest = e;
      closestDist = d;
    }
  }
  return closest;
}

function spawnAbilityParticles(pos: Vec2, color: string, count: number, speed: number, life: number, size: number): DeathParticle[] {
  const particles: DeathParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const s = speed * (0.7 + Math.random() * 0.6);
    const l = life * (0.8 + Math.random() * 0.4);
    particles.push({
      id: nextAbilityId++,
      pos: { x: pos.x + (Math.random() - 0.5) * 10, y: pos.y + (Math.random() - 0.5) * 10 },
      vel: { x: Math.cos(angle) * s, y: Math.sin(angle) * s },
      life: l, maxLife: l,
      color, size: size * (0.8 + Math.random() * 0.4),
    });
  }
  return particles;
}

export function executeClassAbility(s: GameState): void {
  const p = s.player;
  const cls = p.characterClass;

  s.events.push({ type: 'ability_use' });

  switch (cls) {
    case 'fighter': {
      // Power Strike: huge melee hit on all enemies in range
      const range = p.meleeRange * 2;
      let hitAny = false;
      s.enemies = s.enemies.map(e => {
        if (dist(e.pos, p.pos) < range + e.radius) {
          hitAny = true;
          const dmg = e.armor ? p.meleeDamage * 3 * (1 - e.armor) : p.meleeDamage * 3;
          return { ...e, hp: e.hp - dmg, flashTimer: 0.15 };
        }
        return e;
      });
      if (hitAny) s.events.push({ type: 'hit' });
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#3b82f6', 16, 180, 0.4, 5));
      p.meleeSwingTimer = 0.4;
      break;
    }

    case 'mage': {
      // Fireball: AoE explosion at nearest enemy
      const target = findClosestEnemy(s, p.attackRange * 1.5);
      const center = target ? { ...target.pos } : {
        x: p.pos.x + (Math.random() - 0.5) * 200,
        y: p.pos.y + (Math.random() - 0.5) * 200,
      };
      const aoeRange = 120;
      s.enemies = s.enemies.map(e => {
        if (dist(e.pos, center) < aoeRange) {
          const dmg = e.armor ? p.attackDamage * 2.5 * (1 - e.armor) : p.attackDamage * 2.5;
          return { ...e, hp: e.hp - dmg, flashTimer: 0.15 };
        }
        return e;
      });
      s.deathParticles.push(...spawnAbilityParticles(center, '#ff4500', 20, 200, 0.5, 6));
      s.deathParticles.push(...spawnAbilityParticles(center, '#fbbf24', 10, 150, 0.3, 4));
      break;
    }

    case 'archer': {
      // Multi-shot: 7 arrows in a cone
      const target = findClosestEnemy(s, p.attackRange);
      const baseDir = target
        ? normalize({ x: target.pos.x - p.pos.x, y: target.pos.y - p.pos.y })
        : { x: 1, y: 0 };
      for (let i = -3; i <= 3; i++) {
        const spread = i * 0.15;
        const dx = baseDir.x * Math.cos(spread) - baseDir.y * Math.sin(spread);
        const dy = baseDir.x * Math.sin(spread) + baseDir.y * Math.cos(spread);
        s.projectiles.push({
          id: nextAbilityId++,
          pos: { ...p.pos },
          vel: { x: dx * p.projectileSpeed * 1.3, y: dy * p.projectileSpeed * 1.3 },
          damage: p.attackDamage * 1.2,
          radius: 5,
          life: p.attackRange / p.projectileSpeed + 0.3,
        });
      }
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#22c55e', 8, 100, 0.2, 3));
      break;
    }

    case 'knight': {
      // Shield Wall: damage reduction for 4 seconds
      p.shieldActive = true;
      p.shieldTimer = 4;
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#94a3b8', 12, 120, 0.4, 5));
      break;
    }

    case 'rogue': {
      // Shadow Dash: teleport behind nearest enemy + backstab
      const target = findClosestEnemy(s, 400);
      if (target) {
        const dir = normalize({ x: target.pos.x - p.pos.x, y: target.pos.y - p.pos.y });
        // Teleport behind enemy
        p.pos = {
          x: target.pos.x + dir.x * 40,
          y: target.pos.y + dir.y * 40,
        };
        const dmg = target.armor ? p.meleeDamage * 4 * (1 - target.armor) : p.meleeDamage * 4;
        target.hp -= dmg;
        target.flashTimer = 0.2;
        s.events.push({ type: 'hit' });
      }
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#f43f5e', 14, 160, 0.3, 4));
      break;
    }

    case 'priest': {
      // Heal: restore 40% max HP
      const healAmount = p.maxHp * 0.4;
      p.hp = Math.min(p.maxHp, p.hp + healAmount);
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#fbbf24', 16, 80, 0.6, 5));
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#fef3c7', 8, 60, 0.4, 3));
      break;
    }

    case 'barbarian': {
      // Whirlwind: massive AoE circular damage
      const whirlRange = p.meleeRange * 2.5;
      s.enemies = s.enemies.map(e => {
        if (dist(e.pos, p.pos) < whirlRange + e.radius) {
          const dmg = e.armor ? p.meleeDamage * 2 * (1 - e.armor) : p.meleeDamage * 2;
          return { ...e, hp: e.hp - dmg, flashTimer: 0.15 };
        }
        return e;
      });
      p.meleeSwingTimer = 0.5;
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#f97316', 24, 200, 0.5, 6));
      break;
    }

    case 'elf': {
      // Arrow Rain: fire 12 arrows in all directions
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        s.projectiles.push({
          id: nextAbilityId++,
          pos: { ...p.pos },
          vel: { x: Math.cos(angle) * p.projectileSpeed, y: Math.sin(angle) * p.projectileSpeed },
          damage: p.attackDamage * 1.5,
          radius: 5,
          life: p.attackRange / p.projectileSpeed + 0.2,
        });
      }
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#10b981', 10, 130, 0.3, 4));
      break;
    }

    case 'dwarf': {
      // Ground Slam: stuns + damages nearby, slows enemies
      const slamRange = 140;
      s.enemies = s.enemies.map(e => {
        if (dist(e.pos, p.pos) < slamRange + e.radius) {
          const dmg = e.armor ? p.meleeDamage * 2.5 * (1 - e.armor) : p.meleeDamage * 2.5;
          // Slow enemies by halving speed temporarily
          return { ...e, hp: e.hp - dmg, flashTimer: 0.3, speed: e.speed * 0.4 };
        }
        return e;
      });
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#a78bfa', 20, 180, 0.5, 7));
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#7c3aed', 10, 100, 0.3, 4));
      break;
    }

    case 'necromancer': {
      // Summon Skeletons: spawn 4 friendly minions that fight enemies
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
        const spawnDist = 50 + Math.random() * 30;
        const summonPos = {
          x: p.pos.x + Math.cos(angle) * spawnDist,
          y: p.pos.y + Math.sin(angle) * spawnDist,
        };
        s.summons.push({
          id: nextAbilityId++,
          pos: summonPos,
          hp: 50 + p.level * 5,
          maxHp: 50 + p.level * 5,
          damage: p.attackDamage * 0.6,
          speed: 120,
          radius: 10,
          life: 8, // exists for 8 seconds
          targetId: undefined,
        });
      }
      s.deathParticles.push(...spawnAbilityParticles(p.pos, '#7c3aed', 16, 100, 0.5, 5));
      break;
    }
  }
}
