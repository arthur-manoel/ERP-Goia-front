'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ClientesPage() {
  const { user } = useAuth()
  const { data, create, remove } = useEntity('clientes', user?.empresaId)

  const columns = [
    { key: 'nome', label: 'Cliente', render: (r) => <div><div className="font-medium text-sm">{r.nome}</div><div className="text-[11px] text-muted-foreground">{r.tipo} · {r.documento}</div></div> },
    { key: 'email', label: 'E-mail' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { if (confirm(`Excluir ${r.nome}?`)) { remove(r.id); toast.success('Cliente excluído.') } }}><Trash2 className="h-3.5 w-3.5" /></Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Clientes" description="Cadastro de clientes PF e PJ." icon={Users}>
        <QuickCreateDialog label="Novo cliente" defaults={{ tipo: 'PJ', status: 'ativo' }} fields={[
          { name: 'nome', label: 'Nome / Razão social', required: true },
          { name: 'tipo', label: 'Tipo', type: 'select', options: [{ value: 'PJ', label: 'Pessoa Jurídica' }, { value: 'PF', label: 'Pessoa Física' }] },
          { name: 'documento', label: 'CPF / CNPJ' },
          { name: 'email', label: 'E-mail', type: 'email' },
          { name: 'cidade', label: 'Cidade' },
          { name: 'status', label: 'Ativo', type: 'switch' },
        ]} onCreate={(v) => create({ ...v, status: v.status === false ? 'inativo' : 'ativo' })} />
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['nome','email','documento']} />
    </div>
  )
}
