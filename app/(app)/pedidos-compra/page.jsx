import { redirect } from 'next/navigation'
export default function Page(){redirect('/compras')}
/*
'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { formatBRL, formatDate } from '@/lib/mock-data'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PedidosCompraPage() {
  const { user } = useAuth()
  const { data, create, remove } = useEntity('pedidos', user?.empresaId)
  const { data: fornecedores } = useEntity('fornecedores', user?.empresaId)

  const columns = [
    { key: 'numero', label: 'PC', render: (r) => <span className="font-mono text-xs">{r.numero}</span> },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'itens', label: 'Itens', cellClass: 'text-right' },
    { key: 'valor', label: 'Valor', cellClass: 'text-right', render: (r) => <span className="font-medium">{formatBRL(r.valor)}</span> },
    { key: 'prazoEntrega', label: 'Prazo', render: (r) => formatDate(r.prazoEntrega) },
    { key: 'pagamento', label: 'Pagamento' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'confirmado'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { if (confirm(`Excluir ${r.numero}?`)) { remove(r.id); toast.success('Excluído.') } }}><Trash2 className="h-3.5 w-3.5" /></Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Pedidos de Compra" description="Pedidos enviados aos fornecedores." icon={ShoppingCart}>
        <QuickCreateDialog label="Novo pedido" defaults={{ status: 'confirmado', itens: 1, valor: 0, pagamento: '30 dias', prazoEntrega: new Date().toISOString().slice(0,10) }} fields={[
          { name: 'numero', label: 'Número', type: 'uniqueCode', required: true, placeholder: 'PC-2025-0093' },
          { name: 'fornecedor', label: 'Fornecedor', type: 'select', options: fornecedores.map(f => ({ value: f.nome, label: f.nome })), required: true },
          { name: 'itens', label: 'Quantidade de itens', type: 'number' },
          { name: 'valor', label: 'Valor total', type: 'currency' },
          { name: 'prazoEntrega', label: 'Prazo de entrega', type: 'date' },
          { name: 'pagamento', label: 'Condição de pagamento', placeholder: 'Ex: 30 dias' },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'confirmado', label: 'Confirmado' }, { value: 'em_transito', label: 'Em trânsito' }, { value: 'entregue', label: 'Entregue' }] },
        ]} onCreate={(v) => create({ ...v, valor: Number(v.valor||0), itens: Number(v.itens||1) })} />
      </PageHeader>
      <DataTable data={data.filter(p => p.status !== 'recebido')} columns={columns} searchKeys={['numero','fornecedor']} />
    </div>
  )
}
*/
