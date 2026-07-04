import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'outline'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  variant?: ButtonVariant
  isLoading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-lime text-ink font-semibold shadow-[0_8px_30px_-6px_rgba(185,242,77,0.45)] hover:bg-lime-soft',
  ghost: 'bg-white/[0.06] text-snow hover:bg-white/[0.1]',
  outline: 'border border-line text-snow hover:border-fog/60 hover:bg-white/[0.04]',
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  onClick,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      disabled={disabled || isLoading}
      className={`inline-flex h-13 items-center justify-center gap-2 rounded-2xl px-6 text-[15px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-lime/70 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {isLoading ? (
        <span
          aria-label="Carregando"
          className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        children
      )}
    </motion.button>
  )
}
