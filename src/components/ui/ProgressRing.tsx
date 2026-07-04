import { motion } from 'framer-motion'

interface ProgressRingProps {
  /** Progresso entre 0 e 1 (valores maiores são limitados a 1). */
  progress: number
  size?: number
  strokeWidth?: number
  trackColor?: string
  color?: string
  children?: React.ReactNode
}

/** Anel de progresso SVG animado, usado para calorias e água. */
export function ProgressRing({
  progress,
  size = 180,
  strokeWidth = 12,
  trackColor = 'rgba(255,255,255,0.07)',
  color = 'var(--color-lime)',
  children,
}: ProgressRingProps) {
  const clamped = Math.min(Math.max(progress, 0), 1)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
