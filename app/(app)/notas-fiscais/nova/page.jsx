'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { FilePlus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import QuickCreateDialog from '@/components/common/quick-create-dialog'

const emptyItem = { produtoId: '', corId: '', tamanhoId: '', modeloId: '', quantidade: '1', tipoValor: 'unitario', valor: '' }
const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function NovaNotaFiscalPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { create } = useEntity('notas', user?.empresaId)
  const { data: fornecedores } = useEntity('fornecedores', user?.empresaId)
  const { data: estoques } = useEntity('locais_estoque', user?.empresaId)
  const { data: pedidos } = useEntity('pedidos', user?.empresaId)
  const produtosStore = useEntity('produtos', user?.empresaId)
  const { data: todosProdutos } = produtosStore
  const { data: cores } = useEntity('cores', user?.empresaId)
  const { data: tamanhos } = useEntity('tamanhos', user?.empresaId)
  const produtos = todosProdutos.filter(p => p.tipo === 'materia_prima')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ numero: '', numeroAutomatico: true, serie: '1', fornecedorId: '', estoqueDestinoId: '', chave: '', dataEmissao: new Date().toISOString().slice(0, 10), pedidoId: 'nenhum', status: 'pendente' })
  const [item, setItem] = useState(emptyItem)
  const [itens, setItens] = useState([])
  const upd = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const updItem = (key, value) => setItem(prev => ({ ...prev, [key]: value }))
  const produto = produtos.find(p => String(p.id) === String(item.produtoId))
  const fornecedor = fornecedores.find(f => String(f.id) === String(form.fornecedorId))
  const estoque = estoques.find(e => String(e.id) === String(form.estoqueDestinoId))
  const pedidosDisponiveis = useMemo(() => pedidos.filter(p => !fornecedor || p.fornecedor === fornecedor.nome), [pedidos, fornecedor])
  const totalNota = itens.reduce((total, atual) => total + atual.valorTotal, 0)

  const selecionarProduto = id => {
    const escolhido = produtos.find(p => String(p.id) === String(id))
    setItem({ ...emptyItem, produtoId: id, corId: escolhido?.corId ? String(escolhido.corId) : '', tamanhoId: escolhido?.tamanhoId ? String(escolhido.tamanhoId) : '', modeloId: escolhido?.modeloId ? String(escolhido.modeloId) : '' })
  }

  const selecionarPedido = id => {
    upd('pedidoId', id)
    if (id === 'nenhum') return setItens([])
    const pedido = pedidos.find(p => String(p.id) === String(id))
    const importados = (pedido?.produtos || []).map(linha => {
      const produtoPedido = produtos.find(p => String(p.id) === String(linha.produtoId))
      if (!produtoPedido) return null
      const quantidade = Number(linha.quantidade || 0); const valor = Number(linha.valorUnitario || 0)
      return { produtoId: produtoPedido.id, corId: produtoPedido.corId ? String(produtoPedido.corId) : '', tamanhoId: produtoPedido.tamanhoId ? String(produtoPedido.tamanhoId) : '', modeloId: '', quantidade, tipoValor: 'unitario', valor, valorTotal: quantidade * valor, produto: produtoPedido }
    }).filter(Boolean)
    setItens(importados)
    setItem(importados[0] ? { ...emptyItem, produtoId: importados[0].produtoId, quantidade: String(importados[0].quantidade), valor: String(importados[0].valor) } : emptyItem)
    if (importados.length) toast.success(`${importados.length} produto(s) carregado(s) do pedido de compra.`)
  }

  const adicionarItem = () => {
    if (!produto) return toast.error('Selecione um produto cadastrado.')
    if (produto.tipo === 'produto_acabado' && (!produto.corId || !produto.tamanhoId || !produto.modeloId)) return toast.error('Cadastre cor, tamanho e modelo neste produto acabado antes de adicioná-lo.')
    const quantidade = Number(item.quantidade)
    const valor = Number(item.valor)
    if (!(quantidade > 0) || !(valor >= 0) || item.valor === '') return toast.error('Informe uma quantidade e um valor válidos.')
    setItens(prev => [...prev, { ...item, produto, quantidade, valor, valorTotal: item.tipoValor === 'total' ? valor : quantidade * valor }])
    setItem(emptyItem)
  }

  const salvar = async e => {
    e.preventDefault()
    if ((!form.numeroAutomatico && !form.numero) || !form.fornecedorId || !form.estoqueDestinoId || !form.dataEmissao || !form.chave.trim()) return toast.error('Preencha todos os dados obrigatórios da nota fiscal.')
    if (!itens.length) return toast.error('Adicione pelo menos um produto à nota fiscal.')
    setSaving(true)
    try {
      const nota = await create({ ...form, fornecedor: fornecedor?.nome, estoqueDestino: estoque?.nome, itensNota: itens.map(({ produto: _produto, valorTotal: _total, ...registro }) => registro) })
      toast.success('Nota fiscal e seus produtos foram cadastrados.')
      router.push('/notas-fiscais')
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }

  return <div className="space-y-6">
    <PageHeader title="Nova nota fiscal" description="Cadastre a nota e todos os produtos recebidos em uma única operação." icon={FilePlus} />
    <form onSubmit={salvar} className="space-y-6">
      <Card className="bg-card border-border"><CardHeader><CardTitle className="text-base">Dados da nota fiscal</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Field label="Número da nota"><div className="space-y-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.numeroAutomatico} onChange={e => { upd('numeroAutomatico', e.target.checked); if(e.target.checked) upd('numero','') }} />Gerar automaticamente</label>{!form.numeroAutomatico && <Input value={form.numero} onChange={e => upd('numero', e.target.value)} placeholder="00012349" />}</div></Field>
        <Field label="Fornecedor *"><Select value={form.fornecedorId} onValueChange={v => { upd('fornecedorId', v); upd('pedidoId', 'nenhum') }}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{fornecedores.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Série *"><Input value={form.serie} onChange={e => upd('serie', e.target.value)} /></Field>
        <Field label="Estoque de destino *"><Select value={form.estoqueDestinoId} onValueChange={v => upd('estoqueDestinoId', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{estoques.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Data de emissão *"><Input type="date" value={form.dataEmissao} onChange={e => upd('dataEmissao', e.target.value)} /></Field>
        <Field label="Pedido de compra"><Select value={form.pedidoId} onValueChange={selecionarPedido}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhum">Nenhum</SelectItem>{pedidosDisponiveis.filter(p=>p.status!=='recebido').map(p => <SelectItem key={p.id} value={String(p.id)}>{p.numero} — {p.fornecedor}</SelectItem>)}</SelectContent></Select></Field>
        <div className="md:col-span-2"><Field label="Chave de acesso *"><Input value={form.chave} onChange={e => upd('chave', e.target.value)} maxLength={44} placeholder="Chave de acesso da nota" /></Field></div>
      </CardContent></Card>

      <Card className="bg-card border-border"><CardHeader><CardTitle className="text-base">Produtos da nota fiscal</CardTitle></CardHeader><CardContent className="space-y-5">
        <div className="flex justify-end"><QuickCreateDialog label="Cadastrar novo produto" defaults={{ tipo:'materia_prima', unidade:'unidade', unidadeMinimo:'unidade', minimo:0, status:'ativo', codigoAutomatico:true }} fields={[
          { name:'nome', label:'Nome', required:true }, { name:'codigo', label:'Código interno', type:'uniqueCode', required:true },
          { name:'descricao', label:'Descrição', type:'textarea' }, { name:'unidade', label:'Unidade', type:'select', options:[{value:'unidade',label:'Unidade'},{value:'metro',label:'Metro'},{value:'kg',label:'Quilograma'}] },
          { name:'corIds', label:'Cores (opcional)', type:'multiselect', options:cores.map(c=>({value:c.id,label:c.nome})) },
          { name:'tamanhoIds', label:'Tamanhos (opcional)', type:'multiselect', options:tamanhos.map(t=>({value:t.id,label:t.nome})) }
        ]} onCreate={async values => { const novo = await produtosStore.create(values); const registro = {...novo, tipo:'materia_prima'}; setItens(prev => [...prev, { produtoId:novo.id, corId:'', tamanhoId:'', quantidade:1, tipoValor:'unitario', valor:0, valorTotal:0, produto:registro }]) }} /></div>
        <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
          <div className={produto ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3 items-end' : 'max-w-xl'}>
            <div className={produto ? 'xl:col-span-2' : ''}><Field label="Nome do produto"><Select value={item.produtoId} onValueChange={selecionarProduto}><SelectTrigger><SelectValue placeholder="Selecione um produto cadastrado" /></SelectTrigger><SelectContent>{produtos.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome} ({p.codigo})</SelectItem>)}</SelectContent></Select></Field></div>
            {produto && <>
              <Attribute label="Cor" value={item.corId} name={produto.cor} empty="Sem cor cadastrada" />
              {produto.tipo === 'produto_acabado' && <Attribute label="Tamanho" value={item.tamanhoId} name={produto.tamanho} empty="Sem tamanho cadastrado" />}
              {produto.tipo === 'produto_acabado' && <Attribute label="Modelo" value={item.modeloId} name={produto.modelo} empty="Sem modelo cadastrado" />}
              <Field label="Quantidade"><Input type="number" min="0.001" step="0.001" value={item.quantidade} onChange={e => updItem('quantidade', e.target.value)} /></Field>
              <Field label="Tipo de valor"><Select value={item.tipoValor} onValueChange={v => updItem('tipoValor', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unitario">Valor unitário</SelectItem><SelectItem value="metro">Valor por metro</SelectItem><SelectItem value="total">Valor total</SelectItem></SelectContent></Select></Field>
              <Field label={item.tipoValor === 'total' ? 'Valor total' : item.tipoValor === 'metro' ? 'Valor por metro' : 'Valor unitário'}><CurrencyInput value={item.valor} onChange={e => updItem('valor', e.target.value)} placeholder="0,00" /></Field>
            </>}
          </div>
          {produto && <div className="flex justify-end"><Button type="button" variant="secondary" onClick={adicionarItem} className="gap-2"><Plus className="h-4 w-4" />Adicionar produto</Button></div>}
        </div>

        {itens.length > 0 && <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm"><thead className="bg-secondary/60 text-muted-foreground"><tr>{['Produto','Cor','Tamanho','Modelo','Qtd.','Critério','Valor informado','Total',''].map(t => <th key={t} className="px-3 py-2 text-left font-medium whitespace-nowrap">{t}</th>)}</tr></thead><tbody>{itens.map((registro, index) => <tr key={`${registro.produtoId}-${index}`} className="border-t border-border"><td className="px-3 py-3 font-medium">{registro.produto.nome}</td><td className="px-3 py-3">{registro.produto.cor || '—'}</td><td className="px-3 py-3">{registro.produto.tamanho || '—'}</td><td className="px-3 py-3">{registro.produto.modelo || '—'}</td><td className="px-3 py-3">{registro.quantidade}</td><td className="px-3 py-3">{{ unitario: 'Unitário', metro: 'Por metro', total: 'Total' }[registro.tipoValor]}</td><td className="px-3 py-3">{money(registro.valor)}</td><td className="px-3 py-3 font-medium">{money(registro.valorTotal)}</td><td className="px-3 py-3"><Button type="button" variant="ghost" size="icon" onClick={() => setItens(prev => prev.filter((_, i) => i !== index))} className="text-red-400"><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody><tfoot><tr className="border-t border-border bg-secondary/30"><td colSpan={7} className="px-3 py-3 text-right font-medium">Total da nota</td><td className="px-3 py-3 font-semibold">{money(totalNota)}</td><td /></tr></tfoot></table></div>}
      </CardContent></Card>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.push('/notas-fiscais')}>Cancelar</Button><Button type="submit" disabled={saving} className="company-primary-bg text-primary-foreground">{saving ? 'Salvando…' : 'Salvar nota fiscal'}</Button></div>
    </form>
  </div>
}

function Field({ label, children }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
function Attribute({ label, value, name, empty }) { return <Field label={label}><Select value={value || 'ausente'} disabled><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={value || 'ausente'}>{name || empty}</SelectItem></SelectContent></Select></Field> }
