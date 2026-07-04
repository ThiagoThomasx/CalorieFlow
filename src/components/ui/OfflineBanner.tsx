import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

/** Aviso fixo quando o dispositivo perde a conexão. */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 top-0 z-50 flex justify-center px-6 pt-safe"
        >
          <div
            role="status"
            className="glass-strong mt-3 flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-xl shadow-black/40"
          >
            <WifiOff className="size-4 text-amber" />
            <span className="text-xs font-medium">
              Sem conexão — suas alterações podem não ser salvas.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
