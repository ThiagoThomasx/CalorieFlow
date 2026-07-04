import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { History, House, Plus, Target, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const LEFT_ITEMS: NavItem[] = [
  { to: '/app', label: 'Hoje', icon: House, end: true },
  { to: '/app/history', label: 'Histórico', icon: History },
]

const RIGHT_ITEMS: NavItem[] = [
  { to: '/app/goals', label: 'Metas', icon: Target },
  { to: '/app/profile', label: 'Perfil', icon: User },
]

function NavTab({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 py-2 transition-colors duration-200 ${
          isActive ? 'text-lime' : 'text-fog hover:text-snow'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            <Icon className="size-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
            {isActive && (
              <motion.span
                layoutId="nav-dot"
                className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-lime"
              />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </>
      )}
    </NavLink>
  )
}

/** Navegação inferior fixa com botão central de registro em destaque. */
export function BottomNav() {
  const { pathname } = useLocation()
  const isLogActive = pathname.startsWith('/app/log')

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center"
    >
      <div className="glass-strong w-full max-w-md rounded-t-3xl px-3 pb-safe">
        <div className="flex items-center pb-1.5">
          {LEFT_ITEMS.map((item) => (
            <NavTab key={item.to} {...item} />
          ))}

          <NavLink
            to="/app/log"
            aria-label="Registrar refeição"
            className="flex flex-1 flex-col items-center"
          >
            <motion.span
              whileTap={{ scale: 0.9 }}
              className={`-mt-6 flex size-14 items-center justify-center rounded-2xl transition-shadow duration-300 ${
                isLogActive
                  ? 'bg-lime-soft shadow-[0_10px_36px_-6px_rgba(185,242,77,0.7)]'
                  : 'bg-lime shadow-[0_10px_30px_-8px_rgba(185,242,77,0.55)]'
              }`}
            >
              <Plus className="size-6 text-ink" strokeWidth={2.4} />
            </motion.span>
            <span
              className={`mt-1 text-[10px] font-medium tracking-wide ${
                isLogActive ? 'text-lime' : 'text-fog'
              }`}
            >
              Registrar
            </span>
          </NavLink>

          {RIGHT_ITEMS.map((item) => (
            <NavTab key={item.to} {...item} />
          ))}
        </div>
      </div>
    </nav>
  )
}
