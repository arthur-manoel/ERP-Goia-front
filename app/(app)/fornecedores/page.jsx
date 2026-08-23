'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Truck, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import SimpleEditDialog from '@/components/common/simple-edit-dialog'

export default function FornecedoresPage() {
  const { user } = useAuth();const router=useRouter()
  const { data, create, update, remove } = useEntity('fornecedores', user?.empresaId);const[editing,setEditing]=useState(null)

  const columns = [
    { key: 'nome', label: 'Fornecedor', render: (r) => <div><div className="font-medium text-sm">{r.nome}</div><div className="text-[11px] text-muted-foreground">CNPJ {r.cnpj}</div></div> },
    { key: 'cidade', label: 'Cidade' },
    { key: 'contato', label: 'Contato' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={e=>{e.stopPropagation();setEditing(r)}}><Pencil className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={async e => {e.stopPropagation();if (confirm(`Excluir ${r.nome}?`)) try{await remove(r.id);toast.success('Fornecedor excluído.')}catch(x){toast.error(x.message)} }}><Trash2 className="h-3.5 w-3.5" /></Button></div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Fornecedores" description="Empresas parceiras que fornecem matérias-primas." icon={Truck}>
        <QuickCreateDialog label="Novo fornecedor" defaults={{ status: 'ativo' }} fields={[
          { name: 'nome', label: 'Razão social', required: true },
          { name: 'cnpj', label: 'CNPJ' },
          { name: 'cidade', label: 'Cidade' },
          { name: 'contato', label: 'E-mail de contato', type: 'email' },
          { name: 'telefone', label: 'Telefone' },
          { name: 'status', label: 'Ativo', type: 'switch' },
        ]} onCreate={(v) => create({ ...v, status: v.status === false ? 'inativo' : 'ativo' })} />
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['nome','cnpj','cidade']} onRowClick={r=>router.push(`/fornecedores/${r.id}`)} />
      <SimpleEditDialog item={editing} title="Editar fornecedor" fields={[{name:'nome',label:'Nome fantasia',required:true},{name:'razaoSocial',label:'Razão social',required:true},{name:'cnpj',label:'CNPJ'},{name:'cidade',label:'Cidade'},{name:'contato',label:'E-mail',type:'email'},{name:'telefone',label:'Telefone'},{name:'status',label:'Status',type:'switch'}]} onClose={()=>setEditing(null)} onSave={async v=>{await update(v.id,v);setEditing(null);toast.success('Fornecedor atualizado.')}}/>
    </div>
  )
}
