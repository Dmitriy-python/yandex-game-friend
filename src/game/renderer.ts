import { GameState, MAP_WIDTH, MAP_HEIGHT, EnemyType } from './types';
import playerImg from '@/assets/player.png';
import enemyNormalImg from '@/assets/enemy-normal.png';
import enemyFastImg from '@/assets/enemy-fast.png';
import enemyTankImg from '@/assets/enemy-tank.png';
import enemyBossImg from '@/assets/enemy-boss.png';
import groundTileImg from '@/assets/ground-tile.png';

// Sprite cache
const spriteCache = new Map<string, HTMLImageElement>();

function loadSprite(src: string): HTMLImageElement {
  if (spriteCache.has(src)) return spriteCache.get(src)!;
  const img = new Image();
  img.src = src;
  spriteCache.set(src, img);
  return img;
}

const enemySpriteMap: Record<EnemyType, string> = {
  normal: enemyNormalImg,
  fast: enemyFastImg,
  tank: enemyTankImg,
  boss: enemyBossImg,
};

// Preload all
const sprites = {
  player: loadSprite(playerImg),
  ground: loadSprite(groundTileImg),
  enemies: {
    normal: loadSprite(enemyNormalImg),
    fast: loadSprite(enemyFastImg),
    tank: loadSprite(enemyTankImg),
    boss: loadSprite(enemyBossImg),
  },
};

