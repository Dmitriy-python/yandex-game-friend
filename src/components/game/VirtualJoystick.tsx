import { useRef, useCallback, useEffect, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (dx: number, dy: number) => void;
}

export default function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const BASE_RADIUS = 60;
  const STICK_RADIUS = 24;
  const MAX_DIST = BASE_RADIUS - STICK_RADIUS;

  const handleStart = useCallback((cx: number, cy: number, id: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    touchIdRef.current = id;
    setActive(true);

    const dx = cx - centerRef.current.x;
    const dy = cy - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, MAX_DIST);
    const angle = Math.atan2(dy, dx);
    const sx = clamped * Math.cos(angle);
    const sy = clamped * Math.sin(angle);
    setStickPos({ x: sx, y: sy });
    onMove(sx / MAX_DIST, sy / MAX_DIST);
  }, [MAX_DIST, onMove]);

  const handleMove = useCallback((cx: number, cy: number) => {
    const dx = cx - centerRef.current.x;
    const dy = cy - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, MAX_DIST);
    const angle = Math.atan2(dy, dx);
    const sx = clamped * Math.cos(angle);
    const sy = clamped * Math.sin(angle);
    setStickPos({ x: sx, y: sy });
    onMove(sx / MAX_DIST, sy / MAX_DIST);
  }, [MAX_DIST, onMove]);

  const handleEnd = useCallback(() => {
    touchIdRef.current = null;
    setActive(false);
    setStickPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        // Only capture touches on the left half of screen
        if (t.clientX < window.innerWidth / 2) {
          e.preventDefault();
          handleStart(t.clientX, t.clientY, t.identifier);
          break;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchIdRef.current) {
          e.preventDefault();
          handleMove(t.clientX, t.clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          handleEnd();
          break;
        }
      }
    };

    const el = baseRef.current;
    if (!el) return;
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div
      ref={baseRef}
      className="absolute bottom-8 left-8 z-50 touch-none select-none"
      style={{
        width: BASE_RADIUS * 2,
        height: BASE_RADIUS * 2,
      }}
    >
      {/* Base circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
          border: '2px solid rgba(255,255,255,0.2)',
          opacity: active ? 1 : 0.5,
          transition: 'opacity 0.15s',
        }}
      />
      {/* Stick */}
      <div
        className="absolute rounded-full"
        style={{
          width: STICK_RADIUS * 2,
          height: STICK_RADIUS * 2,
          left: BASE_RADIUS - STICK_RADIUS + stickPos.x,
          top: BASE_RADIUS - STICK_RADIUS + stickPos.y,
          background: active
            ? 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
          border: '2px solid rgba(255,255,255,0.35)',
          transition: active ? 'none' : 'all 0.2s ease-out',
        }}
      />
    </div>
  );
}
