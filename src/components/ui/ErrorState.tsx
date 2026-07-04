import { CloudOff } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry: () => void
}

/** Estado de erro com ação de retry, consistente com o EmptyState. */
export function ErrorState({
  title = 'Não foi possível carregar',
  description = 'Verifique sua conexão e tente novamente.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="glass flex size-14 items-center justify-center rounded-2xl">
        <CloudOff className="size-6 text-amber" strokeWidth={1.6} />
      </div>
      <div>
        <p className="font-display font-semibold">{title}</p>
        <p className="mt-1 max-w-60 text-sm text-fog">{description}</p>
      </div>
      <Button className="mt-2 h-11 px-5 text-sm" variant="ghost" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}
