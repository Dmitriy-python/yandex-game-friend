import { GameState, MAP_WIDTH, MAP_HEIGHT } from './types';

const GRID_SIZE = 80;

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  const cam = state.camera;
  const offsetX = canvasW / 2 - cam.x;
  const offsetY = canvasH / 2 - cam.y;

  // Background
  ctx.fillStyle = '#1a1f2e';
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
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

  // Map border
  ctx.strokeStyle = 'rgba(255,100,100,0.3)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // XP orbs
  for (const orb of state.xpOrbs) {
    ctx.beginPath();
    ctx.arc(orb.pos.x, orb.pos.y, orb.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Enemies
  const enemyColors: Record<string, { fill: string; stroke: string; hpColor: string }> = {
    normal: { fill: '#ef4444', stroke: '#991b1b', hpColor: '#ef4444' },
    fast:   { fill: '#f97316', stroke: '#c2410c', hpColor: '#fb923c' },
    tank:   { fill: '#6366f1', stroke: '#3730a3', hpColor: '#818cf8' },
    boss:   { fill: '#dc2626', stroke: '#7f1d1d', hpColor: '#f87171' },
  };

  for (const e of state.enemies) {
    const colors = enemyColors[e.type] || enemyColors.normal;
    const fill = e.flashTimer > 0 ? '#fff' : colors.fill;

    // Boss glow
    if (e.type === 'boss') {
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius + 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,38,38,0.2)';
      ctx.fill();
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = e.type === 'boss' ? 3 : 2;
    ctx.stroke();

    // Tank shield marks
    if (e.type === 'tank') {
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Fast enemy spikes
    if (e.type === 'fast') {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + state.time * 5;
        ctx.beginPath();
        ctx.arc(e.pos.x + Math.cos(a) * e.radius * 0.7, e.pos.y + Math.sin(a) * e.radius * 0.7, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fde68a';
        ctx.fill();
      }
    }

    // Boss crown
    if (e.type === 'boss') {
      ctx.fillStyle = '#fbbf24';
      ctx.font = `${e.radius * 0.8}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('👑', e.pos.x, e.pos.y - e.radius - 5);
    }

    // HP bar
    if (e.hp < e.maxHp) {
      const barW = e.radius * 2;
      const barH = e.type === 'boss' ? 6 : 4;
      const barX = e.pos.x - barW / 2;
      const barY = e.pos.y - e.radius - (e.type === 'boss' ? 22 : 8);
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = colors.hpColor;
      ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
    }
  }

  // Projectiles
  for (const p of state.projectiles) {
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Player
  const p = state.player;
  // Glow
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.radius + 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(59,130,246,0.2)';
  ctx.fill();
  // Body
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#3b82f6';
  ctx.fill();
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(p.pos.x - 5, p.pos.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.pos.x + 5, p.pos.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();

  // Attack range indicator (subtle)
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.attackRange, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(59,130,246,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
