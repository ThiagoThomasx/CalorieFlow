import { BrowserRouter } from 'react-router-dom'
import { AppStateProvider } from './state/AppStateContext'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <AppRoutes />
      </AppStateProvider>
    </BrowserRouter>
  )
}
