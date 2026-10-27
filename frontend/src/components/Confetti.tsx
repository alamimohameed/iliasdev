import { useEffect, useMemo, useState, type CSSProperties } from 'react';

const COLORS = ['#e5484d', '#3b82f6', '#8b5cf6', '#f5a524', '#10b981', '#1d1b18'];
const PIECES = 36;

/** Petite explosion de confettis ; se démonte seule à la fin de l'animation. */
export function Confetti() {
  const [visible, setVisible] = useState(true);
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        const angle = (Math.PI * 2 * i) / PIECES + Math.random() * 0.4;
        const distance = 90 + Math.random() * 120;
        return {
          color: COLORS[i % COLORS.length],
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.7 + 60,
          r: Math.random() * 720 - 360,
          delay: Math.random() * 120,
          round: i % 3 === 0,
        };
      }),
    [],
  );

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/3 z-20" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti-piece absolute block h-2 ${p.round ? 'w-2 rounded-full' : 'w-1.5 rounded-sm'}`}
          style={
            {
              background: p.color,
              animationDelay: `${p.delay}ms`,
              '--x': `${p.x}px`,
              '--y': `${p.y}px`,
              '--r': `${p.r}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
