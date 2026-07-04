import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

/** Tela mínima exibida enquanto a sessão persistida é restaurada. */
export function SplashScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0.6, 1, 0.6], scale: 1 }}
        transition={{ opacity: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
        className="flex size-14 items-center justify-center rounded-2xl bg-lime shadow-[0_10px_36px_-8px_rgba(185,242,77,0.5)]"
      >
        <Flame className="size-7 text-ink" strokeWidth={2.4} />
      </motion.div>
    </div>
  )
}
