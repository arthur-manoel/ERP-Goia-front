'use client'
import { useState } from 'react'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Building2, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { permissoesDeTela } from '@/lib/nav'
import SimpleEditDialog from '@/components/common/simple-edit-dialog'

export default function SetoresPage() {
  const { user } = useAuth()
  const { data, create, update, remove } = useEntity('setores', user?.empresaId);const[editing,setEditing]=useState(null)

  const columns = [
    { key: 'nome', label: 'Setor', render: (r) => <div><div className="font-medium text-sm">{r.nome}</div><div className="text-[11px] text-muted-foreground">{r.tipo}</div></div> },
    { key: 'descricao', label: 'Descrição' },
    { key: 'usuarios', label: 'Usuários', cellClass: 'text-right', render: (r) => r.usuarios ?? 0 },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={()=>setEditing(r)}><Pencil className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={async() => { if (confirm(`Excluir ${r.nome}?`)) try{await remove(r.id);toast.success('Setor excluído.')}catch(e){toast.error(e.message)} }}><Trash2 className="h-3.5 w-3.5" /></Button></div>
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
      <SimpleEditDialog item={editing} title="Editar setor" fields={[{name:'nome',label:'Nome',required:true},{name:'tipo',label:'Tipo',type:'select',options:['Armazenagem','Produção','Logística','Vendas','Administrativo'].map(x=>({value:x,label:x}))},{name:'descricao',label:'Descrição',type:'textarea'},{name:'permissoes',label:'Telas permitidas',type:'multiselect',options:permissoesDeTela.map(p=>({value:p.chave,label:p.nome}))},{name:'status',label:'Status',type:'switch'}]} onClose={()=>setEditing(null)} onSave={async v=>{await update(v.id,v);setEditing(null);toast.success('Setor atualizado.')}}/>
    </div>
  )
}
