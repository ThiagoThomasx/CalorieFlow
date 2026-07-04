import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Camera,
  Clock,
  Mic,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Type,
  WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AnalyzedFoodItem, MealType, NutritionAnalysis } from '../types/nutrition'
import {
  appendAnalysisItems,
  removeAnalysisItem,
  suggestMealType,
  updateItemQuantity,
} from '../lib/nutrition'
import {
  analyzeMealWithAI,
  LOCAL_FALLBACK_MODEL,
  OFFLINE_MESSAGE,
} from '../services/ai/NutritionService'
import { mealTypeLabel } from '../lib/format'
import { useAppState } from '../state/AppStateContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
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

const MIN_TEXT_LENGTH = 3

export default function LogPage() {
  const navigate = useNavigate()
  const { addMeal, showToast } = useAppState()
  const isOnline = useOnlineStatus()

  const [mode, setMode] = useState<LogMode>('text')
  const [text, setText] = useState('')
  const [mealType, setMealType] = useState<MealType>(suggestMealType())
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [addItemText, setAddItemText] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)

  async function handleAnalyze() {
    if (text.trim().length < MIN_TEXT_LENGTH || isAnalyzing) return
    if (!isOnline) {
      showToast(OFFLINE_MESSAGE)
      return
    }
    setIsAnalyzing(true)
    setAnalysis(null)
    try {
      const result = await analyzeMealWithAI(text)
      setAnalysis(result)
    } catch (error) {
      // O texto digitado permanece intacto no textarea para nova tentativa.
      showToast(error instanceof Error ? error.message : 'Não foi possível analisar a refeição.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleAddItem() {
    if (!analysis || addItemText.trim().length < MIN_TEXT_LENGTH || isAddingItem) return
    if (!isOnline) {
      showToast(OFFLINE_MESSAGE)
      return
    }
    setIsAddingItem(true)
    try {
      const extra = await analyzeMealWithAI(addItemText)
      setAnalysis((current) => (current ? appendAnalysisItems(current, extra.items) : current))
      setAddItemText('')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Não foi possível adicionar o item.')
    } finally {
      setIsAddingItem(false)
    }
  }

  function handleQuantityChange(index: number, quantity: number) {
    setAnalysis((current) => (current ? updateItemQuantity(current, index, quantity) : current))
  }

  function handleRemoveItem(index: number) {
    setAnalysis((current) => {
      if (!current) return current
      const next = removeAnalysisItem(current, index)
      return next.items.length > 0 ? next : null
    })
  }

  async function handleSave() {
    if (!analysis || analysis.items.length === 0 || isSaving) return
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
          Descreva o que você comeu e a IA cuida do resto.
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
          placeholder='Ex.: "2 ovos, 100g de arroz e uma banana"'
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-snow placeholder:text-faint outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          {!isOnline ? (
            <span className="flex items-center gap-1.5 text-xs text-amber">
              <WifiOff className="size-3.5" />
              Offline — seu texto está salvo
            </span>
          ) : (
            <span />
          )}
          <Button
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            disabled={text.trim().length < MIN_TEXT_LENGTH || !isOnline}
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
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <motion.span
              animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="size-6 text-lime" />
            </motion.span>
            <p className="text-sm text-fog">Analisando sua refeição…</p>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-lime/70"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
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

              {analysis.model === LOCAL_FALLBACK_MODEL ? (
                <p className="mt-1 text-[11px] tracking-wide text-amber">
                  Estimativa local aproximada — IA indisponível no momento
                </p>
              ) : (
                typeof analysis.confidence === 'number' && (
                  <p className="mt-1 text-[11px] tracking-wide text-faint">
                    Confiança da IA: {Math.round(analysis.confidence * 100)}%
                  </p>
                )
              )}

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <NutrientPill label="Proteína" value={`${analysis.protein}g`} tone="text-lime" />
                <NutrientPill label="Carboidratos" value={`${analysis.carbs}g`} tone="text-cyan" />
                <NutrientPill label="Gorduras" value={`${analysis.fat}g`} tone="text-violet" />
                <NutrientPill label="Fibra" value={`${analysis.fiber}g`} tone="text-snow" />
                <NutrientPill label="Sódio" value={`${analysis.sodium}mg`} tone="text-amber" />
                <NutrientPill label="Itens" value={String(analysis.items.length)} tone="text-snow" />
              </div>

              {/* Itens editáveis: quantidade, exclusão e adição antes de salvar */}
              <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                {analysis.items.map((item, index) => (
                  <EditableItemRow
                    // Quantidade na key: remonta a linha após commit/remoção,
                    // garantindo que o draft local nunca fique obsoleto.
                    key={`${item.name}-${index}-${item.quantity}`}
                    item={item}
                    onQuantityChange={(quantity) => handleQuantityChange(index, quantity)}
                    onRemove={() => handleRemoveItem(index)}
                  />
                ))}
              </ul>

              {/* Adicionar item (reutiliza a IA) */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={addItemText}
                  onChange={(event) => setAddItemText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void handleAddItem()
                  }}
                  placeholder="Adicionar item… ex.: 1 iogurte"
                  className="h-10 flex-1 rounded-xl bg-white/[0.04] px-3 text-sm text-snow placeholder:text-faint outline-none focus-visible:ring-2 focus-visible:ring-lime/50"
                />
                <Button
                  variant="ghost"
                  onClick={handleAddItem}
                  isLoading={isAddingItem}
                  disabled={addItemText.trim().length < MIN_TEXT_LENGTH}
                  className="h-10 px-3 text-sm"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
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

interface EditableItemRowProps {
  item: AnalyzedFoodItem
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

/**
 * Linha de item com quantidade editável. O valor é confirmado no blur/Enter
 * para os macros não recalcularem a cada tecla digitada.
 */
function EditableItemRow({ item, onQuantityChange, onRemove }: EditableItemRowProps) {
  const [draft, setDraft] = useState(String(item.quantity))

  function commit() {
    const parsed = Number(draft.replace(',', '.'))
    if (Number.isFinite(parsed) && parsed > 0 && parsed !== item.quantity) {
      onQuantityChange(parsed)
    } else {
      setDraft(String(item.quantity))
    }
  }

  return (
    <li className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
          }}
          inputMode="decimal"
          aria-label={`Quantidade de ${item.name}`}
          className="h-8 w-14 rounded-lg bg-white/[0.06] text-center text-[13px] text-snow outline-none focus-visible:ring-2 focus-visible:ring-lime/50"
        />
        {item.unit && <span className="text-[11px] text-faint">{item.unit}</span>}
      </div>
      <span className="flex-1 truncate text-fog">{item.name}</span>
      <span className="font-medium">{item.calories} kcal</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${item.name}`}
        className="rounded-lg p-1.5 text-faint transition-colors duration-200 hover:bg-white/[0.06] hover:text-amber"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}
