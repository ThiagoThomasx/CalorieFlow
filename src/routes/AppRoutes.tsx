import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
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
      <Route path="/" element={<WelcomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
