'use client'
import { useMemo, useState } from 'react'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { formatBRL } from '@/lib/mock-data'
import { Boxes, AlertTriangle, ArrowRightLeft, Trash2, Warehouse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { useEntity } from '@/lib/data-store'
import { toast } from 'sonner'

export default function EstoquePage() {
  const { user } = useAuth(); const saldos = useEntity('estoque', user?.empresaId); const locais = useEntity('locais_estoque', user?.empresaId)
  const [estoqueSelecionado, setEstoqueSelecionado] = useState('__all__'); const [somenteAbaixo, setSomenteAbaixo] = useState(false); const [transferOpen, setTransferOpen] = useState(false)
  const [transfer, setTransfer] = useState({ origemId: '', destinoId: '', produtoId: '', quantidade: 1 }); const [transferring, setTransferring] = useState(false)
  const rows = saldos.data.filter(row => estoqueSelecionado === '__all__' || String(row.estoqueId) === estoqueSelecionado).filter(row => !somenteAbaixo || Number(row.disponivel) <= Number(row.minimo))
  const produtosOrigem = useMemo(() => saldos.data.filter(row => String(row.estoqueId) === transfer.origemId && Number(row.disponivel) > 0), [saldos.data, transfer.origemId])
  const columns = [
    { key: 'produto', label: 'Produto', render: row => <div><div className="font-medium text-sm">{row.produto}</div><div className="text-[11px] text-muted-foreground font-mono">{row.codigo}</div></div> }, { key: 'estoque', label: 'Estoque' },
    { key: 'total', label: 'Total', cellClass: 'text-right' }, { key: 'reservado', label: 'Reservado', cellClass: 'text-right' },
    { key: 'disponivel', label: 'Disponível', cellClass: 'text-right', render: row => <span className={`flex justify-end items-center gap-1 font-medium ${Number(row.disponivel) === 0 ? 'text-red-400' : Number(row.disponivel) <= Number(row.minimo) ? 'text-amber-400' : ''}`}>{Number(row.disponivel) <= Number(row.minimo) && <AlertTriangle className="h-3 w-3"/>}{row.disponivel}</span> },
    { key: 'minimo', label: 'Qtd. mínima', cellClass: 'text-right', render: row => <span>{Number(row.minimo || 0)} {row.unidadeMinimo === 'metro' ? 'm' : 'un.'}</span> },
    { key: 'valorUnitario', label: 'Valor unitário', cellClass: 'text-right', render: row => formatBRL(row.valorUnitario) },
    { key: 'valorTotal', label: 'Valor total', cellClass: 'text-right', render: row => formatBRL(row.valorTotal) },
  ]
  const localColumns = [
    { key: 'nome', label: 'Estoque', render: row => <span className="font-medium">{row.nome}</span> }, { key: 'descricao', label: 'Descrição' }, { key: 'itens', label: 'Itens', cellClass: 'text-right' }, { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status}/> },
    { key: 'a', label: '', cellClass: 'text-right', filterable: false, render: row => <Button variant="ghost" size="icon" className="text-red-400" onClick={async()=>{if(confirm(`Excluir o estoque ${row.nome}?`)){try{await locais.remove(row.id);toast.success('Estoque excluído.')}catch(error){toast.error(error.message)}}}}><Trash2 className="h-4 w-4"/></Button> },
  ]
  const submitTransfer = async () => { setTransferring(true); try { const response = await fetch('/api/stock/transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...transfer,empresaId:user.empresaId,usuarioId:user.id})});const body=await response.json();if(!response.ok)throw new Error(body.error);await saldos.reload();setTransferOpen(false);setTransfer({origemId:'',destinoId:'',produtoId:'',quantidade:1});toast.success('Item transferido entre os estoques.')}catch(error){toast.error(error.message)}finally{setTransferring(false)} }
  return <div><PageHeader title="Estoque" description="Gerencie locais, visualize todos os itens e transfira saldos entre estoques." icon={Boxes}>
    <Button variant="outline" className="gap-2" disabled={locais.data.length<2||saldos.data.length===0} onClick={()=>setTransferOpen(true)}><ArrowRightLeft className="h-4 w-4"/>Transferir item</Button>
    <QuickCreateDialog label="Novo estoque" defaults={{status:'ativo'}} fields={[{name:'nome',label:'Nome do estoque',required:true},{name:'descricao',label:'Descrição',type:'textarea'},{name:'status',label:'Ativo',type:'switch'}]} onCreate={value=>locais.create({...value,status:value.status===false?'inativo':'ativo'})}/>
  </PageHeader><Tabs defaultValue="itens"><TabsList><TabsTrigger value="itens">Itens dos estoques</TabsTrigger><TabsTrigger value="locais">Estoques cadastrados ({locais.data.length})</TabsTrigger></TabsList>
    <TabsContent value="itens" className="space-y-3"><div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"><Warehouse className="h-4 w-4 text-muted-foreground"/><span className="text-sm font-medium">Visualizar:</span><Select value={estoqueSelecionado} onValueChange={setEstoqueSelecionado}><SelectTrigger className="w-64"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="__all__">Todos os estoques</SelectItem>{locais.data.map(local=><SelectItem key={local.id} value={local.id}>{local.nome}</SelectItem>)}</SelectContent></Select><Button variant="ghost" size="sm" onClick={()=>setEstoqueSelecionado('__all__')}>Ver todos os itens</Button></div>
      <DataTable data={rows} columns={columns} searchKeys={['produto','codigo','estoque']} rowClass={row=>Number(row.disponivel)===0?'bg-red-500/5':Number(row.disponivel)<=Number(row.minimo)?'bg-amber-500/5':''} extraFilter={<Button size="sm" variant={somenteAbaixo?'default':'outline'} onClick={()=>setSomenteAbaixo(v=>!v)} className={somenteAbaixo?'company-primary-bg text-primary-foreground':''}>Somente abaixo do mínimo</Button>}/></TabsContent>
    <TabsContent value="locais"><DataTable data={locais.data} columns={localColumns} searchKeys={['nome','descricao','status']}/></TabsContent></Tabs>
  <Dialog open={transferOpen} onOpenChange={setTransferOpen}><DialogContent><DialogHeader><DialogTitle>Transferir item entre estoques</DialogTitle><DialogDescription>A movimentação atualiza origem e destino e fica registrada no Kardex.</DialogDescription></DialogHeader><div className="space-y-4">
    <div className="space-y-1.5"><Label>Estoque de origem</Label><Select value={transfer.origemId} onValueChange={value=>setTransfer({origemId:value,destinoId:'',produtoId:'',quantidade:1})}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{locais.data.filter(l=>l.status==='ativo').map(local=><SelectItem key={local.id} value={local.id}>{local.nome}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1.5"><Label>Produto</Label><Select value={transfer.produtoId} onValueChange={value=>setTransfer(prev=>({...prev,produtoId:value}))} disabled={!transfer.origemId}><SelectTrigger><SelectValue placeholder="Selecione um item com saldo"/></SelectTrigger><SelectContent>{produtosOrigem.map(row=><SelectItem key={row.produtoId} value={String(row.produtoId)}>{row.codigo} · {row.produto} (disponível: {row.disponivel})</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1.5"><Label>Estoque de destino</Label><Select value={transfer.destinoId} onValueChange={value=>setTransfer(prev=>({...prev,destinoId:value}))} disabled={!transfer.origemId}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{locais.data.filter(local=>local.status==='ativo'&&local.id!==transfer.origemId).map(local=><SelectItem key={local.id} value={local.id}>{local.nome}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1.5"><Label>Quantidade</Label><Input type="number" min="0.001" step="0.001" value={transfer.quantidade} onChange={event=>setTransfer(prev=>({...prev,quantidade:event.target.value}))}/></div></div>
    <DialogFooter><Button variant="outline" onClick={()=>setTransferOpen(false)}>Cancelar</Button><Button onClick={submitTransfer} disabled={transferring||!transfer.origemId||!transfer.destinoId||!transfer.produtoId}>{transferring?'Transferindo…':'Confirmar transferência'}</Button></DialogFooter></DialogContent></Dialog></div>
}
