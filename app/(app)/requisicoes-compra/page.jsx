'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { formatDate } from '@/lib/mock-data'
import { ClipboardList, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RequisicoesPage() {
  const { user } = useAuth()
  const { data, create, remove } = useEntity('requisicoes', user?.empresaId)
  const { data: estoques } = useEntity('locais_estoque', user?.empresaId)

  const columns = [
    { key: 'numero', label: 'RC', render: (r) => <span className="font-mono text-xs">{r.numero}</span> },
    { key: 'estoque', label: 'Estoque' },
    { key: 'solicitante', label: 'Solicitante' },
    { key: 'itens', label: 'Itens', cellClass: 'text-right' },
    { key: 'data', label: 'Data', render: (r) => formatDate(r.data) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'pendente'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { if (confirm(`Excluir ${r.numero}?`)) { remove(r.id); toast.success('Excluída.') } }}><Trash2 className="h-3.5 w-3.5" /></Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Requisições de Compra" description="Necessidades identificadas para cada estoque." icon={ClipboardList}>
        <QuickCreateDialog label="Nova requisição" defaults={{ status: 'pendente', itens: 1, data: new Date().toISOString().slice(0,10), solicitante: user?.nome }} fields={[
          { name: 'numero', label: 'Número', type: 'uniqueCode', required: true, placeholder: 'RC-2025-0058' },
          { name: 'estoque', label: 'Estoque solicitante', type: 'select', options: estoques.map(s => ({ value: s.nome, label: s.nome })), required: true },
          { name: 'solicitante', label: 'Solicitante', required: true },
          { name: 'itens', label: 'Quantidade de itens', type: 'number' },
          { name: 'data', label: 'Data', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'pendente', label: 'Pendente' }, { value: 'em_analise', label: 'Em análise' }, { value: 'aprovada', label: 'Aprovada' }] },
        ]} onCreate={create} />
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['numero','estoque','solicitante']} />
    </div>
  )
}
