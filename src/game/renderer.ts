import { GameState, MAP_WIDTH, MAP_HEIGHT, CharacterClass, BossVariant } from './types';
import playerImg from '@/assets/player.png';
import playerMageImg from '@/assets/player-mage.png';
import playerArcherImg from '@/assets/player-archer.png';
import enemyNormalImg from '@/assets/enemy-normal.png';
import enemyFastImg from '@/assets/enemy-fast.png';
import enemyTankImg from '@/assets/enemy-tank.png';
import enemyBossImg from '@/assets/enemy-boss.png';
import groundTileImg from '@/assets/ground-tile.png';

const GRID_SIZE = 80;
const TILE_SIZE = 256;

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
  const [player, mage, archer, normal, fast, tank, boss, ground] = await Promise.all([
    loadImage(playerImg), loadImage(playerMageImg), loadImage(playerArcherImg),
    loadImage(enemyNormalImg), loadImage(enemyFastImg),
    loadImage(enemyTankImg), loadImage(enemyBossImg),
    loadImage(groundTileImg),
  ]);
  images.player = player;
  images.playerMage = mage;
  images.playerArcher = archer;
  images.enemyNormal = normal;
  images.enemyFast = fast;
  images.enemyTank = tank;
  images.enemyBoss = boss;
  images.ground = ground;
  imagesLoaded = true;
}

const playerSpriteMap: Record<CharacterClass, string> = {
  fighter: 'player',
  mage: 'playerMage',
  archer: 'playerArcher',
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

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(x, y, radius + 25 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
  ctx.strokeStyle = aura.color + (0.3 * pulse).toFixed(2) + ')';
  ctx.lineWidth = 3;
  ctx.shadowColor = aura.glow;
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner aura fill
  const grad = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius + 20);
  grad.addColorStop(0, aura.color + '0.0)');
  grad.addColorStop(0.6, aura.color + (0.12 * pulse).toFixed(2) + ')');
  grad.addColorStop(1, aura.color + '0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius + 20, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting particles
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

  // Armor indicator for thunder boss
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

  // Background
  const gradient = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 0, canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH));
  gradient.addColorStop(0, '#1a2035');
  gradient.addColorStop(1, '#0f1218');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Boss wave red tint
  if (state.isBossWave && !state.bossWaveCleared) {
    ctx.fillStyle = `rgba(220,38,38,${0.03 + Math.sin(state.time * 2) * 0.02})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Ground tiles
  if (images.ground) {
    const startTX = Math.max(0, Math.floor((cam.x - canvasW / 2) / TILE_SIZE));
    const endTX = Math.min(Math.ceil(MAP_WIDTH / TILE_SIZE), Math.ceil((cam.x + canvasW / 2) / TILE_SIZE));
    const startTY = Math.max(0, Math.floor((cam.y - canvasH / 2) / TILE_SIZE));
    const endTY = Math.min(Math.ceil(MAP_HEIGHT / TILE_SIZE), Math.ceil((cam.y + canvasH / 2) / TILE_SIZE));
    for (let tx = startTX; tx < endTX; tx++) {
      for (let ty = startTY; ty < endTY; ty++) {
        ctx.drawImage(images.ground, tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  // Grid overlay
  ctx.strokeStyle = 'rgba(139,92,246,0.06)';
  ctx.lineWidth = 1;
  const startX = Math.max(0, Math.floor((cam.x - canvasW / 2) / GRID_SIZE) * GRID_SIZE);
  const endX = Math.min(MAP_WIDTH, cam.x + canvasW / 2 + GRID_SIZE);
  const startY = Math.max(0, Math.floor((cam.y - canvasH / 2) / GRID_SIZE) * GRID_SIZE);
  const endY = Math.min(MAP_HEIGHT, cam.y + canvasH / 2 + GRID_SIZE);
  for (let x = startX; x <= endX; x += GRID_SIZE) {
    ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
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

  // Enemies
  const enemySprites: Record<string, { sprite: string; size: number }> = {
    normal: { sprite: 'enemyNormal', size: 50 },
    fast: { sprite: 'enemyFast', size: 35 },
    tank: { sprite: 'enemyTank', size: 70 },
    boss: { sprite: 'enemyBoss', size: 100 },
  };

  for (const e of state.enemies) {
    const config = enemySprites[e.type];
    const dx = e.pos.x - e.prevPos.x;
    const dy = e.pos.y - e.prevPos.y;

    // Boss aura with variant-specific visuals
    if (e.type === 'boss' && e.bossVariant) {
      drawBossAura(ctx, e.pos.x, e.pos.y, e.radius, e.bossVariant, state.time);
    }

    const speedFactor = e.type === 'fast' ? 1.6 : e.type === 'tank' ? 0.6 : e.type === 'boss' ? 0.5 : 1;
    drawWalkingEntity(
      ctx, config.sprite,
      e.pos.x, e.pos.y, config.size,
      dx, dy, state.time, e.id,
      e.flashTimer > 0, speedFactor
    );

    // HP bar
    if (e.hp < e.maxHp) {
      const barW = e.type === 'boss' ? 80 : e.type === 'tank' ? 60 : 40;
      const barH = e.type === 'boss' ? 8 : 5;
      const barX = e.pos.x - barW / 2;
      const barY = e.pos.y - e.radius - (e.type === 'boss' ? 35 : 12);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 3);
      ctx.fill();
      const hpPercent = e.hp / e.maxHp;
      ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * hpPercent, barH, 2);
      ctx.fill();

      // Boss name label
      if (e.type === 'boss' && e.bossVariant) {
        const names: Record<BossVariant, string> = {
          infernal: '🔥 Инфернал',
          frost: '❄️ Морозный',
          shadow: '👁️ Теневой',
          thunder: '⚡ Громовой',
        };
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = BOSS_AURA[e.bossVariant].glow;
        ctx.fillText(names[e.bossVariant], e.pos.x, barY - 6);
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
    // Trail
    ctx.beginPath();
    ctx.moveTo(bp.pos.x, bp.pos.y);
    ctx.lineTo(bp.pos.x - bp.vel.x * 0.04, bp.pos.y - bp.vel.y * 0.04);
    ctx.strokeStyle = bp.color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = bp.radius * 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Player projectiles
  for (const p of state.projectiles) {
    ctx.beginPath();
    ctx.moveTo(p.pos.x, p.pos.y);
    ctx.lineTo(p.pos.x - p.vel.x * 0.03, p.pos.y - p.vel.y * 0.03);
    ctx.strokeStyle = 'rgba(250,204,21,0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Player
  const p = state.player;
  const playerSprite = playerSpriteMap[p.characterClass];

  // Attack range
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.attackRange, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(59,130,246,0.05)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Melee swing visual
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

  // Player glow
  const glowColors: Record<CharacterClass, string> = {
    fighter: '#3b82f6',
    mage: '#8b5cf6',
    archer: '#22c55e',
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
