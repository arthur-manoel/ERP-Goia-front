'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Building2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { permissoesDeTela } from '@/lib/nav'

export default function SetoresPage() {
  const { user } = useAuth()
  const { data, create, remove } = useEntity('setores', user?.empresaId)

  const columns = [
    { key: 'nome', label: 'Setor', render: (r) => <div><div className="font-medium text-sm">{r.nome}</div><div className="text-[11px] text-muted-foreground">{r.tipo}</div></div> },
    { key: 'descricao', label: 'Descrição' },
    { key: 'usuarios', label: 'Usuários', cellClass: 'text-right', render: (r) => r.usuarios ?? 0 },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { if (confirm(`Excluir ${r.nome}?`)) { remove(r.id); toast.success('Setor excluído.') } }}><Trash2 className="h-3.5 w-3.5" /></Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Setores" description="Setores operacionais da empresa." icon={Building2}>
        <QuickCreateDialog label="Novo setor" defaults={{ tipo: 'Produção', status: 'ativo', usuarios: 0, itens: 0, permissoes: ['dashboard'] }} fields={[
          { name: 'nome', label: 'Nome do setor', required: true, placeholder: 'Ex: Corte' },
          { name: 'tipo', label: 'Tipo', type: 'select', options: [{ value: 'Armazenagem', label: 'Armazenagem' }, { value: 'Produção', label: 'Produção' }, { value: 'Logística', label: 'Logística' }, { value: 'Vendas', label: 'Vendas' }, { value: 'Administrativo', label: 'Administrativo' }] },
          { name: 'descricao', label: 'Descrição', type: 'textarea' },
          { name: 'permissoes', label: 'Telas permitidas para o setor', type: 'multiselect', options: permissoesDeTela.map(p => ({ value: p.chave, label: p.nome })), required: true, hint: 'Usuários deste setor só poderão receber acesso às telas marcadas.' },
          { name: 'status', label: 'Ativo', type: 'switch' },
        ]} onCreate={(v) => create({ ...v, status: v.status === false ? 'inativo' : 'ativo' })} />
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['nome','tipo','descricao']} />
    </div>
  )
}
