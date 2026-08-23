'use client'
import { useState } from 'react'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Palette, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import SimpleEditDialog from '@/components/common/simple-edit-dialog'

export default function CoresPage() {
  const { user } = useAuth()
  const { data, create, update, remove } = useEntity('cores', user?.empresaId);const[editing,setEditing]=useState(null)

  const columns = [
    { key: 'nome', label: 'Cor', render: (r) => <div className="flex items-center gap-2"><span className="h-5 w-5 rounded border border-border" style={{ background: r.hex || '#000' }} /><span className="font-medium">{r.nome}</span></div> },
    { key: 'hex', label: 'Hex', render: (r) => <span className="font-mono text-xs">{r.hex}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={()=>setEditing(r)}><Pencil className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={async() => { if (confirm(`Excluir ${r.nome}?`)) try{await remove(r.id);toast.success('Cor excluída.')}catch(e){toast.error(e.message)} }}><Trash2 className="h-3.5 w-3.5" /></Button></div>
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
      <SimpleEditDialog item={editing} title="Editar cor" fields={[{name:'nome',label:'Nome',required:true},{name:'hex',label:'Código hexadecimal'},{name:'status',label:'Status',type:'switch'}]} onClose={()=>setEditing(null)} onSave={async v=>{await update(v.id,v);setEditing(null);toast.success('Cor atualizada.')}}/>
    </div>
  )
}
