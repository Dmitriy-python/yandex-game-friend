import { GameState, MAP_WIDTH, MAP_HEIGHT, CharacterClass, BossVariant, BossVisual } from './types';
import playerImg from '@/assets/player.png';
import playerMageImg from '@/assets/player-mage.png';
import playerArcherImg from '@/assets/player-archer.png';
import playerKnightImg from '@/assets/player-knight.png';
import playerRogueImg from '@/assets/player-rogue.png';
import playerPriestImg from '@/assets/player-priest.png';
import playerBarbarianImg from '@/assets/player-barbarian.png';
import playerElfImg from '@/assets/player-elf.png';
import playerDwarfImg from '@/assets/player-dwarf.png';
import playerNecromancerImg from '@/assets/player-necromancer.png';
import enemyNormalImg from '@/assets/enemy-normal.png';
import enemyFastImg from '@/assets/enemy-fast.png';
import enemyTankImg from '@/assets/enemy-tank.png';
import enemyBossImg from '@/assets/enemy-boss.png';
import bossInfernalImg from '@/assets/boss-infernal.png';
import bossFrostImg from '@/assets/boss-frost.png';
import bossShadowImg from '@/assets/boss-shadow.png';
import bossThunderImg from '@/assets/boss-thunder.png';
import bossSkeletonImg from '@/assets/boss-skeleton.png';
import bossSpiderImg from '@/assets/boss-spider.png';
import bossDarkknightImg from '@/assets/boss-darkknight.png';
import bossChimeraImg from '@/assets/boss-chimera.png';
import groundMapImg from '@/assets/ground-map.png';

const images: Record<string, HTMLImageElement> = {};
let imagesLoaded = false;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function preloadImages(): Promise<void> {
  if (imagesLoaded) return;
  const srcs: Record<string, string> = {
    player: playerImg, playerMage: playerMageImg, playerArcher: playerArcherImg,
    playerKnight: playerKnightImg, playerRogue: playerRogueImg, playerPriest: playerPriestImg,
    playerBarbarian: playerBarbarianImg, playerElf: playerElfImg, playerDwarf: playerDwarfImg,
    playerNecromancer: playerNecromancerImg,
    enemyNormal: enemyNormalImg, enemyFast: enemyFastImg,
    enemyTank: enemyTankImg, enemyBoss: enemyBossImg,
    bossInfernal: bossInfernalImg, bossFrost: bossFrostImg,
    bossShadow: bossShadowImg, bossThunder: bossThunderImg,
    bossSkeleton: bossSkeletonImg, bossSpider: bossSpiderImg,
    bossDarkknight: bossDarkknightImg, bossChimera: bossChimeraImg,
    ground: groundMapImg,
  };
  const entries = Object.entries(srcs);
  const loaded = await Promise.all(entries.map(([, src]) => loadImage(src)));
  entries.forEach(([key], i) => { images[key] = loaded[i]; });
  imagesLoaded = true;
}

const playerSpriteMap: Record<CharacterClass, string> = {
  fighter: 'player',
  mage: 'playerMage',
  archer: 'playerArcher',
  knight: 'playerKnight',
  rogue: 'playerRogue',
  priest: 'playerPriest',
  barbarian: 'playerBarbarian',
  elf: 'playerElf',
  dwarf: 'playerDwarf',
  necromancer: 'playerNecromancer',
};

const bossSpriteMap: Record<BossVisual, string> = {
  infernal: 'bossInfernal',
  frost: 'bossFrost',
  shadow: 'bossShadow',
  thunder: 'bossThunder',
  skeleton: 'bossSkeleton',
  spider: 'bossSpider',
  darkknight: 'bossDarkknight',
  chimera: 'bossChimera',
};

const bossNameMap: Record<BossVisual, string> = {
  infernal: '🔥 Инфернал',
  frost: '❄️ Ледяной Дракон',
  shadow: '👁️ Теневой Призрак',
  thunder: '⚡ Громовой Голем',
  skeleton: '💀 Король Скелетов',
  spider: '🕷️ Паучиха',
  darkknight: '⚔️ Тёмный Рыцарь',
  chimera: '🦁 Химера',
};

