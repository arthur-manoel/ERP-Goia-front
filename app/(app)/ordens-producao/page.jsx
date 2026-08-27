'use client'
import Link from 'next/link'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Factory, Eye, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatQuantity } from '@/lib/number-format'

export default function OrdensProducaoPage() {
  const { user } = useAuth(); const { data, remove } = useEntity('ops', user?.empresaId)
  const columns = [
    { key: 'numero', label: 'OP', render: r => <span className="font-mono text-xs">{r.numero}</span> },
    { key: 'produto', label: 'Produto', render: r => <div><div className="font-medium">{r.produto || 'Produto ainda não selecionado'}</div><div className="text-xs text-muted-foreground">{r.setor}</div></div> },
    { key: 'planejada', label: 'Planejado', cellClass: 'text-right', render: r => formatQuantity(r.planejada) },
    { key: 'prioridade', label: 'Prioridade', render: r => <StatusBadge status={String(r.prioridade || 'normal').toLowerCase()} /> },
    { key: 'progresso', label: 'Progresso', render: r => <div className="min-w-32"><div className="text-xs mb-1">{formatQuantity(r.produzida)}/{formatQuantity(r.planejada)}</div><Progress value={Number(r.progresso || 0)} className="h-1.5" /></div> },
    { key: 'prazo', label: 'Prazo' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'acoes', label: '', filterable: false, cellClass: 'text-right', render: r => <div className="flex justify-end gap-1"><Link href={`/ordens-producao/${r.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link><Button variant="ghost" size="icon" className="text-red-400" onClick={async()=>{if(confirm(`Excluir ${r.numero}?`)){try{await remove(r.id);toast.success('OP excluída.')}catch(e){toast.error(e.message)}}}}><Trash2 className="h-4 w-4" /></Button></div> },
  ]
  return <div><PageHeader title="Ordens de Produção" description="Planeje produtos por cor e tamanho e calcule automaticamente a necessidade de matéria-prima." icon={Factory}><Link href="/ordens-producao/nova"><Button className="gap-2 company-primary-bg text-primary-foreground"><Plus className="h-4 w-4" />Nova OP</Button></Link></PageHeader><DataTable data={data} columns={columns} searchKeys={['numero','produto','setor','status']} /></div>
}
