import { motion } from 'framer-motion'

interface MacroBarProps {
  label: string
  consumed: number
  goal: number
  unit?: string
  color: string
  delay?: number
}

/** Barra de progresso de um macronutriente (proteína, carbo, gordura). */
export function MacroBar({
  label,
  consumed,
  goal,
  unit = 'g',
  color,
  delay = 0,
}: MacroBarProps) {
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0

  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-fog">{label}</span>
      </div>
      <p className="mt-1 font-display text-sm font-semibold">
        {Math.round(consumed)}
        <span className="text-xs font-normal text-faint">
          /{goal}
          {unit}
        </span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}
