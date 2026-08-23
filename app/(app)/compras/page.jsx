'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { ShoppingCart, Plus, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
export default function ComprasPage(){
 const {user}=useAuth(); const [data,setData]=useState([])
 const load=async()=>{if(!user?.empresaId)return;const r=await fetch(`/api/compras?empresaId=${user.empresaId}`);const b=await r.json();if(!r.ok)throw new Error(b.error);setData(b)}
 useEffect(()=>{load().catch(e=>toast.error(e.message))},[user?.empresaId])
 const remove=async row=>{if(!confirm(`Excluir a compra ${row.codigo}?`))return;const r=await fetch(`/api/compras/${row.id}?empresaId=${user.empresaId}`,{method:'DELETE'});if(!r.ok){const b=await r.json();return toast.error(b.error)}toast.success('Compra excluída.');load()}
 const columns=[
  {key:'codigo',label:'ID',render:r=><div><div className="font-medium">{r.codigo}</div><div className="text-xs text-muted-foreground">{r.origem==='ORDEM_PRODUCAO'?`Ordem de produção ${r.ordemProducao}`:'Compra manual'}</div></div>},
  {key:'fornecedor',label:'Fornecedor'},{key:'estoque',label:'Estoque de destino'},{key:'dataEmissao',label:'Emissão',render:r=>new Date(`${r.dataEmissao}T00:00:00`).toLocaleDateString('pt-BR')},
  {key:'itens',label:'Itens',cellClass:'text-right'},{key:'valorTotal',label:'Valor',cellClass:'text-right',render:r=>money(r.valorTotal)},
  {key:'status',label:'Status',render:r=><StatusBadge status={r.status}/>},{key:'actions',label:'',cellClass:'text-right',render:r=><div className="flex justify-end gap-1"><Button asChild size="icon" variant="ghost"><Link href={`/compras/${r.id}`} title="Abrir compra"><Eye className="h-4 w-4"/></Link></Button>{r.origem==='MANUAL'&&r.status!=='entregue'&&<Button size="icon" variant="ghost" className="text-red-400" onClick={()=>remove(r)}><Trash2 className="h-4 w-4"/></Button>}</div>}
 ]
 return <div><PageHeader title="Compras" description="Compras manuais e necessidades emitidas pelas ordens de produção." icon={ShoppingCart}><Button asChild className="gap-2 company-primary-bg text-primary-foreground"><Link href="/compras/nova"><Plus className="h-4 w-4"/>Nova compra</Link></Button></PageHeader><DataTable data={data} columns={columns} searchKeys={['codigo','fornecedor','estoque','ordemProducao']}/></div>
}
