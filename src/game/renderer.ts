import { GameState, MAP_WIDTH, MAP_HEIGHT } from './types';
import playerImg from '@/assets/player.png';
import enemyNormalImg from '@/assets/enemy-normal.png';
import enemyFastImg from '@/assets/enemy-fast.png';
import enemyTankImg from '@/assets/enemy-tank.png';
import enemyBossImg from '@/assets/enemy-boss.png';

const GRID_SIZE = 80;

// Image cache
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
  const [player, normal, fast, tank, boss] = await Promise.all([
    loadImage(playerImg),
    loadImage(enemyNormalImg),
    loadImage(enemyFastImg),
    loadImage(enemyTankImg),
    loadImage(enemyBossImg),
  ]);
  images.player = player;
  images.enemyNormal = normal;
  images.enemyFast = fast;
  images.enemyTank = tank;
  images.enemyBoss = boss;
  imagesLoaded = true;
}

function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawSprite(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number, rotation = 0, flash = false) {
  const img = images[type];
  if (!img) return;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  if (flash) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'brightness(2) saturate(0)';
  }
  
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  // Preload images on first frame
  if (!imagesLoaded) {
    preloadImages();
  }

  const cam = state.camera;
  const offsetX = canvasW / 2 - cam.x;
  const offsetY = canvasH / 2 - cam.y;

  // Background with gradient
  const gradient = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 0, canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH));
  gradient.addColorStop(0, '#1a2035');
  gradient.addColorStop(1, '#0f1218');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Ambient particles
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 50; i++) {
    const px = ((i * 137.5) % MAP_WIDTH);
    const py = ((i * 293.1) % MAP_HEIGHT);
    const parallaxX = (cam.x - MAP_WIDTH / 2) * 0.02;
    const parallaxY = (cam.y - MAP_HEIGHT / 2) * 0.02;
    ctx.beginPath();
    ctx.arc(px - parallaxX, py - parallaxY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grid with glow effect
  ctx.shadowColor = 'rgba(139,92,246,0.3)';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = 'rgba(139,92,246,0.15)';
  ctx.lineWidth = 1;
  const startX = Math.max(0, Math.floor((cam.x - canvasW / 2) / GRID_SIZE) * GRID_SIZE);
  const endX = Math.min(MAP_WIDTH, cam.x + canvasW / 2 + GRID_SIZE);
  const startY = Math.max(0, Math.floor((cam.y - canvasH / 2) / GRID_SIZE) * GRID_SIZE);
  const endY = Math.min(MAP_HEIGHT, cam.y + canvasH / 2 + GRID_SIZE);

  for (let x = startX; x <= endX; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Map border with glow
  ctx.shadowColor = 'rgba(239,68,68,0.5)';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = 'rgba(239,68,68,0.6)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  ctx.shadowBlur = 0;

  // XP orbs with glow
  for (const orb of state.xpOrbs) {
    ctx.beginPath();
    ctx.arc(orb.pos.x, orb.pos.y, orb.radius, 0, Math.PI * 2);
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Inner bright core
    ctx.beginPath();
    ctx.arc(orb.pos.x, orb.pos.y, orb.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#86efac';
    ctx.fill();
  }

  // Enemies
  const enemySprites: Record<string, { sprite: string; size: number; glow: string }> = {
    normal: { sprite: 'enemyNormal', size: 50, glow: '#ef4444' },
    fast:   { sprite: 'enemyFast', size: 35, glow: '#f97316' },
    tank:   { sprite: 'enemyTank', size: 70, glow: '#6366f1' },
    boss:   { sprite: 'enemyBoss', size: 100, glow: '#dc2626' },
  };

  for (const e of state.enemies) {
    const config = enemySprites[e.type];
    
    // Glow effect for boss
    if (e.type === 'boss') {
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius + 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,38,38,0.15)';
      ctx.fill();
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 25;
    }

    // Draw sprite
    const flash = e.flashTimer > 0;
    drawSprite(ctx, config.sprite, e.pos.x, e.pos.y, config.size, state.time * 2, flash);
    ctx.shadowBlur = 0;

    // HP bar
    if (e.hp < e.maxHp) {
      const barW = e.type === 'boss' ? 80 : e.type === 'tank' ? 60 : 40;
      const barH = e.type === 'boss' ? 8 : 5;
      const barX = e.pos.x - barW / 2;
      const barY = e.pos.y - e.radius - (e.type === 'boss' ? 25 : 12);
      
      // Bar background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 3);
      ctx.fill();
      
      // Health fill
      const hpPercent = e.hp / e.maxHp;
      ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.roundRect(barX, barY, barW * hpPercent, barH, 2);
      ctx.fill();
    }
  }

  // Projectiles with trail
  for (const p of state.projectiles) {
    // Trail
    ctx.beginPath();
    ctx.moveTo(p.pos.x, p.pos.y);
    ctx.lineTo(p.pos.x - p.vel.x * 0.03, p.pos.y - p.vel.y * 0.03);
    ctx.strokeStyle = 'rgba(250,204,21,0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Core
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
  
  // Attack range indicator (subtle ring)
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.attackRange, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(59,130,246,0.05)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Player glow
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.radius + 15, 0, Math.PI * 2);
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 25;
  ctx.fillStyle = 'rgba(59,130,246,0.2)';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw player sprite
  drawSprite(ctx, 'player', p.pos.x, p.pos.y, 60);

  ctx.restore();
}
