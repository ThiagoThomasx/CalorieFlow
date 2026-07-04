import type { MealLog, UserGoals } from '../types/nutrition'

export const MOCK_USER = {
  id: 'mock-user-1',
  name: 'Thiago',
  email: 'thiago@calorieflow.app',
}

export const DEFAULT_GOALS: UserGoals = {
  caloriesGoal: 2400,
  proteinGoal: 160,
  carbsGoal: 260,
  fatGoal: 75,
  waterGoalMl: 3000,
  objective: 'gain_muscle',
}

export const CUP_SIZE_ML = 250

export const MOCK_ACTIVITY = {
  activityMinutes: 42,
  caloriesBurned: 380,
  label: 'Treino de força',
}

function isoAt(daysAgo: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

/** Refeições iniciais para a Home e o Histórico não nascerem vazios. */
export const INITIAL_MEALS: MealLog[] = [
  {
    id: 'meal-1',
    userId: MOCK_USER.id,
    name: 'Café da manhã',
    description: '3 ovos mexidos, 2 fatias de pão integral e café preto',
    mealType: 'breakfast',
    calories: 420,
    protein: 26,
    carbs: 38,
    fat: 18,
    fiber: 5,
    sodium: 520,
    createdAt: isoAt(0, 7, 40),
  },
  {
    id: 'meal-2',
    userId: MOCK_USER.id,
    name: 'Almoço',
    description: 'Frango grelhado, arroz, feijão e salada verde',
    mealType: 'lunch',
    calories: 680,
    protein: 48,
    carbs: 72,
    fat: 20,
    fiber: 9,
    sodium: 840,
    createdAt: isoAt(0, 12, 30),
  },
  {
    id: 'meal-3',
    userId: MOCK_USER.id,
    name: 'Lanche da tarde',
    description: 'Iogurte grego com banana e aveia',
    mealType: 'snack',
    calories: 310,
    protein: 18,
    carbs: 42,
    fat: 8,
    fiber: 4,
    sodium: 95,
    createdAt: isoAt(0, 16, 10),
  },
  {
    id: 'meal-4',
    userId: MOCK_USER.id,
    name: 'Jantar',
    description: 'Salmão assado com batata-doce e brócolis',
    mealType: 'dinner',
    calories: 590,
    protein: 42,
    carbs: 48,
    fat: 24,
    fiber: 7,
    sodium: 380,
    createdAt: isoAt(1, 20, 0),
  },
  {
    id: 'meal-5',
    userId: MOCK_USER.id,
    name: 'Almoço',
    description: 'Strogonoff de frango com arroz e batata palha',
    mealType: 'lunch',
    calories: 740,
    protein: 38,
    carbs: 82,
    fat: 28,
    fiber: 4,
    sodium: 980,
    createdAt: isoAt(1, 12, 45),
  },
  {
    id: 'meal-6',
    userId: MOCK_USER.id,
    name: 'Café da manhã',
    description: 'Tapioca com queijo e suco de laranja',
    mealType: 'breakfast',
    calories: 380,
    protein: 14,
    carbs: 62,
    fat: 9,
    fiber: 2,
    sodium: 310,
    createdAt: isoAt(2, 8, 15),
  },
]

export const INITIAL_WATER_ML = 1250
