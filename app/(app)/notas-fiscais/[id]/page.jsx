'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import StatusBadge from '@/components/common/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { formatBRL } from '@/lib/mock-data'
import { ArrowLeft, FileText, PackagePlus, Save, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { formatQuantity } from '@/lib/number-format'

const emptyItem = { productId: '', quantidade: 1, valorUnitario: 0 }

export default function NotaFiscalDetalhePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const notas = useEntity('notas', user?.empresaId)
  const produtos = useEntity('produtos', user?.empresaId)
  const materiasPrimas = produtos.data.filter(p => p.tipo === 'materia_prima')
  const { data: fornecedores } = useEntity('fornecedores', user?.empresaId)
  const { data: estoques } = useEntity('locais_estoque', user?.empresaId)
  const nota = notas.get(id)
  const [form, setForm] = useState(null)
  const [item, setItem] = useState(emptyItem)

  useEffect(() => { if (nota) setForm({ ...nota, produtos: Array.isArray(nota.produtos) ? nota.produtos : [] }) }, [nota?.id])
  if (!notas.loaded) return <div className="text-sm text-muted-foreground">Carregando nota fiscal…</div>
  if (!nota) return <div className="space-y-3"><p>Nota fiscal não encontrada nesta empresa.</p><Button onClick={() => router.push('/notas-fiscais')}>Voltar</Button></div>
  if (!form) return <div className="text-sm text-muted-foreground">Preparando dados da nota…</div>

  const bloqueada = form.status === 'entregue' || form.status === 'recebida' || !!form.entradaProcessada
  const upd = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const recalcular = (lista) => ({ produtos: lista, itens: lista.length, valorTotal: lista.reduce((s, x) => s + Number(x.quantidade) * Number(x.valorUnitario), 0) })

  const salvarDados = async () => {
    if (!form.numero || !form.fornecedor || !form.estoqueDestino) return toast.error('Preencha os campos obrigatórios.')
    try {
      await notas.update(id, form)
      toast.success('Nota fiscal atualizada.')
      router.replace('/notas-fiscais')
      router.refresh()
    } catch (error) { toast.error(error.message) }
  }

  const adicionarItem = () => {
    const quantidade = Number(item.quantidade)
    const valorUnitario = Number(item.valorUnitario)
    const produtoExistente = materiasPrimas.find(p => p.id === item.productId)
    if (!produtoExistente) return toast.error('Selecione uma matéria-prima cadastrada.')
    if (quantidade <= 0 || valorUnitario < 0) return toast.error('Quantidade e valor inválidos.')
    if (form.produtos.some(p => p.productId === item.productId)) return toast.error('Este produto já está na nota. Remova-o para alterar a quantidade.')
    const novo = { productId: produtoExistente.id, produtoId: produtoExistente.id, nome: produtoExistente.nome, codigo: produtoExistente.codigo, unidade: produtoExistente.unidade, quantidade, valorUnitario, valor: valorUnitario, tipoValor: 'unitario', corId: produtoExistente.corId || '', tamanhoId: produtoExistente.tamanhoId || '', modeloId: '', novoProduto: false }
    const totais = recalcular([...form.produtos, novo])
    setForm(prev => ({ ...prev, ...totais }))
    setItem(emptyItem)
  }

  const removerItem = (index) => setForm(prev => ({ ...prev, ...recalcular(prev.produtos.filter((_, i) => i !== index)) }))

  const entregar = async () => {
    if (!form.produtos.length) return toast.error('Adicione ao menos um produto antes de entregar a nota.')
    if (form.entradaProcessada) return toast.error('O estoque desta nota já foi processado.')
    try {
      const response = await fetch(`/api/notas-fiscais/${id}/receber`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresaId: user.empresaId, usuarioId: user.id }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      await Promise.all([notas.reload(), produtos.reload()])
      toast.success('Nota recebida. Estoque e kardex atualizados.')
      router.replace('/notas-fiscais')
      router.refresh()
    } catch (error) { toast.error(error.message) }
  }

  return <div className="space-y-4">
    <PageHeader title={`NF ${form.numero}`} description="Consulte, edite e receba os produtos desta nota fiscal." icon={FileText}>
      <Button variant="ghost" className="gap-2" onClick={() => router.replace('/notas-fiscais')}><ArrowLeft className="h-4 w-4" />Voltar</Button>
      <StatusBadge status={form.status} />
      <Button variant="outline" className="gap-2" onClick={salvarDados} disabled={bloqueada}><Save className="h-4 w-4" />Salvar alterações</Button>
      <Button className="gap-2 company-primary-bg text-primary-foreground" onClick={entregar} disabled={bloqueada}><Truck className="h-4 w-4" />Marcar como entregue</Button>
    </PageHeader>

    <Card className="bg-card border-border"><CardHeader><CardTitle className="text-base">Dados da nota</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Field label="Número"><Input disabled={bloqueada} value={form.numero} onChange={e => upd('numero', e.target.value)} /></Field>
      <Field label="Série"><Input disabled={bloqueada} value={form.serie || ''} onChange={e => upd('serie', e.target.value)} /></Field>
      <Field label="Data de emissão"><Input disabled={bloqueada} type="date" value={form.dataEmissao || ''} onChange={e => upd('dataEmissao', e.target.value)} /></Field>
      <Field label="Fornecedor"><Select disabled={bloqueada} value={form.fornecedor || ''} onValueChange={v => upd('fornecedor', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fornecedores.map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Estoque de destino"><Select disabled={bloqueada} value={form.estoqueDestino || ''} onValueChange={v => upd('estoqueDestino', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{estoques.map(s => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Pedido"><Input disabled={bloqueada} value={form.pedido || ''} onChange={e => upd('pedido', e.target.value)} /></Field>
      <div className="md:col-span-3"><Field label="Chave de acesso"><Input disabled={bloqueada} value={form.chave || ''} onChange={e => upd('chave', e.target.value)} /></Field></div>
    </CardContent></Card>

    {!bloqueada && <Card className="bg-card border-border"><CardHeader><CardTitle className="text-base flex items-center gap-2"><PackagePlus className="h-4 w-4" />Adicionar produto comprado</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2"><Field label="Matéria-prima"><Select value={item.productId} onValueChange={v => setItem(p => ({ ...p, productId: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{materiasPrimas.map(p => <SelectItem key={p.id} value={p.id}>{p.codigo} · {p.nome} ({p.unidade})</SelectItem>)}</SelectContent></Select></Field></div>
        <Field label="Quantidade"><Input type="number" min="0.01" step="0.01" value={item.quantidade} onChange={e => setItem(p => ({ ...p, quantidade: e.target.value }))} /></Field>
        <Field label="Valor unitário"><CurrencyInput value={item.valorUnitario} onChange={e => setItem(p => ({ ...p, valorUnitario: e.target.value }))} /></Field>
      </div>
      <Button type="button" variant="outline" onClick={adicionarItem}>Adicionar à nota</Button>
    </CardContent></Card>}

    <Card className="bg-card border-border"><CardHeader><CardTitle className="text-base">Produtos da nota ({form.produtos.length})</CardTitle></CardHeader><CardContent>
      <Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Produto</TableHead><TableHead>Origem</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead className="text-right">Valor unit.</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead /></TableRow></TableHeader><TableBody>
        {!form.produtos.length && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto adicionado.</TableCell></TableRow>}
        {form.produtos.map((p, i) => <TableRow key={`${p.productId || p.codigo}-${i}`}><TableCell className="font-mono text-xs">{p.codigo}</TableCell><TableCell>{p.nome}</TableCell><TableCell className="text-xs">{p.novoProduto ? 'Novo cadastro' : 'Cadastrado'}</TableCell><TableCell className="text-right">{formatQuantity(p.quantidade)} {p.unidade}</TableCell><TableCell className="text-right">{formatBRL(Number(p.valorUnitario))}</TableCell><TableCell className="text-right font-medium">{formatBRL(Number(p.quantidade) * Number(p.valorUnitario))}</TableCell><TableCell className="text-right">{!bloqueada && <Button variant="ghost" size="icon" className="text-red-400" onClick={() => removerItem(i)}><Trash2 className="h-4 w-4" /></Button>}</TableCell></TableRow>)}
      </TableBody></Table>
      <div className="flex justify-end pt-4 text-lg font-semibold">Total: {formatBRL(form.valorTotal || 0)}</div>
    </CardContent></Card>
  </div>
}

function Field({ label, children }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
