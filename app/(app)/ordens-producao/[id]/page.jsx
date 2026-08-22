'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import StatusBadge from '@/components/common/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/lib/auth-context'
import { Factory, Pencil, ShoppingCart } from 'lucide-react'

export default function OPDetalhe(){
  const{id}=useParams();const{user}=useAuth();const[order,setOrder]=useState(null)
  useEffect(()=>{if(user?.empresaId)fetch(`/api/production-orders/${id}?empresaId=${user.empresaId}`).then(r=>r.json()).then(setOrder)},[id,user?.empresaId])
  if(!order)return <p className="text-sm text-muted-foreground">Carregando ordem…</p>
  return <div className="space-y-5"><PageHeader title={`OP ${order.numero}`} description={`${order.setor} · ${Number(order.quantidadePlanejada)} peças planejadas`} icon={Factory}><Link href={`/ordens-producao/${id}/produto`}><Button variant="outline" className="gap-2"><Pencil className="h-4 w-4"/>Editar grade</Button></Link></PageHeader>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3"><Info label="Status"><StatusBadge status={order.status}/></Info><Info label="Prioridade"><StatusBadge status={String(order.prioridade).toLowerCase()}/></Info><Info label="Setor" value={order.setor}/><Info label="Abertura" value={order.dataAbertura}/><Info label="Prazo" value={order.prazoConclusao||'—'}/></div>
    <Card><CardHeader><CardTitle className="text-base">Grade de produção</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Cor</TableHead><TableHead>Tamanho</TableHead><TableHead className="text-right">Quantidade</TableHead></TableRow></TableHeader><TableBody>{order.items?.map(item=><TableRow key={item.id}><TableCell>{item.produto}</TableCell><TableCell>{item.cor}</TableCell><TableCell>{item.tamanho}</TableCell><TableCell className="text-right">{Number(item.quantidade)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Planejamento de matéria-prima</CardTitle><Link href={`/ordens-producao/${id}/consumo`}><Button variant="outline" size="sm">Editar consumo</Button></Link></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Variação</TableHead><TableHead>Matéria-prima</TableHead><TableHead className="text-right">Por peça</TableHead><TableHead className="text-right">Necessário</TableHead><TableHead className="text-right">Disponível utilizado</TableHead><TableHead className="text-right">Faltante</TableHead></TableRow></TableHeader><TableBody>{order.consumption?.map(row=>{const item=order.items.find(i=>String(i.id)===String(row.itemId));return <TableRow key={row.id}><TableCell>{item?.cor} / {item?.tamanho}</TableCell><TableCell>{row.materiaPrima}</TableCell><TableCell className="text-right">{Number(row.porPeca)} {row.unidade}</TableCell><TableCell className="text-right">{Number(row.necessario)} {row.unidade}</TableCell><TableCell className="text-right">{Number(row.disponivel)} {row.unidade}</TableCell><TableCell className={`text-right ${Number(row.faltante)>0?'text-red-400':'text-emerald-400'}`}>{Number(row.faltante)} {row.unidade}</TableCell></TableRow>})}</TableBody></Table>{order.pedidoCompra&&<div className="mt-4 flex items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/10 p-3"><span className="text-sm">Material insuficiente: pedido <strong>{order.pedidoCompra}</strong> gerado automaticamente.</span><Link href="/pedidos-compra"><Button size="sm" className="gap-2"><ShoppingCart className="h-4 w-4"/>Ver pedido</Button></Link></div>}</CardContent></Card>
    <div><Link href="/ordens-producao"><Button variant="outline">Voltar para Ordens de Produção</Button></Link></div>
  </div>
}
function Info({label,value,children}){return <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">{label}</div><div className="mt-1 font-medium">{children||value}</div></CardContent></Card>}
