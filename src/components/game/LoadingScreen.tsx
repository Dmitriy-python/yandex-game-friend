import { useEffect, useState } from 'react';
import { preloadImages } from '@/game/renderer';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export default function LoadingScreen({ onLoaded }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Simulate progress steps
      for (let i = 0; i <= 60; i += 10) {
        if (cancelled) return;
        setProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }
      await preloadImages();
      if (cancelled) return;
      setProgress(100);
      setTimeout(() => { if (!cancelled) onLoaded(); }, 400);
    };
    load();
    return () => { cancelled = true; };
  }, [onLoaded]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8"
      style={{ background: 'linear-gradient(180deg, #0f1218 0%, #1a2035 100%)' }}>
      
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-black tracking-wider"
          style={{ color: '#e2e8f0', textShadow: '0 0 30px rgba(59,130,246,0.5)' }}>
          ⚔️ SURVIVOR
        </h1>
        <p className="text-sm font-mono" style={{ color: '#64748b' }}>ARENA</p>
      </div>

      <div className="w-64 flex flex-col items-center gap-3">
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            }}
          />
        </div>
        <p className="text-xs font-mono" style={{ color: '#64748b' }}>
          {progress < 100 ? 'Загрузка ресурсов...' : 'Готово!'}
        </p>
      </div>
    </div>
  );
}
