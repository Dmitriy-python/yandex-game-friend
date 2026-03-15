interface AbilityButtonProps {
  abilityTimer: number;
  abilityCooldown: number;
  onUse: () => void;
}

export default function AbilityButton({ abilityTimer, abilityCooldown, onUse }: AbilityButtonProps) {
  const ready = abilityTimer <= 0;
  const progress = ready ? 1 : 1 - abilityTimer / abilityCooldown;

  return (
    <button
      className="absolute bottom-8 right-8 z-50 touch-none select-none"
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: ready
          ? 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.2) 100%)'
          : 'radial-gradient(circle, rgba(100,100,100,0.4) 0%, rgba(60,60,60,0.2) 100%)',
        border: `3px solid ${ready ? 'rgba(239,68,68,0.7)' : 'rgba(150,150,150,0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        if (ready) onUse();
      }}
    >
      {/* Cooldown sweep */}
      {!ready && (
        <svg width="72" height="72" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="36" cy="36" r="32"
            fill="none"
            stroke="rgba(239,68,68,0.4)"
            strokeWidth="4"
            strokeDasharray={`${progress * 201} 201`}
          />
        </svg>
      )}
      <span style={{
        fontSize: 24,
        color: ready ? '#fff' : 'rgba(255,255,255,0.4)',
        fontWeight: 'bold',
        textShadow: ready ? '0 0 8px rgba(239,68,68,0.8)' : 'none',
      }}>
        ⚡
      </span>
    </button>
  );
}
