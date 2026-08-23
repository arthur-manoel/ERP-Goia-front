'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { FlaskConical } from 'lucide-react'
import { toast } from 'sonner'

export default function ConsumoOPPage() {
  const { id } = useParams(); const router = useRouter(); const { user } = useAuth()
  const { data: products } = useEntity('produtos', user?.empresaId)
  const [order,setOrder] = useState(null); const [lines,setLines] = useState([]); const [saving,setSaving] = useState(false)
  useEffect(() => { if (!user?.empresaId) return; fetch(`/api/production-orders/${id}?empresaId=${user.empresaId}`).then(r=>r.json()).then(body => {
    setOrder(body); const saved = new Map((body.consumption || []).map(row => [`${row.itemId}:${row.materiaPrimaId}`,row]))
    const source = (body.suggestedConsumption || []).map(row => saved.get(`${row.itemId}:${row.materiaPrimaId}`) || row)
    setLines(source.map(row => ({ itemId:String(row.itemId), materiaPrimaId:String(row.materiaPrimaId), materiaPrima:row.materiaPrima, unidade:row.unidade, quantidadeNecessaria:String(row.necessario) })))
  }) }, [id,user?.empresaId])
  const update = (index,value) => setLines(current => current.map((line,i) => i===index ? {...line,quantidadeNecessaria:value} : line))
  const save = async () => { setSaving(true); try { const response=await fetch(`/api/production-orders/${id}/consumption`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({empresaId:user.empresaId,usuarioId:user.id,consumos:lines})}); const body=await response.json(); if(!response.ok)throw new Error(body.error); toast.success(body.message); router.push(`/ordens-producao/${id}`) } catch(error){toast.error(error.message)} finally{setSaving(false)} }
  if(!order)return <p className="text-sm text-muted-foreground">Carregando consumo…</p>
  return <div className="space-y-5"><PageHeader title={`OP ${order.numero} — consumo`} description="Quantidades calculadas pela ficha técnica × produtos planejados; ajuste o total quando necessário." icon={FlaskConical}/>
    <div className="space-y-4">{order.items?.map(item => { const itemLines=lines.map((line,index)=>({...line,index})).filter(line=>String(line.itemId)===String(item.id)); return <Card key={item.id}><CardHeader><CardTitle className="text-base flex justify-between"><span>{item.produto} · {item.cor || '—'} · {item.tamanho || '—'}</span><span className="text-muted-foreground">{Number(item.quantidade)} produtos</span></CardTitle></CardHeader><CardContent className="space-y-3">
      {!itemLines.length && <p className="text-sm text-amber-400">Este produto não possui matérias-primas em uma ficha técnica ativa.</p>}
      {itemLines.map(line => { const material=products.find(p=>String(p.id)===String(line.materiaPrimaId)); const suggestedPerPiece=Number(line.quantidadeNecessaria||0)/Number(item.quantidade||1); return <div key={`${line.itemId}:${line.materiaPrimaId}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end rounded-md border p-3"><Info label="Matéria-prima" value={line.materiaPrima}/><Info label="Quantidade por produto" value={`${suggestedPerPiece.toLocaleString('pt-BR',{maximumFractionDigits:4})} ${line.unidade}`}/><div className="space-y-1.5"><Label>Quantidade total necessária</Label><Input type="number" min="0.0001" step="0.0001" value={line.quantidadeNecessaria} onChange={e=>update(line.index,e.target.value)}/></div><Info label="Disponível" value={`${Number(material?.estoqueTotal||0).toLocaleString('pt-BR')} ${line.unidade}`} warn={Number(material?.estoqueTotal||0)<Number(line.quantidadeNecessaria||0)}/></div> })}
    </CardContent></Card> })}</div>
    <Card className="bg-secondary/20"><CardContent className="p-4 text-sm text-muted-foreground">As matérias-primas vêm exclusivamente da ficha técnica de cada produto acabado. Ao editar o total, o sistema recalcula o consumo por produto e verifica o estoque.</CardContent></Card>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>router.push(`/ordens-producao/${id}/produto`)}>Voltar à grade</Button><Button disabled={saving||!lines.length} onClick={save}>{saving?'Calculando…':'Salvar consumo e verificar estoque'}</Button></div>
  </div>
}
function Info({label,value,warn}){return <div className="space-y-1"><Label>{label}</Label><div className={`h-10 flex items-center rounded-md border px-3 text-sm ${warn?'text-red-400':'text-muted-foreground'}`}>{value}</div></div>}
