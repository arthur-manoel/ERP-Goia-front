'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Palette, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CoresPage() {
  const { user } = useAuth()
  const { data, create, remove } = useEntity('cores', user?.empresaId)

  const columns = [
    { key: 'nome', label: 'Cor', render: (r) => <div className="flex items-center gap-2"><span className="h-5 w-5 rounded border border-border" style={{ background: r.hex || '#000' }} /><span className="font-medium">{r.nome}</span></div> },
    { key: 'hex', label: 'Hex', render: (r) => <span className="font-mono text-xs">{r.hex}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { if (confirm(`Excluir ${r.nome}?`)) { remove(r.id); toast.success('Cor excluída.') } }}><Trash2 className="h-3.5 w-3.5" /></Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Cores" description="Paleta de cores disponíveis." icon={Palette}>
        <QuickCreateDialog label="Nova cor" defaults={{ hex: '#22c55e', status: 'ativo' }} fields={[
          { name: 'nome', label: 'Nome', required: true, placeholder: 'Ex: Vermelho Bandeira' },
          { name: 'hex', label: 'Código hexadecimal', type: 'color' },
          { name: 'status', label: 'Ativo', type: 'switch' },
        ]} onCreate={(v) => create({ ...v, status: v.status === false ? 'inativo' : 'ativo' })} />
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['nome','hex']} />
    </div>
  )
}
