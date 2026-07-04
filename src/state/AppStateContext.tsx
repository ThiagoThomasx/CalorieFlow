import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { MealLog, UserGoals } from '../types/nutrition'
import {
  DEFAULT_GOALS,
  INITIAL_MEALS,
  INITIAL_WATER_ML,
  MOCK_ACTIVITY,
} from '../lib/mockData'

const TOAST_DURATION_MS = 2600

interface AppState {
  meals: MealLog[]
  goals: UserGoals
  waterMl: number
  activityMinutes: number
  caloriesBurned: number
  toast: string | null
  addMeal: (meal: MealLog) => void
  addWater: (ml: number) => void
  updateGoals: (partial: Partial<UserGoals>) => void
  showToast: (message: string) => void
}

const AppStateContext = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<MealLog[]>(INITIAL_MEALS)
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS)
  const [waterMl, setWaterMl] = useState(INITIAL_WATER_ML)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }, [])

  const addMeal = useCallback((meal: MealLog) => {
    setMeals((current) => [meal, ...current])
  }, [])

  const addWater = useCallback((ml: number) => {
    setWaterMl((current) => Math.max(0, current + ml))
  }, [])

  const updateGoals = useCallback((partial: Partial<UserGoals>) => {
    setGoals((current) => ({ ...current, ...partial }))
  }, [])

  const value = useMemo<AppState>(
    () => ({
      meals,
      goals,
      waterMl,
      activityMinutes: MOCK_ACTIVITY.activityMinutes,
      caloriesBurned: MOCK_ACTIVITY.caloriesBurned,
      toast,
      addMeal,
      addWater,
      updateGoals,
      showToast,
    }),
    [meals, goals, waterMl, toast, addMeal, addWater, updateGoals, showToast],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState deve ser usado dentro de <AppStateProvider>')
  }
  return context
}
