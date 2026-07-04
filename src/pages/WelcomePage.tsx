import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Droplets, Flame, Zap } from 'lucide-react'
import { Button } from '../components/ui/Button'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
}

interface FloatingChipProps {
  className: string
  delay: number
  children: React.ReactNode
}

function FloatingChip({ className, delay, children }: FloatingChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        y: { duration: 4.5, delay: delay + 0.6, repeat: Infinity, ease: 'easeInOut' },
      }}
      className={`glass-strong absolute flex items-center gap-2 rounded-2xl px-3.5 py-2.5 shadow-xl shadow-black/40 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden px-6 pt-safe pb-safe">
      {/* Fundo ambiente */}
      <div aria-hidden className="orb -top-20 -left-24 size-80 bg-lime/15" />
      <div aria-hidden className="orb top-1/3 -right-28 size-72 bg-cyan/10" />
      <div aria-hidden className="orb bottom-0 -left-16 size-64 bg-violet/10" />

      {/* Logo */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        className="mt-14 flex items-center gap-2.5"
      >
        <div className="flex size-9 items-center justify-center rounded-xl bg-lime shadow-[0_6px_24px_-4px_rgba(185,242,77,0.5)]">
          <Flame className="size-5 text-ink" strokeWidth={2.4} />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">
          CalorieFlow
        </span>
      </motion.div>

      {/* Visual central com chips flutuantes */}
      <div className="relative mt-4 flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="glass flex size-56 items-center justify-center rounded-full"
        >
          <div className="glass-strong flex size-40 flex-col items-center justify-center rounded-full">
            <span className="font-display text-4xl font-bold text-lime">1.410</span>
            <span className="mt-1 text-xs tracking-wide text-fog">de 2.400 kcal</span>
          </div>
        </motion.div>

        <FloatingChip className="top-6 -right-1" delay={0.5}>
          <Zap className="size-4 text-violet" />
          <div className="text-left">
            <p className="text-xs font-semibold">92g proteína</p>
            <p className="text-[10px] text-fog">58% da meta</p>
          </div>
        </FloatingChip>

        <FloatingChip className="bottom-10 -left-1" delay={0.7}>
          <Droplets className="size-4 text-cyan" />
          <div className="text-left">
            <p className="text-xs font-semibold">1,25 L água</p>
            <p className="text-[10px] text-fog">faltam 1,75 L</p>
          </div>
        </FloatingChip>

        <FloatingChip className="-bottom-2 right-4" delay={0.9}>
          <Flame className="size-4 text-amber" />
          <p className="text-xs font-semibold">380 kcal ativas</p>
        </FloatingChip>
      </div>

      {/* Headline + CTAs */}
      <div className="mt-6 mb-10">
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="font-display text-[2.6rem] leading-[1.08] font-bold tracking-tight text-balance"
        >
          Registre sua nutrição{' '}
          <span className="bg-gradient-to-r from-lime to-cyan bg-clip-text text-transparent">
            em segundos.
          </span>
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-3 text-[15px] leading-relaxed text-fog"
        >
          Calorias, macros, água e treinos em um fluxo rápido, calmo e feito
          para o seu dia a dia.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 flex flex-col gap-3"
        >
          <Button fullWidth onClick={() => navigate('/auth?mode=signup')}>
            Começar
          </Button>
          <Button fullWidth variant="ghost" onClick={() => navigate('/auth')}>
            Entrar
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