function drawSprite(
  ctx: CanvasRenderingContext2D, type: string,
  x: number, y: number, size: number,
  rotation = 0, flash = false, scaleY = 1, flipX = false
) {
  const img = images[type];
  if (!img) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(flipX ? -1 : 1, scaleY);
  if (flash) ctx.filter = 'brightness(2) saturate(0)';
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawWalkingEntity(
  ctx: CanvasRenderingContext2D, sprite: string,
  x: number, y: number, size: number,
  dx: number, dy: number, time: number, entityId: number,
  flash = false, speedFactor = 1
) {
  const speed = Math.sqrt(dx * dx + dy * dy);
  const isMoving = speed > 0.5;
  const flipX = dx < -0.5;
  const moveFactor = isMoving ? Math.min(1, speed / 3) : 0;
  const freq = 10 * speedFactor;
  const phase = time * freq + entityId * 1.3;
  const bodyBob = moveFactor * Math.abs(Math.sin(phase)) * 3;
  const bodyLean = moveFactor * Math.sin(phase) * 0.04;
  const squash = 1 + moveFactor * Math.sin(phase * 2) * 0.03;
  const stretch = 1 - moveFactor * Math.sin(phase * 2) * 0.02;

  // Shadow
  ctx.save();
  ctx.translate(x, y + size * 0.35);
  ctx.scale(1, 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.3 * (1 - moveFactor * 0.1 * Math.abs(Math.sin(phase))), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.restore();

  // Legs
  if (isMoving) {
    const legLength = size * 0.2;
    const strideL = Math.sin(phase) * legLength * moveFactor;
    const strideR = Math.sin(phase + Math.PI) * legLength * moveFactor;
    const legY = y + size * 0.22;
    const legSpacing = size * 0.12;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - legSpacing, legY);
    ctx.lineTo(x - legSpacing + strideL * 0.5, legY + Math.abs(strideL) * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + legSpacing, legY);
    ctx.lineTo(x + legSpacing + strideR * 0.5, legY + Math.abs(strideR) * 0.3);
    ctx.stroke();
  }

  drawSprite(ctx, sprite, x, y - bodyBob, size, bodyLean, flash, squash * stretch, flipX);
}

// Boss aura colors per variant
const BOSS_AURA: Record<BossVariant, { color: string; glow: string }> = {
  infernal: { color: 'rgba(255,69,0,', glow: '#ff4500' },
  frost: { color: 'rgba(0,191,255,', glow: '#00bfff' },
  shadow: { color: 'rgba(139,0,255,', glow: '#8b00ff' },
  thunder: { color: 'rgba(255,215,0,', glow: '#ffd700' },
};

function drawBossAura(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, variant: BossVariant, time: number) {
  const aura = BOSS_AURA[variant];
  const pulse = 0.5 + Math.sin(time * 3) * 0.3;

  ctx.beginPath();
  ctx.arc(x, y, radius + 25 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
  ctx.strokeStyle = aura.color + (0.3 * pulse).toFixed(2) + ')';
  ctx.lineWidth = 3;
  ctx.shadowColor = aura.glow;
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const grad = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius + 20);
  grad.addColorStop(0, aura.color + '0.0)');
  grad.addColorStop(0.6, aura.color + (0.12 * pulse).toFixed(2) + ')');
  grad.addColorStop(1, aura.color + '0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius + 20, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const angle = time * 2 + (Math.PI * 2 * i) / 4;
    const orbitR = radius + 18;
    const px = x + Math.cos(angle) * orbitR;
    const py = y + Math.sin(angle) * orbitR;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = aura.glow;
    ctx.shadowColor = aura.glow;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (variant === 'thunder') {
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,215,0,' + (0.4 + Math.sin(time * 4) * 0.2).toFixed(2) + ')';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  if (!imagesLoaded) preloadImages();

  const cam = state.camera;
  const offsetX = canvasW / 2 - cam.x;
  const offsetY = canvasH / 2 - cam.y;

  // Background fill outside map
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Boss wave red tint
  if (state.isBossWave && !state.bossWaveCleared) {
    ctx.fillStyle = `rgba(220,38,38,${0.03 + Math.sin(state.time * 2) * 0.02})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Single ground map image
  if (images.ground) {
    ctx.drawImage(images.ground, 0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  // Map border
  ctx.strokeStyle = 'rgba(239,68,68,0.6)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // Death particles
  for (const p of state.deathParticles) {
    const alpha = p.life / p.maxLife;
    const size = p.size * alpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // XP orbs
  for (const orb of state.xpOrbs) {
    ctx.beginPath();
    ctx.arc(orb.pos.x, orb.pos.y, orb.radius, 0, Math.PI * 2);
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(orb.pos.x, orb.pos.y, orb.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#86efac';
    ctx.fill();
  }

  // Chests
  for (const chest of state.chests) {
    const bob = Math.sin(state.time * 3) * 3;
    ctx.save();
    ctx.translate(chest.pos.x, chest.pos.y + bob);
    ctx.beginPath();
    ctx.arc(0, 0, chest.radius + 10, 0, Math.PI * 2);
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(251,191,36,0.2)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-14, -10, 28, 10);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-14, -2, 28, 4);
    ctx.fillRect(-3, -10, 6, 20);
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    ctx.restore();
  }

  // Coin chests
  for (const cc of state.coinChests) {
    const bob = Math.sin(state.time * 4 + cc.id) * 2;
    ctx.save();
    ctx.translate(cc.pos.x, cc.pos.y + bob);
    ctx.beginPath();
    ctx.arc(0, 0, cc.radius + 6, 0, Math.PI * 2);
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(251,191,36,0.15)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, cc.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, cc.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = `bold ${cc.radius * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);
    ctx.restore();
  }

  // Enemies
  const enemySprites: Record<string, { sprite: string; size: number }> = {
    normal: { sprite: 'enemyNormal', size: 50 },
    fast: { sprite: 'enemyFast', size: 35 },
    tank: { sprite: 'enemyTank', size: 70 },
    boss: { sprite: 'enemyBoss', size: 100 },
  };

  for (const e of state.enemies) {
    const dx = e.pos.x - e.prevPos.x;
    const dy = e.pos.y - e.prevPos.y;

    // Boss rendering with unique sprites
    if (e.type === 'boss') {
      if (e.bossVariant) {
        drawBossAura(ctx, e.pos.x, e.pos.y, e.radius, e.bossVariant, state.time);
      }

      // Use unique boss sprite based on bossVisual
      const bossSprite = e.bossVisual ? bossSpriteMap[e.bossVisual] : 'enemyBoss';
      const speedFactor = 0.5;
      drawWalkingEntity(
        ctx, bossSprite,
        e.pos.x, e.pos.y, 100,
        dx, dy, state.time, e.id,
        e.flashTimer > 0, speedFactor
      );

      // HP bar
      if (e.hp < e.maxHp) {
        const barW = 80;
        const barH = 8;
        const barX = e.pos.x - barW / 2;
        const barY = e.pos.y - e.radius - 35;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 3);
        ctx.fill();
        const hpPercent = e.hp / e.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * hpPercent, barH, 2);
        ctx.fill();

        // Boss name label — use bossVisual for name
        const visual = e.bossVisual || e.bossVariant;
        if (visual) {
          const name = e.bossVisual ? bossNameMap[e.bossVisual] : (e.bossVariant ? bossNameMap[e.bossVariant] || '' : '');
          const auraGlow = e.bossVariant ? BOSS_AURA[e.bossVariant].glow : '#ff4444';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = auraGlow;
          ctx.fillText(name, e.pos.x, barY - 6);
        }
      }
    } else {
      // Regular enemies
      const config = enemySprites[e.type];
      const speedFactor = e.type === 'fast' ? 1.6 : e.type === 'tank' ? 0.6 : 1;
      drawWalkingEntity(
        ctx, config.sprite,
        e.pos.x, e.pos.y, config.size,
        dx, dy, state.time, e.id,
        e.flashTimer > 0, speedFactor
      );

      // HP bar for non-boss
      if (e.hp < e.maxHp) {
        const barW = e.type === 'tank' ? 60 : 40;
        const barH = 5;
        const barX = e.pos.x - barW / 2;
        const barY = e.pos.y - e.radius - 12;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 3);
        ctx.fill();
        const hpPercent = e.hp / e.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * hpPercent, barH, 2);
        ctx.fill();
      }
    }
  }

  // Boss projectiles
  for (const bp of state.bossProjectiles) {
    ctx.beginPath();
    ctx.arc(bp.pos.x, bp.pos.y, bp.radius, 0, Math.PI * 2);
    ctx.fillStyle = bp.color;
    ctx.shadowColor = bp.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(bp.pos.x, bp.pos.y);
    ctx.lineTo(bp.pos.x - bp.vel.x * 0.04, bp.pos.y - bp.vel.y * 0.04);
    ctx.strokeStyle = bp.color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = bp.radius * 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Player projectiles — class-specific visuals
  const projStyles: Record<CharacterClass, { color: string; glow: string; trail: string; size: number }> = {
    fighter: { color: '#94a3b8', glow: '#64748b', trail: 'rgba(148,163,184,0.4)', size: 4 },
    mage: { color: '#ff6b35', glow: '#ff4500', trail: 'rgba(255,107,53,0.5)', size: 7 },
    archer: { color: '#22c55e', glow: '#16a34a', trail: 'rgba(34,197,94,0.3)', size: 3 },
    knight: { color: '#e2e8f0', glow: '#94a3b8', trail: 'rgba(226,232,240,0.4)', size: 5 },
    rogue: { color: '#f43f5e', glow: '#e11d48', trail: 'rgba(244,63,94,0.3)', size: 3 },
    priest: { color: '#fbbf24', glow: '#f59e0b', trail: 'rgba(251,191,36,0.4)', size: 6 },
    barbarian: { color: '#f97316', glow: '#ea580c', trail: 'rgba(249,115,22,0.4)', size: 5 },
    elf: { color: '#34d399', glow: '#10b981', trail: 'rgba(52,211,153,0.3)', size: 3 },
    dwarf: { color: '#a78bfa', glow: '#7c3aed', trail: 'rgba(167,139,250,0.4)', size: 6 },
    necromancer: { color: '#a855f7', glow: '#7c3aed', trail: 'rgba(168,85,247,0.5)', size: 6 },
  };
  const pStyle = projStyles[state.player.characterClass];

  for (const proj of state.projectiles) {
    // Trail
    ctx.beginPath();
    ctx.moveTo(proj.pos.x, proj.pos.y);
    ctx.lineTo(proj.pos.x - proj.vel.x * 0.04, proj.pos.y - proj.vel.y * 0.04);
    ctx.strokeStyle = pStyle.trail;
    ctx.lineWidth = pStyle.size * 0.8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Main projectile
    ctx.beginPath();
    ctx.arc(proj.pos.x, proj.pos.y, pStyle.size, 0, Math.PI * 2);
    ctx.shadowColor = pStyle.glow;
    ctx.shadowBlur = 14;
    ctx.fillStyle = pStyle.color;
    ctx.fill();

    // Inner highlight for mage (fireball effect)
    if (state.player.characterClass === 'mage') {
      ctx.beginPath();
      ctx.arc(proj.pos.x, proj.pos.y, pStyle.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      // Outer fire particles
      for (let i = 0; i < 3; i++) {
        const angle = state.time * 12 + i * 2.1 + proj.pos.x * 0.01;
        const ox = Math.cos(angle) * pStyle.size * 0.8;
        const oy = Math.sin(angle) * pStyle.size * 0.8;
        ctx.beginPath();
        ctx.arc(proj.pos.x + ox, proj.pos.y + oy, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      }
    }

    // Necromancer: skull-like effect
    if (state.player.characterClass === 'necromancer') {
      ctx.beginPath();
      ctx.arc(proj.pos.x, proj.pos.y, pStyle.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#e9d5ff';
      ctx.fill();
    }

    // Priest: holy glow ring
    if (state.player.characterClass === 'priest') {
      ctx.beginPath();
      ctx.arc(proj.pos.x, proj.pos.y, pStyle.size + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251,191,36,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  // Summons (necromancer skeletons)
  for (const summon of state.summons) {
    const alpha = Math.min(1, summon.life / 1);
    ctx.globalAlpha = alpha;
    // Shadow
    ctx.save();
    ctx.translate(summon.pos.x, summon.pos.y + summon.radius + 4);
    ctx.scale(1, 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, summon.radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(124,58,237,0.3)';
    ctx.fill();
    ctx.restore();
    // Body
    ctx.beginPath();
    ctx.arc(summon.pos.x, summon.pos.y, summon.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#a78bfa';
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Eyes
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(summon.pos.x - 3, summon.pos.y - 2, 2, 0, Math.PI * 2);
    ctx.arc(summon.pos.x + 3, summon.pos.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Player
  const p = state.player;
  const playerSprite = playerSpriteMap[p.characterClass];

  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.attackRange, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(59,130,246,0.05)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Shield visual (knight ability)
  if (p.shieldActive) {
    const shieldPulse = 0.6 + Math.sin(state.time * 6) * 0.2;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius + 25, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(148,163,184,${shieldPulse})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#94a3b8';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius + 25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(148,163,184,${shieldPulse * 0.15})`;
    ctx.fill();
  }

  if (p.meleeSwingTimer > 0) {
    const progress = 1 - (p.meleeSwingTimer / p.meleeSwingDuration);
    const startAngle = progress * Math.PI * 2 - Math.PI;
    const endAngle = startAngle + Math.PI * 1.2;
    const alpha = p.meleeSwingTimer / p.meleeSwingDuration;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.meleeRange, startAngle, endAngle);
    ctx.strokeStyle = `rgba(251,191,36,${alpha * 0.8})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(p.pos.x, p.pos.y);
    ctx.arc(p.pos.x, p.pos.y, p.meleeRange, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = `rgba(251,191,36,${alpha * 0.15})`;
    ctx.fill();
  }

  const glowColors: Record<CharacterClass, string> = {
    fighter: '#3b82f6',
    mage: '#8b5cf6',
    archer: '#22c55e',
    knight: '#94a3b8',
    rogue: '#f43f5e',
    priest: '#fbbf24',
    barbarian: '#f97316',
    elf: '#10b981',
    dwarf: '#a78bfa',
    necromancer: '#7c3aed',
  };
  const glowColor = glowColors[p.characterClass];
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.radius + 15, 0, Math.PI * 2);
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 25;
  ctx.fillStyle = `${glowColor}33`;
  ctx.fill();
  ctx.shadowBlur = 0;

  drawWalkingEntity(
    ctx, playerSprite,
    p.pos.x, p.pos.y, 60,
    p.vel.x, p.vel.y, state.time, 0,
    false, 1
  );

  ctx.restore();

  // Boss wave banner
  if (state.isBossWave && !state.bossWaveCleared) {
    const bannerAlpha = Math.min(1, Math.abs(Math.sin(state.time * 1.5)));
    ctx.save();
    ctx.fillStyle = `rgba(220,38,38,${bannerAlpha * 0.9})`;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ БОСС-ВОЛНА ⚠️', canvasW / 2, canvasH - 50);
    ctx.restore();
  }
}
