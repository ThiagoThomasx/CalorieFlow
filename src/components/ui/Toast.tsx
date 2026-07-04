import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useAppState } from '../../state/AppStateContext'

/** Toast global de feedback (ex.: "Refeição salva"). */
export function Toast() {
  const { toast } = useAppState()

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-6 pb-safe"
        >
          <div
            role="status"
            className="glass-strong flex items-center gap-2.5 rounded-2xl px-5 py-3.5 shadow-2xl shadow-black/50"
          >
            <CheckCircle2 className="size-5 text-lime" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
