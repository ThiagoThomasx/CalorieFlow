import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { AppStateProvider } from '../state/AppStateContext'
import { SplashScreen } from '../components/ui/SplashScreen'

/**
 * Rotas privadas: exige sessão ativa. Enquanto a sessão persistida
 * é restaurada, mostra o splash para evitar redirect indevido.
 */
export function ProtectedRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) return <SplashScreen />
  if (!session) return <Navigate to="/" replace />

  return (
    <AppStateProvider>
      <Outlet />
    </AppStateProvider>
  )
}

/** Rotas públicas: usuário autenticado é levado direto para o app. */
export function PublicOnlyRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) return <SplashScreen />
  if (session) return <Navigate to="/app" replace />

  return <Outlet />
}
