interface CompletionGaugeProps {
  /** Pourcentage 0–100. */
  value: number;
  color?: string;
  className?: string;
  label?: string;
}

/** Mini-jauge de complétion. */
export function CompletionGauge({ value, color = 'bg-emerald-500', className = 'h-1.5', label }: CompletionGaugeProps) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-ink/[0.07] ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label ?? 'Taux de complétion'}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
