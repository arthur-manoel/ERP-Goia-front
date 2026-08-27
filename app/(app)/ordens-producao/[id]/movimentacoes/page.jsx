'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import StatusBadge from '@/components/common/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { formatQuantity } from '@/lib/number-format'
import { ArrowLeft, ArrowRight, CheckCircle2, Route, Truck } from 'lucide-react'
import { toast } from 'sonner'

export default function MovimentosPage() {
  const { id } = useParams(); const router = useRouter(); const { user } = useAuth()
  const [op, setOp] = useState(null); const [setorSelecionado, setSetorSelecionado] = useState(''); const [quantidades, setQuantidades] = useState({}); const [saving, setSaving] = useState(false)
  const load = () => fetch(`/api/production-orders/${id}?empresaId=${user.empresaId}`).then(r => r.json()).then(setOp)
  useEffect(() => { if (user?.empresaId) load() }, [id, user?.empresaId])

  const saldos = useMemo(() => {
    if (!op?.fluxo?.length) return new Map()
    const result = new Map(op.fluxo.map(setor => [String(setor.setorId), new Map(op.items.map(item => [String(item.id), 0]))]))
    const inicial = result.get(String(op.fluxo[0].setorId))
    op.items.forEach(item => inicial.set(String(item.id), Number(item.quantidade)))
    for (const movimento of [...op.movimentacoes].reverse()) {
      if (!movimento.setorOrigem) continue
      const origem = op.fluxo.find(setor => setor.setor === movimento.setorOrigem)
      const destino = op.fluxo.find(setor => setor.setor === movimento.setorDestino)
      for (const item of movimento.itens || []) {
        const origemItens = result.get(String(origem?.setorId)); const destinoItens = result.get(String(destino?.setorId)); const itemId = String(item.itemId)
        origemItens?.set(itemId, (origemItens.get(itemId) || 0) - Number(item.quantidade))
        if (movimento.status === 'entregue') destinoItens?.set(itemId, (destinoItens.get(itemId) || 0) + Number(item.quantidade))
      }
    }
    return result
  }, [op])

  if (!op) return null
  const setorAtivo = setorSelecionado || String(op.fluxo[0]?.setorId || '')
  const atual = saldos.get(setorAtivo) || new Map()
  const indiceAtual = op.fluxo.findIndex(setor => String(setor.setorId) === setorAtivo)
  const proximo = op.fluxo[indiceAtual + 1]
  const setor = op.fluxo[indiceAtual]
  const pendentes = op.movimentacoes.filter(movimento => movimento.status === 'em_transito')
  const pendenteDoSetor = pendentes.find(movimento => movimento.setorOrigem === setor?.setor)

  const enviar = async (enviarTodos = false) => {
    setSaving(true)
    try {
      const itens = op.items.map(item => ({ itemId: item.id, quantidade: Number(quantidades[item.id] || 0) }))
      const response = await fetch(`/api/production-orders/${id}/transfer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresaId: user.empresaId, usuarioId: user.id, setorOrigemId: setorAtivo, itens, enviarTodos }) })
      const body = await response.json(); if (!response.ok) throw new Error(body.error)
      toast.success(body.message); setQuantidades({}); await load()
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }
  const receber = async (movimentoId) => {
    setSaving(true)
    try { const response = await fetch(`/api/production-orders/${id}/transfer`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresaId: user.empresaId, usuarioId: user.id, movimentoId }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); toast.success(body.message); await load() }
    catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }

  return <div className="space-y-5">
    <PageHeader title={`OP ${op.numero} — fluxo dos produtos`} description="Clique em um setor para movimentar as peças disponíveis nele" icon={Route}><Button variant="outline" onClick={() => router.push(`/ordens-producao/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" />Voltar para a OP</Button></PageHeader>
    <div className="grid gap-3 lg:grid-cols-3">{op.fluxo.map((itemSetor, index) => <Card key={itemSetor.id} role="button" tabIndex={0} onClick={() => { setSetorSelecionado(String(itemSetor.setorId)); setQuantidades({}) }} onKeyDown={event => { if (event.key === 'Enter') setSetorSelecionado(String(itemSetor.setorId)) }} className={`cursor-pointer transition-colors hover:border-primary ${String(itemSetor.setorId) === setorAtivo ? 'border-primary ring-1 ring-primary' : ''}`}><CardHeader><CardTitle className="text-base">{index + 1}. {itemSetor.setor}</CardTitle></CardHeader><CardContent className="space-y-2">{op.items.map(item => <div key={item.id} className="flex justify-between rounded border p-2 text-sm"><span>{item.cor || 'Sem cor'} · {item.tamanho || 'Sem tamanho'}</span><strong>{formatQuantity(saldos.get(String(itemSetor.setorId))?.get(String(item.id)) || 0)}</strong></div>)}</CardContent></Card>)}</div>

    {pendentes.map(pendente => <Card key={pendente.id} className="border-amber-500/40"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4" />Lote a caminho: {pendente.setorOrigem} <ArrowRight className="h-4 w-4" /> {pendente.setorDestino}</CardTitle></CardHeader><CardContent className="space-y-3">{pendente.itens?.map(item => <div key={item.id} className="flex justify-between rounded border p-2"><span>{item.cor || 'Sem cor'} · {item.tamanho || 'Sem tamanho'}</span><strong>{formatQuantity(item.quantidade)} peças</strong></div>)}<Button onClick={() => receber(pendente.id)} disabled={saving}><CheckCircle2 className="mr-2 h-4 w-4" />Confirmar chegada no setor</Button></CardContent></Card>)}

    {proximo && <Card><CardHeader><CardTitle className="text-base">Setor selecionado: {setor?.setor}</CardTitle><p className="text-sm text-muted-foreground">Envio para o próximo setor: {proximo.setor}</p></CardHeader><CardContent className="space-y-3">{pendenteDoSetor&&<p className="rounded border border-amber-500/30 p-3 text-sm text-amber-500">Este setor já possui um lote a caminho. Confirme a chegada antes de fazer outro envio por ele.</p>}{op.items.map(item => { const disponivel = atual.get(String(item.id)) || 0; return <div key={item.id} className="grid grid-cols-[1fr_130px] items-center gap-3 rounded border p-3"><div>{item.cor || 'Sem cor'} · {item.tamanho || 'Sem tamanho'}<p className="text-xs text-muted-foreground">Disponível neste setor: {formatQuantity(disponivel)}</p></div><Input type="number" min="0" max={disponivel} step="1" value={quantidades[item.id] || ''} onChange={event => setQuantidades(current => ({ ...current, [item.id]: event.target.value }))} disabled={disponivel <= 0 || Boolean(pendenteDoSetor)} /></div> })}<div className="flex flex-wrap gap-2"><Button onClick={() => enviar(false)} disabled={saving||Boolean(pendenteDoSetor)}>Enviar quantidades informadas</Button><Button variant="secondary" onClick={() => enviar(true)} disabled={saving||Boolean(pendenteDoSetor)}>Enviar tudo deste setor</Button></div></CardContent></Card>}
    {!proximo && <Card><CardContent className="p-5 text-emerald-500">Este é o último setor. As peças disponíveis aqui podem ser registradas como produção concluída e entrar no estoque.</CardContent></Card>}

    <Card><CardHeader><CardTitle className="text-base">Histórico de lotes</CardTitle></CardHeader><CardContent className="space-y-3">{op.movimentacoes.filter(item => item.setorOrigem).map(movimento => <div key={movimento.id} className="rounded border p-3"><div className="flex justify-between gap-3"><strong>{movimento.setorOrigem} → {movimento.setorDestino}</strong><StatusBadge status={movimento.status} /></div><div className="mt-2 flex flex-wrap gap-2">{movimento.itens?.map(item => <span key={item.id} className="rounded bg-secondary px-2 py-1 text-xs">{item.cor || 'Sem cor'}/{item.tamanho || 'Sem tamanho'}: {formatQuantity(item.quantidade)}</span>)}</div></div>)}</CardContent></Card>
    <Button variant="outline" onClick={() => router.push(`/ordens-producao/${id}`)}>Voltar para a OP</Button>
  </div>
}
