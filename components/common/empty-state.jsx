'use client'
import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'Nenhum registro encontrado', description = 'Ajuste os filtros ou cadastre um novo item.', icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-full bg-secondary/60 grid place-items-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