const TILE_SIZE = 512;

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  const cam = state.camera;
  const offsetX = canvasW / 2 - cam.x;
  const offsetY = canvasH / 2 - cam.y;

  // Dark background fill
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Ground tiles
  if (sprites.ground.complete && sprites.ground.naturalWidth > 0) {
    const startTX = Math.max(0, Math.floor((cam.x - canvasW / 2) / TILE_SIZE));
    const endTX = Math.min(Math.ceil(MAP_WIDTH / TILE_SIZE), Math.ceil((cam.x + canvasW / 2) / TILE_SIZE) + 1);
    const startTY = Math.max(0, Math.floor((cam.y - canvasH / 2) / TILE_SIZE));
    const endTY = Math.min(Math.ceil(MAP_HEIGHT / TILE_SIZE), Math.ceil((cam.y + canvasH / 2) / TILE_SIZE) + 1);

    for (let tx = startTX; tx < endTX; tx++) {
      for (let ty = startTY; ty < endTY; ty++) {
        ctx.drawImage(sprites.ground, tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  } else {
    // Fallback
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  // Subtle grid overlay
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const gridSize = 120;
  const startX = Math.max(0, Math.floor((cam.x - canvasW / 2) / gridSize) * gridSize);
  const endX = Math.min(MAP_WIDTH, cam.x + canvasW / 2 + gridSize);
  const startY = Math.max(0, Math.floor((cam.y - canvasH / 2) / gridSize) * gridSize);
  const endY = Math.min(MAP_HEIGHT, cam.y + canvasH / 2 + gridSize);
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
  }

  // Map border glow
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = 'rgba(239,68,68,0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  ctx.shadowBlur = 0;

  // XP orbs with glow
  for (const orb of state.xpOrbs) {
    // Outer glow
    const gradient = ctx.createRadialGradient(orb.pos.x, orb.pos.y, 0, orb.pos.x, orb.pos.y, orb.radius * 3);
    gradient.addColorStop(0, 'rgba(74,222,128,0.4)');
    gradient.addColorStop(1, 'rgba(74,222,128,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(orb.pos.x - orb.radius * 3, orb.pos.y - orb.radius * 3, orb.radius * 6, orb.radius * 6);

    // Diamond shape
    const r = orb.radius;
    const pulse = 1 + Math.sin(state.time * 6 + orb.id) * 0.2;
    ctx.save();
    ctx.translate(orb.pos.x, orb.pos.y);
    ctx.rotate(state.time * 2 + orb.id);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Enemy shadows
  for (const e of state.enemies) {
    ctx.beginPath();
    ctx.ellipse(e.pos.x, e.pos.y + e.radius * 0.8, e.radius * 0.8, e.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
  }

  // Enemies with sprites
  const hpColors: Record<EnemyType, string> = {
    normal: '#ef4444',
    fast: '#fb923c',
    tank: '#818cf8',
    boss: '#f87171',
  };

  for (const e of state.enemies) {
    const sprite = sprites.enemies[e.type];
    const size = e.radius * 2.5;

    // Boss pulsing aura
    if (e.type === 'boss') {
      const auraPulse = 1 + Math.sin(state.time * 3) * 0.15;
      const auraGrad = ctx.createRadialGradient(e.pos.x, e.pos.y, e.radius, e.pos.x, e.pos.y, e.radius * 2 * auraPulse);
      auraGrad.addColorStop(0, 'rgba(220,38,38,0.25)');
      auraGrad.addColorStop(1, 'rgba(220,38,38,0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius * 2 * auraPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw sprite or fallback
    if (sprite.complete && sprite.naturalWidth > 0) {
      ctx.save();
      if (e.flashTimer > 0) {
        ctx.globalAlpha = 0.5 + Math.sin(state.time * 30) * 0.5;
      }
      // Bobbing animation
      const bob = Math.sin(state.time * 4 + e.id * 0.7) * 2;
      ctx.drawImage(sprite, e.pos.x - size / 2, e.pos.y - size / 2 + bob, size, size);
      ctx.restore();
    } else {
      // Fallback circles
      const colors = { normal: '#ef4444', fast: '#f97316', tank: '#6366f1', boss: '#dc2626' };
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = e.flashTimer > 0 ? '#fff' : colors[e.type];
      ctx.fill();
    }

    // HP bar
    if (e.hp < e.maxHp) {
      const barW = Math.max(e.radius * 2, 30);
      const barH = e.type === 'boss' ? 7 : 4;
      const barX = e.pos.x - barW / 2;
      const barY = e.pos.y - size / 2 - 6;
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(barX - 1, barY - 1, barW + 2, barH + 2, 3);
      ctx.fill();
      // Bar
      ctx.fillStyle = hpColors[e.type];
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * (e.hp / e.maxHp), barH, 2);
      ctx.fill();
    }
  }

  // Projectiles with trails
  for (const p of state.projectiles) {
    // Trail
    const trailLen = 3;
    for (let i = trailLen; i >= 0; i--) {
      const alpha = (1 - i / trailLen) * 0.5;
      const tx = p.pos.x - p.vel.x * 0.015 * i;
      const ty = p.pos.y - p.vel.y * 0.015 * i;
      ctx.beginPath();
      ctx.arc(tx, ty, p.radius * (1 - i * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(250,204,21,${alpha})`;
      ctx.fill();
    }
    // Main projectile
    const projGrad = ctx.createRadialGradient(p.pos.x, p.pos.y, 0, p.pos.x, p.pos.y, p.radius * 2);
    projGrad.addColorStop(0, '#fff');
    projGrad.addColorStop(0.3, '#facc15');
    projGrad.addColorStop(1, 'rgba(250,204,21,0)');
    ctx.fillStyle = projGrad;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  // Player shadow
  const pl = state.player;
  ctx.beginPath();
  ctx.ellipse(pl.pos.x, pl.pos.y + pl.radius * 0.9, pl.radius * 0.9, pl.radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  // Player sprite
  const playerSize = pl.radius * 3.2;
  const playerBob = Math.sin(state.time * 5) * 2;

  if (sprites.player.complete && sprites.player.naturalWidth > 0) {
    ctx.drawImage(sprites.player, pl.pos.x - playerSize / 2, pl.pos.y - playerSize / 2 + playerBob, playerSize, playerSize);
  } else {
    // Fallback
    ctx.beginPath();
    ctx.arc(pl.pos.x, pl.pos.y, pl.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
  }

  // Attack range (very subtle)
  ctx.beginPath();
  ctx.arc(pl.pos.x, pl.pos.y, pl.attackRange, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(59,130,246,0.05)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();

  // Vignette overlay
  const vigGrad = ctx.createRadialGradient(canvasW / 2, canvasH / 2, canvasW * 0.3, canvasW / 2, canvasH / 2, canvasW * 0.75);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, canvasW, canvasH);
}
