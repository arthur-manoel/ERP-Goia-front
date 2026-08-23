'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { Factory } from 'lucide-react'
import { toast } from 'sonner'

export default function NovaOPPage() {
  const router = useRouter(); const { user } = useAuth(); const { data: setores } = useEntity('setores', user?.empresaId)
  const [saving,setSaving]=useState(false); const [form,setForm]=useState({numero:'',numeroAutomatico:true,setorId:'',prioridade:'normal',dataAbertura:new Date().toISOString().slice(0,10),prazoConclusao:'',status:'planejada'})
  const upd=(key,value)=>setForm(prev=>({...prev,[key]:value}))
  const save=async e=>{e.preventDefault();setSaving(true);try{const response=await fetch('/api/production-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,empresaId:user.empresaId,usuarioId:user.id})});const body=await response.json();if(!response.ok)throw new Error(body.error);toast.success('Dados gerais da OP salvos.');router.push(`/ordens-producao/${body.id}/produto`)}catch(error){toast.error(error.message)}finally{setSaving(false)}}
  return <div><PageHeader title="Nova ordem de produção" description="Etapa 1 de 3 — dados gerais" icon={Factory}/><Card className="max-w-5xl"><CardContent className="p-6"><form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    <Field label="Número da OP"><div className="space-y-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.numeroAutomatico} onChange={e=>{upd('numeroAutomatico',e.target.checked);if(e.target.checked)upd('numero','')}}/>Gerar automaticamente</label>{!form.numeroAutomatico&&<Input value={form.numero} onChange={e=>upd('numero',e.target.value)} />}</div></Field>
    <Field label="Setor inicial *"><Select value={form.setorId} onValueChange={v=>upd('setorId',v)}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{setores.filter(s=>s.status==='ativo').map(s=><SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent></Select></Field>
    <Field label="Prioridade *"><Select value={form.prioridade} onValueChange={v=>upd('prioridade',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="urgente">Urgente</SelectItem></SelectContent></Select></Field>
    <Field label="Data de abertura *"><Input type="date" value={form.dataAbertura} onChange={e=>upd('dataAbertura',e.target.value)}/></Field>
    <Field label="Prazo de conclusão *"><Input type="date" value={form.prazoConclusao} onChange={e=>upd('prazoConclusao',e.target.value)}/></Field>
    <Field label="Status *"><Select value={form.status} onValueChange={v=>upd('status',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="planejada">Planejada</SelectItem><SelectItem value="aguardando_material">Aguardando material</SelectItem><SelectItem value="liberada">Liberada</SelectItem><SelectItem value="em_producao">Em produção</SelectItem><SelectItem value="pausada">Pausada</SelectItem><SelectItem value="concluida">Concluída</SelectItem><SelectItem value="cancelada">Cancelada</SelectItem></SelectContent></Select></Field>
    <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-2 pt-3"><Button type="button" variant="outline" onClick={()=>router.push('/ordens-producao')}>Cancelar</Button><Button disabled={saving}>{saving?'Salvando…':'Continuar para o produto'}</Button></div>
  </form></CardContent></Card></div>
}
function Field({label,children}){return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>}
