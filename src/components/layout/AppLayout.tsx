import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Toast } from '../ui/Toast'

/**
 * Shell autenticado do app: coluna central com largura de mobile,
 * conteúdo rolável e bottom navigation fixa.
 */
export function AppLayout() {
  return (
    <div className="relative min-h-dvh">
      {/* Glow ambiente sutil no topo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(185,242,77,0.07),transparent)]"
      />
      <main className="relative z-10 mx-auto w-full max-w-md px-5 pt-safe pb-36">
        <Outlet />
      </main>
      <BottomNav />
      <Toast />
    </div>
  )
}
