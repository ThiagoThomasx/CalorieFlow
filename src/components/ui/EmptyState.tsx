import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="glass flex size-14 items-center justify-center rounded-2xl">
        <Icon className="size-6 text-fog" strokeWidth={1.6} />
      </div>
      <div>
        <p className="font-display font-semibold">{title}</p>
        <p className="mt-1 max-w-60 text-sm text-fog">{description}</p>
      </div>
      {action}
    </div>
  )
}
