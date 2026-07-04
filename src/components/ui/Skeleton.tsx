interface SkeletonProps {
  className?: string
}

/** Bloco de carregamento com pulso sutil, alinhado ao glassmorphism. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.045] ${className}`}
    />
  )
}
