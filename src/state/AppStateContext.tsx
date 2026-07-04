import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  MealLog,
  MealType,
  NutritionAnalysis,
  UserGoals,
} from '../types/nutrition'
import type { DailyActivity, Profile } from '../types/user'
import { DEFAULT_GOALS } from '../lib/constants'
import { dayKey } from '../lib/format'
import { mealsRepository } from '../repositories/mealsRepository'
import { goalsRepository } from '../repositories/goalsRepository'
import { waterRepository } from '../repositories/waterRepository'
import { activityRepository } from '../repositories/activityRepository'
import { profileRepository } from '../repositories/profileRepository'
import { useAuth } from './AuthContext'

const TOAST_DURATION_MS = 2600
const PERSIST_DEBOUNCE_MS = 600

export type LoadStatus = 'loading' | 'ready' | 'error'

interface AppState {
  status: LoadStatus
  meals: MealLog[]
  goals: UserGoals
  waterMl: number
  activity: DailyActivity | null
  profile: Profile | null
  toast: string | null
  addMeal: (mealType: MealType, analysis: NutritionAnalysis) => Promise<boolean>
  addWater: (ml: number) => void
  updateGoals: (partial: Partial<UserGoals>) => void
  retry: () => void
  showToast: (message: string) => void
}

const AppStateContext = createContext<AppState | null>(null)

/**
 * Sincroniza os dados do usuário autenticado com o Supabase.
 * A persistência mora nos repositories; o contexto só orquestra
 * estado em memória + escritas com feedback.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [status, setStatus] = useState<LoadStatus>('loading')
  const [meals, setMeals] = useState<MealLog[]>([])
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS)
  const [waterMl, setWaterMl] = useState(0)
  const [activity, setActivity] = useState<DailyActivity | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const waterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const goalsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const waterRef = useRef(0)
  const goalsRef = useRef<UserGoals>(DEFAULT_GOALS)
  const loadIdRef = useRef(0)

  const todayKey = dayKey(new Date().toISOString())

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }, [])

  const loadAll = useCallback(async () => {
    if (!userId) return
    // Invalida respostas de cargas anteriores ainda em voo
    // (retry rápido, virada de dia) para não aplicar dados obsoletos.
    const loadId = ++loadIdRef.current
    setStatus('loading')
    try {
      const [mealsData, goalsData, water, activityData, profileData] =
        await Promise.all([
          mealsRepository.listByUser(userId),
          goalsRepository.getByUser(userId),
          waterRepository.getForDate(userId, todayKey),
          activityRepository.getForDate(userId, todayKey),
          profileRepository.getById(userId),
        ])

      if (loadId !== loadIdRef.current) return

      const resolvedGoals = goalsData ?? DEFAULT_GOALS
      goalsRef.current = resolvedGoals
      waterRef.current = water

      setMeals(mealsData)
      setGoals(resolvedGoals)
      setWaterMl(water)
      setActivity(activityData)
      setProfile(profileData)
      setStatus('ready')
    } catch {
      if (loadId === loadIdRef.current) setStatus('error')
    }
  }, [userId, todayKey])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // Limpa timers pendentes ao desmontar (ex.: logout).
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      if (waterTimer.current) clearTimeout(waterTimer.current)
      if (goalsTimer.current) clearTimeout(goalsTimer.current)
    }
  }, [])

  const addMeal = useCallback(
    async (mealType: MealType, analysis: NutritionAnalysis): Promise<boolean> => {
      if (!userId) return false
      try {
        const saved = await mealsRepository.create(userId, { mealType, analysis })
        setMeals((current) => [saved, ...current])
        return true
      } catch {
        showToast('Não foi possível salvar a refeição. Tente novamente.')
        return false
      }
    },
    [userId, showToast],
  )

  const addWater = useCallback(
    (ml: number) => {
      if (!userId) return
      const next = Math.max(0, waterRef.current + ml)
      waterRef.current = next
      setWaterMl(next)

      if (waterTimer.current) clearTimeout(waterTimer.current)
      waterTimer.current = setTimeout(() => {
        waterRepository.setForDate(userId, todayKey, next).catch(() => {
          showToast('Não foi possível sincronizar a água. Tente novamente.')
        })
      }, PERSIST_DEBOUNCE_MS)
    },
    [userId, todayKey, showToast],
  )

  const updateGoals = useCallback(
    (partial: Partial<UserGoals>) => {
      if (!userId) return
      const next = { ...goalsRef.current, ...partial }
      goalsRef.current = next
      setGoals(next)

      if (goalsTimer.current) clearTimeout(goalsTimer.current)
      goalsTimer.current = setTimeout(() => {
        goalsRepository.upsert(userId, next).catch(() => {
          showToast('Não foi possível salvar as metas. Tente novamente.')
        })
      }, PERSIST_DEBOUNCE_MS)
    },
    [userId, showToast],
  )

  const retry = useCallback(() => {
    void loadAll()
  }, [loadAll])

  const value = useMemo<AppState>(
    () => ({
      status,
      meals,
      goals,
      waterMl,
      activity,
      profile,
      toast,
      addMeal,
      addWater,
      updateGoals,
      retry,
      showToast,
    }),
    [
      status,
      meals,
      goals,
      waterMl,
      activity,
      profile,
      toast,
      addMeal,
      addWater,
      updateGoals,
      retry,
      showToast,
    ],
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
