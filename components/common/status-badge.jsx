'use client'
import { cn } from '@/lib/utils'

const map = {
  ativo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ativa: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inativo: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  inativa: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  pendente: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  em_analise: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  aprovada: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  em_transito: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  confirmado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  entregue: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  recebida: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelada: 'bg-red-500/15 text-red-400 border-red-500/30',
  em_producao: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  em_separacao: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  aguardando_material: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  aberta: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  rascunho: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  concluida: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  confirmada: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  normal: 'bg-secondary text-secondary-foreground border-border',
  alta: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const labelMap = {
  em_analise: 'em análise', em_transito: 'em trânsito', em_producao: 'em produção',
  em_separacao: 'em separação', aguardando_material: 'aguardando material',
  concluida: 'concluída', confirmada: 'confirmada',
}

export default function StatusBadge({ status }) {
  const cls = map[status] || 'bg-secondary text-secondary-foreground border-border'
  const label = labelMap[status] || status
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize', cls)}>
      {label}
    </span>
  )
}
