import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Droplets, Flame, Minus, Plus, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Objective } from '../types/nutrition'
import { useAppState } from '../state/AppStateContext'
import { formatMl } from '../lib/format'
import { OBJECTIVE_PRESETS } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { GlassCard } from '../components/ui/GlassCard'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
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
  const { status, goals, updateGoals, retry } = useAppState()
  const [pendingObjective, setPendingObjective] = useState<Objective | null>(null)

  function handleSelectObjective(objective: Objective) {
    if (objective === goals.objective) return
    setPendingObjective(objective)
  }

  function handleApplyPreset() {
    if (!pendingObjective) return
    const preset = OBJECTIVE_PRESETS[pendingObjective]
    updateGoals({
      objective: pendingObjective,
      caloriesGoal: preset.caloriesGoal,
      proteinGoal: preset.proteinGoal,
      waterGoalMl: preset.waterGoalMl,
    })
    setPendingObjective(null)
  }

  function handleKeepCurrentGoals() {
    if (!pendingObjective) return
    updateGoals({ objective: pendingObjective })
    setPendingObjective(null)
  }

  if (status === 'loading') {
    return (
      <PageTransition>
        <header className="mt-6">
          <h1 className="font-display text-2xl font-bold tracking-tight">Metas</h1>
          <p className="mt-1 text-sm text-fog">
            Ajuste seus alvos diários. Salvo automaticamente na sua conta.
          </p>
        </header>
        <div aria-busy="true" className="mt-6 flex flex-col gap-3.5">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
        </div>
      </PageTransition>
    )
  }

  if (status === 'error') {
    return (
      <PageTransition>
        <header className="mt-6">
          <h1 className="font-display text-2xl font-bold tracking-tight">Metas</h1>
        </header>
        <ErrorState onRetry={retry} />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <header className="mt-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Metas</h1>
        <p className="mt-1 text-sm text-fog">
          Ajuste seus alvos diários. Salvo automaticamente na sua conta.
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
                  onClick={() => handleSelectObjective(objective.id)}
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

      <AnimatePresence>
        {pendingObjective && (
          <ObjectivePresetModal
            objective={pendingObjective}
            onApply={handleApplyPreset}
            onKeepCurrent={handleKeepCurrentGoals}
            onDismiss={() => setPendingObjective(null)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

interface ObjectivePresetModalProps {
  objective: Objective
  onApply: () => void
  onKeepCurrent: () => void
  onDismiss: () => void
}

/** Confirma se o usuário quer aplicar as metas sugeridas ao trocar de objetivo. */
function ObjectivePresetModal({
  objective,
  onApply,
  onKeepCurrent,
  onDismiss,
}: ObjectivePresetModalProps) {
  const preset = OBJECTIVE_PRESETS[objective]
  const label = OBJECTIVES.find((item) => item.id === objective)?.label ?? objective

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-safe backdrop-blur-sm sm:items-center"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-sm rounded-3xl p-5 mb-6 sm:mb-0"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-lg font-bold tracking-tight">
          Quer ajustar suas metas para este objetivo?
        </h2>
        <p className="mt-1.5 text-sm text-fog">
          Sugestão para <strong className="text-snow">{label}</strong>:
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <PresetPill label="Calorias" value={`${preset.caloriesGoal} kcal`} />
          <PresetPill label="Proteína" value={`${preset.proteinGoal}g`} />
          <PresetPill label="Água" value={formatMl(preset.waterGoalMl)} />
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button fullWidth onClick={onApply}>
            Aplicar metas sugeridas
          </Button>
          <Button fullWidth variant="ghost" onClick={onKeepCurrent}>
            Manter minhas metas atuais
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function PresetPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-center">
      <p className="font-display text-sm font-semibold text-lime">{value}</p>
      <p className="mt-0.5 text-[10px] tracking-wide text-faint">{label}</p>
    </div>
  )
}
