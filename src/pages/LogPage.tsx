import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Camera,
  Clock,
  Mic,
  Sparkles,
  Star,
  Type,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MealType, NutritionAnalysis } from '../types/nutrition'
import { analyzeMealText, suggestMealType } from '../lib/nutrition'
import { mealTypeLabel } from '../lib/format'
import { useAppState } from '../state/AppStateContext'
import { Button } from '../components/ui/Button'
import { GlassCard } from '../components/ui/GlassCard'
import { PageTransition } from '../components/layout/PageTransition'

type LogMode = 'text' | 'photo' | 'voice' | 'favorites' | 'recent'

interface ModeOption {
  id: LogMode
  label: string
  icon: LucideIcon
  available: boolean
}

const MODES: ModeOption[] = [
  { id: 'text', label: 'Texto', icon: Type, available: true },
  { id: 'photo', label: 'Foto', icon: Camera, available: false },
  { id: 'voice', label: 'Voz', icon: Mic, available: false },
  { id: 'favorites', label: 'Favoritos', icon: Star, available: false },
  { id: 'recent', label: 'Recentes', icon: Clock, available: false },
]

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

export default function LogPage() {
  const navigate = useNavigate()
  const { addMeal, showToast } = useAppState()

  const [mode, setMode] = useState<LogMode>('text')
  const [text, setText] = useState('')
  const [mealType, setMealType] = useState<MealType>(suggestMealType())
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleAnalyze() {
    if (text.trim().length < 3) return
    setIsAnalyzing(true)
    setAnalysis(null)
    const result = await analyzeMealText(text)
    setAnalysis(result)
    setIsAnalyzing(false)
  }

  async function handleSave() {
    if (!analysis || isSaving) return
    setIsSaving(true)
    const saved = await addMeal(mealType, analysis)
    setIsSaving(false)
    if (!saved) return
    showToast('Refeição salva com sucesso')
    navigate('/app')
  }

  return (
    <PageTransition>
      <header className="mt-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Registro rápido
        </h1>
        <p className="mt-1 text-sm text-fog">
          Descreva o que você comeu e deixe o resto com a gente.
        </p>
      </header>

      {/* Seletor de modo */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MODES.map(({ id, label, icon: Icon, available }) => {
          const isActive = mode === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => available && setMode(id)}
              disabled={!available}
              className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-lime text-ink'
                  : available
                    ? 'glass text-snow hover:bg-white/[0.08]'
                    : 'glass text-faint'
              }`}
            >
              <Icon className="size-4" strokeWidth={2} />
              {label}
              {!available && (
                <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] tracking-wide uppercase">
                  breve
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Entrada por texto */}
      <GlassCard className="mt-4 p-4" delay={0.05}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder='Ex.: "2 ovos, 1 pão francês e café com leite"'
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-snow placeholder:text-faint outline-none"
        />
        <div className="mt-2 flex justify-end">
          <Button
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            disabled={text.trim().length < 3}
            className="h-11 px-5 text-sm"
          >
            <Sparkles className="size-4" />
            Analisar
          </Button>
        </div>
      </GlassCard>

      {/* Resultado da análise */}
      <AnimatePresence mode="wait">
        {isAnalyzing && (
          <motion.p
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-fog"
          >
            <Sparkles className="size-4 animate-pulse text-lime" />
            Analisando sua refeição…
          </motion.p>
        )}

        {analysis && !isAnalyzing && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5"
          >
            <div className="glass rounded-3xl p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-bold">Análise estimada</h2>
                <span className="font-display text-2xl font-bold text-lime">
                  {analysis.calories}
                  <span className="ml-1 text-xs font-normal text-fog">kcal</span>
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <NutrientPill label="Proteína" value={`${analysis.protein}g`} tone="text-lime" />
                <NutrientPill label="Carboidratos" value={`${analysis.carbs}g`} tone="text-cyan" />
                <NutrientPill label="Gorduras" value={`${analysis.fat}g`} tone="text-violet" />
                <NutrientPill label="Fibra" value={`${analysis.fiber}g`} tone="text-snow" />
                <NutrientPill label="Sódio" value={`${analysis.sodium}mg`} tone="text-amber" />
                <NutrientPill label="Itens" value={String(analysis.items.length)} tone="text-snow" />
              </div>

              {analysis.items.length > 0 && (
                <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4">
                  {analysis.items.map((item) => (
                    <li
                      key={`${item.name}-${item.quantity}`}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-fog">
                        {item.quantity > 1 ? `${item.quantity}× ` : ''}
                        {item.name}
                      </span>
                      <span className="font-medium">{item.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tipo de refeição */}
            <div className="mt-4 flex gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-medium transition-colors duration-200 ${
                    mealType === type
                      ? 'bg-lime/15 text-lime ring-1 ring-lime/40'
                      : 'glass text-fog hover:text-snow'
                  }`}
                >
                  {mealTypeLabel(type)}
                </button>
              ))}
            </div>

            <Button fullWidth onClick={handleSave} isLoading={isSaving} className="mt-4">
              Salvar refeição
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

function NutrientPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-center">
      <p className={`font-display text-sm font-semibold ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[10px] tracking-wide text-faint">{label}</p>
    </div>
  )
}
