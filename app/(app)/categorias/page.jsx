'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Layers3, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CategoriasPage() {
  const { user } = useAuth()
  const { data, create, remove } = useEntity('categorias', user?.empresaId)

  const columns = [
    { key: 'nome', label: 'Nome', render: (r) => <span className="font-medium">{r.nome}</span> },
    { key: 'descricao', label: 'Descrição' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { if (confirm(`Excluir ${r.nome}?`)) { remove(r.id); toast.success('Categoria excluída.') } }}><Trash2 className="h-3.5 w-3.5" /></Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Categorias" description="Classificação dos produtos." icon={Layers3}>
        <QuickCreateDialog label="Nova categoria" defaults={{ status: 'ativo' }} fields={[
          { name: 'nome', label: 'Nome', required: true, placeholder: 'Ex: Tecidos' },
          { name: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Descrição opcional' },
          { name: 'status', label: 'Ativo', type: 'switch' },
        ]} onCreate={(v) => create({ ...v, status: v.status === false ? 'inativo' : 'ativo' })} />
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['nome','descricao']} />
    </div>
  )
}
