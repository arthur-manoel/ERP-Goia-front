'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { formatBRL, formatDate } from '@/lib/mock-data'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function VendasPage() {
  const { user } = useAuth()
  const { data, create, remove } = useEntity('vendas', user?.empresaId)
  const { data: clientes } = useEntity('clientes', user?.empresaId)

  const columns = [
    { key: 'numero', label: 'Venda', render: (r) => <span className="font-mono text-xs">{r.numero}</span> },
    { key: 'cliente', label: 'Cliente', render: (r) => <span className="font-medium text-sm">{r.cliente}</span> },
    { key: 'data', label: 'Data', render: (r) => formatDate(r.data) },
    { key: 'itens', label: 'Itens', cellClass: 'text-right' },
    { key: 'valor', label: 'Valor', cellClass: 'text-right', render: (r) => <span className="font-medium">{formatBRL(r.valor||0)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'confirmada'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { if (confirm(`Excluir ${r.numero}?`)) { remove(r.id); toast.success('Excluída.') } }}><Trash2 className="h-3.5 w-3.5" /></Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Vendas" description="Registro e acompanhamento de vendas e entregas." icon={ShoppingBag}>
        <QuickCreateDialog label="Nova venda" defaults={{ status: 'confirmada', itens: 1, valor: 0, data: new Date().toISOString().slice(0,10) }} fields={[
          { name: 'numero', label: 'Número', type: 'uniqueCode', required: true, placeholder: 'V-2025-0306' },
          { name: 'cliente', label: 'Cliente', type: 'select', options: clientes.map(c => ({ value: c.nome, label: c.nome })), required: true },
          { name: 'data', label: 'Data', type: 'date' },
          { name: 'itens', label: 'Quantidade de itens', type: 'number' },
          { name: 'valor', label: 'Valor total', type: 'currency' },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'rascunho', label: 'Rascunho' }, { value: 'confirmada', label: 'Confirmada' }, { value: 'em_separacao', label: 'Em separação' }, { value: 'entregue', label: 'Entregue' }] },
        ]} onCreate={(v) => create({ ...v, valor: Number(v.valor||0), itens: Number(v.itens||1) })} />
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['numero','cliente']} />
    </div>
  )
}
