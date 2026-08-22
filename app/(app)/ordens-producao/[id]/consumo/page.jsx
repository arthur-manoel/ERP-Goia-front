'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { FlaskConical, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const emptyLine=()=>({materiaPrimaId:'',porPeca:''})
export default function ConsumoOPPage(){
  const{id}=useParams();const router=useRouter();const{user}=useAuth();const{data:products}=useEntity('produtos',user?.empresaId);const raw=products.filter(p=>p.tipo==='materia_prima')
  const[order,setOrder]=useState(null);const[lines,setLines]=useState({});const[saving,setSaving]=useState(false)
  useEffect(()=>{if(!user?.empresaId)return;fetch(`/api/production-orders/${id}?empresaId=${user.empresaId}`).then(r=>r.json()).then(body=>{setOrder(body);setLines(Object.fromEntries((body.items||[]).map(item=>[item.id,[emptyLine()]])))})},[id,user?.empresaId])
  const update=(itemId,index,key,value)=>setLines(prev=>({...prev,[itemId]:prev[itemId].map((line,i)=>i===index?{...line,[key]:value}:line)}))
  const add=itemId=>setLines(prev=>({...prev,[itemId]:[...(prev[itemId]||[]),emptyLine()]}));const remove=(itemId,index)=>setLines(prev=>({...prev,[itemId]:prev[itemId].filter((_,i)=>i!==index)}))
  const save=async()=>{const consumos=[];for(const[itemId,itemLines]of Object.entries(lines))for(const line of itemLines)if(line.materiaPrimaId&&Number(line.porPeca)>0)consumos.push({itemId,...line});setSaving(true);try{const response=await fetch(`/api/production-orders/${id}/consumption`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({empresaId:user.empresaId,usuarioId:user.id,consumos})});const body=await response.json();if(!response.ok)throw new Error(body.error);toast.success(body.message);router.push(`/ordens-producao/${id}`)}catch(error){toast.error(error.message)}finally{setSaving(false)}}
  if(!order)return <p className="text-sm text-muted-foreground">Carregando consumo…</p>
  return <div className="space-y-5"><PageHeader title={`OP ${order.numero} — consumo`} description="Etapa 3 de 3 — informe a matéria-prima necessária para cada peça de cada variação" icon={FlaskConical}/>
    <div className="space-y-4">{order.items?.map(item=><Card key={item.id}><CardHeader><CardTitle className="text-base flex justify-between"><span>{item.produto} · {item.cor} · {item.tamanho}</span><span className="text-muted-foreground">{Number(item.quantidade)} peças</span></CardTitle></CardHeader><CardContent className="space-y-3">{(lines[item.id]||[]).map((line,index)=>{const material=raw.find(p=>p.id===line.materiaPrimaId);const needed=Number(line.porPeca||0)*Number(item.quantidade);const available=Number(material?.estoqueTotal||0);return <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end rounded-md border border-border p-3"><div className="md:col-span-2 space-y-1.5"><Label>Matéria-prima</Label><Select value={line.materiaPrimaId} onValueChange={v=>update(item.id,index,'materiaPrimaId',v)}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{raw.map(p=><SelectItem key={p.id} value={p.id}>{p.nome} ({p.unidade})</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>Por peça</Label><Input type="number" min="0.001" step="0.001" value={line.porPeca} onChange={e=>update(item.id,index,'porPeca',e.target.value)}/></div><Info label="Necessário" value={`${needed.toFixed(3)} ${material?.unidade||''}`}/><Info label="Disponível" value={`${available.toFixed(3)} ${material?.unidade||''}`} warn={material&&available<needed}/><div className="flex justify-end"><Button variant="ghost" size="icon" className="text-red-400" onClick={()=>remove(item.id,index)} disabled={(lines[item.id]||[]).length===1}><Trash2 className="h-4 w-4"/></Button></div></div>})}<Button variant="outline" size="sm" className="gap-2" onClick={()=>add(item.id)}><Plus className="h-4 w-4"/>Adicionar matéria-prima</Button></CardContent></Card>)}</div>
    <Card className="border-amber-500/20 bg-amber-500/5"><CardContent className="p-4 text-sm text-muted-foreground">Ao salvar, o sistema soma o consumo de todas as cores e tamanhos, compara com todos os estoques da empresa e gera um pedido de compra somente para a quantidade faltante.</CardContent></Card>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>router.push(`/ordens-producao/${id}/produto`)}>Voltar à grade</Button><Button disabled={saving} onClick={save}>{saving?'Calculando…':'Salvar consumo e verificar estoque'}</Button></div>
  </div>
}
function Info({label,value,warn}){return <div className="space-y-1"><Label>{label}</Label><div className={`h-10 flex items-center rounded-md border border-border px-3 text-sm ${warn?'text-red-400':'text-muted-foreground'}`}>{value}</div></div>}
