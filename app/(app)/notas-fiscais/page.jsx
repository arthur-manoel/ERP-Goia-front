'use client'
import Link from 'next/link'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { formatBRL, formatDate } from '@/lib/mock-data'
import { FileText, Eye, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function NotasFiscaisPage() {
  const { user } = useAuth()
  const { data, remove } = useEntity('notas', user?.empresaId)

  const columns = [
    { key: 'numero', label: 'NF', render: (r) => <div><div className="font-medium text-sm">Nº {r.numero}</div><div className="text-[11px] text-muted-foreground">Série {r.serie}</div></div> },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'dataEmissao', label: 'Emissão', render: (r) => formatDate(r.dataEmissao) },
    { key: 'estoqueDestino', label: 'Estoque destino' },
    { key: 'itens', label: 'Itens', cellClass: 'text-right' },
    { key: 'valorTotal', label: 'Valor', cellClass: 'text-right', render: (r) => <span className="font-medium">{formatBRL(r.valorTotal||0)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'pendente'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <div className="flex justify-end gap-1">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8"><Link href={`/notas-fiscais/${r.id}`} title="Ver ou editar nota"><Eye className="h-3.5 w-3.5" /></Link></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { if (confirm(`Excluir NF ${r.numero}?`)) { remove(r.id); toast.success('Excluída.') } }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Notas Fiscais" description="Entradas de matérias-primas dos fornecedores." icon={FileText}>
        <Button asChild className="gap-2 company-primary-bg text-primary-foreground hover:opacity-90"><Link href="/notas-fiscais/nova"><Plus className="h-4 w-4" />Nova nota fiscal</Link></Button>
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['numero','fornecedor']} />
    </div>
  )
}
