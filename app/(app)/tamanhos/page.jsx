'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Ruler, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TamanhosPage() {
  const { user } = useAuth(); const { data, create, remove } = useEntity('tamanhos', user?.empresaId)
  const columns = [
    { key: 'nome', label: 'Tamanho', render: r => <span className="font-medium">{r.nome}</span> },
    { key: 'descricao', label: 'Descrição' }, { key: 'ordem', label: 'Ordem' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: r => <Button variant="ghost" size="icon" className="text-red-400" onClick={async()=>{if(confirm(`Excluir ${r.nome}?`)){try{await remove(r.id);toast.success('Tamanho excluído.')}catch(e){toast.error(e.message)}}}}><Trash2 className="h-4 w-4"/></Button> },
  ]
  return <div><PageHeader title="Tamanhos" description="Cadastre os tamanhos utilizados pela sua empresa." icon={Ruler}>
    <QuickCreateDialog label="Novo tamanho" defaults={{ordem:0,status:'ativo'}} fields={[
      {name:'nome',label:'Nome',required:true,placeholder:'Ex: P, M, G ou 42'},
      {name:'descricao',label:'Descrição',type:'textarea'}, {name:'ordem',label:'Ordem de exibição',type:'number'},
      {name:'status',label:'Ativo',type:'switch'},
    ]} onCreate={v=>create({...v,status:v.status===false?'inativo':'ativo'})}/>
  </PageHeader><DataTable data={data} columns={columns} searchKeys={['nome','descricao']}/></div>
}

