import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './guards'
import WelcomePage from '../pages/WelcomePage'
import AuthPage from '../pages/AuthPage'
import HomePage from '../pages/HomePage'
import LogPage from '../pages/LogPage'
import HistoryPage from '../pages/HistoryPage'
import GoalsPage from '../pages/GoalsPage'
import ProfilePage from '../pages/ProfilePage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Públicas — usuário logado é redirecionado para /app */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Route>

      {/* Privadas — exigem sessão ativa */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="log" element={<LogPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
