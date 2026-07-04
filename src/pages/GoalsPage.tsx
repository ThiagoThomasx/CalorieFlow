import { Droplets, Flame, Minus, Plus, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Objective } from '../types/nutrition'
import { useAppState } from '../state/AppStateContext'
import { formatMl } from '../lib/format'
import { GlassCard } from '../components/ui/GlassCard'
import { PageTransition } from '../components/layout/PageTransition'

const OBJECTIVES: Array<{ id: Objective; label: string; hint: string }> = [
  { id: 'lose_fat', label: 'Perder gordura', hint: 'Déficit calórico leve' },
  { id: 'maintain', label: 'Manter peso', hint: 'Equilíbrio diário' },
  { id: 'gain_muscle', label: 'Ganhar massa', hint: 'Superávit + proteína' },
]

interface StepperCardProps {
  icon: LucideIcon
  iconTone: string
  label: string
  value: string
  onDecrement: () => void
  onIncrement: () => void
  delay?: number
}

function StepperCard({
  icon: Icon,
  iconTone,
  label,
  value,
  onDecrement,
  onIncrement,
  delay,
}: StepperCardProps) {
  return (
    <GlassCard className="flex items-center justify-between p-4" delay={delay}>
      <div className="flex items-center gap-3.5">
        <div className={`flex size-11 items-center justify-center rounded-xl bg-white/[0.06] ${iconTone}`}>
          <Icon className="size-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-xs text-fog">{label}</p>
          <p className="font-display text-lg font-bold">{value}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StepButton label={`Diminuir ${label}`} onClick={onDecrement}>
          <Minus className="size-4" />
        </StepButton>
        <StepButton label={`Aumentar ${label}`} onClick={onIncrement}>
          <Plus className="size-4" />
        </StepButton>
      </div>
    </GlassCard>
  )
}

function StepButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] text-fog transition-colors duration-200 hover:bg-white/[0.1] hover:text-snow active:scale-95"
    >
      {children}
    </button>
  )
}

const CALORIE_STEP = 50
const PROTEIN_STEP = 5
const WATER_STEP = 250

export default function GoalsPage() {
  const { goals, updateGoals } = useAppState()

  return (
    <PageTransition>
      <header className="mt-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Metas</h1>
        <p className="mt-1 text-sm text-fog">
          Ajuste seus alvos diários. Tudo é salvo localmente por enquanto.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3.5">
        <StepperCard
          icon={Flame}
          iconTone="text-lime"
          label="Meta calórica diária"
          value={`${goals.caloriesGoal.toLocaleString('pt-BR')} kcal`}
          onDecrement={() =>
            updateGoals({ caloriesGoal: Math.max(goals.caloriesGoal - CALORIE_STEP, 1200) })
          }
          onIncrement={() =>
            updateGoals({ caloriesGoal: Math.min(goals.caloriesGoal + CALORIE_STEP, 6000) })
          }
          delay={0.05}
        />
        <StepperCard
          icon={Zap}
          iconTone="text-violet"
          label="Meta de proteína"
          value={`${goals.proteinGoal} g`}
          onDecrement={() =>
            updateGoals({ proteinGoal: Math.max(goals.proteinGoal - PROTEIN_STEP, 40) })
          }
          onIncrement={() =>
            updateGoals({ proteinGoal: Math.min(goals.proteinGoal + PROTEIN_STEP, 400) })
          }
          delay={0.1}
        />
        <StepperCard
          icon={Droplets}
          iconTone="text-cyan"
          label="Meta de água"
          value={formatMl(goals.waterGoalMl)}
          onDecrement={() =>
            updateGoals({ waterGoalMl: Math.max(goals.waterGoalMl - WATER_STEP, 1000) })
          }
          onIncrement={() =>
            updateGoals({ waterGoalMl: Math.min(goals.waterGoalMl + WATER_STEP, 6000) })
          }
          delay={0.15}
        />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold tracking-tight">Objetivo</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {OBJECTIVES.map((objective, index) => {
            const isActive = goals.objective === objective.id
            return (
              <GlassCard key={objective.id} delay={0.2 + index * 0.05}>
                <button
                  type="button"
                  onClick={() => updateGoals({ objective: objective.id })}
                  className={`flex w-full items-center justify-between rounded-3xl p-4 text-left transition-colors duration-200 ${
                    isActive ? 'bg-lime/[0.08]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isActive ? 'text-lime' : ''}`}>
                      {objective.label}
                    </p>
                    <p className="mt-0.5 text-xs text-fog">{objective.hint}</p>
                  </div>
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                      isActive ? 'border-lime' : 'border-line'
                    }`}
                  >
                    {isActive && <span className="size-2.5 rounded-full bg-lime" />}
                  </span>
                </button>
              </GlassCard>
            )
          })}
        </div>
      </section>
    </PageTransition>
  )
}
