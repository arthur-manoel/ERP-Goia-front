'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

export default function NovaCompra(){const router=useRouter();const{user}=useAuth();const{data:fornecedores}=useEntity('fornecedores',user?.empresaId);const{data:estoques}=useEntity('locais_estoque',user?.empresaId);const[form,setForm]=useState({codigo:'',codigoAutomatico:true,fornecedorId:'',estoqueId:'',dataEmissao:new Date().toISOString().slice(0,10),observacao:''});const[saving,setSaving]=useState(false);const set=(k,v)=>setForm(p=>({...p,[k]:v}))
 const save=async e=>{e.preventDefault();setSaving(true);try{const r=await fetch('/api/compras',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,empresaId:user.empresaId,usuarioId:user.id})});const b=await r.json();if(!r.ok)throw new Error(b.error);toast.success('Dados salvos. Agora adicione os produtos.');router.push(`/compras/${b.id}`)}catch(e){toast.error(e.message)}finally{setSaving(false)}}
 return <div className="space-y-6"><PageHeader title="Nova compra" description="Informe os dados gerais e depois adicione os produtos." icon={ShoppingCart}/><form onSubmit={save}><Card><CardHeader><CardTitle className="text-base">Dados da compra</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="ID da compra"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.codigoAutomatico} onChange={e=>set('codigoAutomatico',e.target.checked)}/>Gerar automaticamente</label>{!form.codigoAutomatico&&<Input className="mt-2" value={form.codigo} onChange={e=>set('codigo',e.target.value)} required/>}</Field><Field label="Estoque de destino *"><Select value={form.estoqueId} onValueChange={v=>set('estoqueId',v)}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{estoques.map(x=><SelectItem key={x.id} value={String(x.id)}>{x.nome}</SelectItem>)}</SelectContent></Select></Field><Field label="Fornecedor *"><Select value={form.fornecedorId} onValueChange={v=>set('fornecedorId',v)}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{fornecedores.map(x=><SelectItem key={x.id} value={String(x.id)}>{x.nome}</SelectItem>)}</SelectContent></Select></Field><Field label="Data de emissão *"><Input type="date" value={form.dataEmissao} onChange={e=>set('dataEmissao',e.target.value)} required/></Field><div className="md:col-span-2"><Field label="Observação"><Textarea value={form.observacao} onChange={e=>set('observacao',e.target.value)}/></Field></div><div className="md:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>router.push('/compras')}>Cancelar</Button><Button disabled={saving} className="company-primary-bg text-primary-foreground">{saving?'Salvando…':'Continuar para produtos'}</Button></div></CardContent></Card></form></div>}
function Field({label,children}){return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>}
