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
import { UserCog, Trash2, Pencil } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import SimpleEditDialog from '@/components/common/simple-edit-dialog'

export default function UsuariosPage() {
  const { user } = useAuth();const router=useRouter()
  const { data, create, update, remove } = useEntity('usuarios', user?.empresaId);const[editing,setEditing]=useState(null)
  const { data: setores } = useEntity('setores', user?.empresaId)

  const perfilLabel = { admin_empresa: 'Admin', usuario: 'Usuário' }

  const columns = [
    { key: 'nome', label: 'Usuário', render: (r) => <div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-secondary">{(r.nome||'?').split(' ').map(n=>n[0]).slice(0,2).join('')}</AvatarFallback></Avatar><div><div className="font-medium text-sm">{r.nome}</div><div className="text-[11px] text-muted-foreground">{r.email}</div></div></div> },
    { key: 'setor', label: 'Setor' },
    { key: 'perfil', label: 'Perfil', render: (r) => <span className="text-xs">{perfilLabel[r.perfil] || 'Usuário'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={e=>{e.stopPropagation();setEditing(r)}}><Pencil className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={async e => {e.stopPropagation();if (confirm(`Excluir ${r.nome}?`)) try{await remove(r.id);toast.success('Usuário excluído.')}catch(x){toast.error(x.message)} }}><Trash2 className="h-3.5 w-3.5" /></Button></div>
    )},
  ]

  const setorOptions = setores.map(s => ({ value: s.nome, label: s.nome }))

  return (
    <div>
      <PageHeader title="Usuários" description="Gerencie usuários da empresa." icon={UserCog}>
        <QuickCreateDialog label="Novo usuário" defaults={{ perfil: 'usuario', status: 'ativo', senha: 'demo1234' }} fields={[
          { name: 'nome', label: 'Nome completo', required: true },
          { name: 'email', label: 'E-mail', type: 'email', required: true },
          { name: 'senha', label: 'Senha inicial', type: 'password', required: true, hint: 'Mínimo 4 caracteres' },
          { name: 'setor', label: 'Setor', type: 'select', options: setorOptions, required: true, hint: 'O usuário só vê dados deste setor.' },
          { name: 'perfil', label: 'Perfil', type: 'select', options: [{ value: 'usuario', label: 'Usuário comum' }, { value: 'admin_empresa', label: 'Administrador da empresa' }] },
          { name: 'status', label: 'Ativo', type: 'switch' },
        ]} onCreate={(v) => {
          const setorObj = setores.find(s => s.nome === v.setor)
          create({ ...v, setorId: setorObj?.id, status: v.status === false ? 'inativo' : 'ativo', cadastradoEm: new Date().toISOString().slice(0,10) })
        }} />
      </PageHeader>
      <DataTable data={data} columns={columns} searchKeys={['nome','email','setor']} onRowClick={r=>router.push(`/usuarios/${r.id}`)} />
      <SimpleEditDialog item={editing} title="Editar usuário" fields={[{name:'nome',label:'Nome',required:true},{name:'email',label:'E-mail',type:'email',required:true},{name:'setorId',label:'Setor',type:'select',options:setores.map(s=>({value:s.id,label:s.nome}))},{name:'perfil',label:'Perfil',type:'select',options:[{value:'usuario',label:'Usuário comum'},{value:'admin_empresa',label:'Administrador'}]},{name:'senha',label:'Nova senha (opcional)',type:'password'},{name:'status',label:'Status',type:'switch'}]} onClose={()=>setEditing(null)} onSave={async v=>{await update(v.id,v);setEditing(null);toast.success('Usuário atualizado.')}}/>
    </div>
  )
}
