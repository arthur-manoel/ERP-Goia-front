'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import QuickCreateDialog from '@/components/common/quick-create-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { formatBRL } from '@/lib/mock-data'
import { Package, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProdutosPage() {
  const router = useRouter()
  const searchParams=useSearchParams()
  const { user } = useAuth()
  const { data, create, update, remove } = useEntity('produtos', user?.empresaId)
  const { data: categorias } = useEntity('categorias', user?.empresaId)
  const { data: cores } = useEntity('cores', user?.empresaId)
  const { data: tamanhos } = useEntity('tamanhos', user?.empresaId)
  const [tipoVisivel, setTipoVisivel] = useState('todos')
  const [editing, setEditing] = useState(null)
  const closeEditing=()=>{setEditing(null);if(searchParams.get('editar'))router.replace('/produtos')}
  const materiasPrimas = data.filter(p => p.tipo === 'materia_prima')
  const produtosVisiveis = tipoVisivel === 'todos' ? data : data.filter(p => p.tipo === tipoVisivel)
  useEffect(()=>{const editId=searchParams.get('editar');if(editId&&data.length){const item=data.find(x=>String(x.id)===String(editId));if(item)setEditing(item)}},[searchParams,data])

  const columns = [
    { key: 'nome', label: 'Nome', render: r => <span className="font-medium">{r.nome}</span> },
    { key: 'tipo', label: 'Tipo', render: r => r.tipo === 'materia_prima' ? 'Matéria-prima' : 'Produto acabado' },
    { key: 'minimo', label: 'Qtd. mínima', render: r => `${Number(r.minimo || 0)} ${r.unidadeMinimo === 'metro' ? 'm' : 'un.'}` },
    { key: 'valorUnitario', label: 'Valor unitário', render: r => formatBRL(r.valorUnitario ?? 0) },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'actions', label: '', filterable: false, cellClass: 'text-right', render: r => <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" title="Editar produto" onClick={event => { event.stopPropagation(); setEditing(r) }}><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" title="Excluir produto" className="text-red-400" onClick={async event => { event.stopPropagation(); if (!confirm(`Excluir ${r.nome}?`)) return; try { await remove(r.id); toast.success('Produto removido com segurança.') } catch (error) { toast.error(error.message) } }}><Trash2 className="h-4 w-4" /></Button>
    </div> },
  ]

  return <div>
    <PageHeader title="Produtos" description="Clique em um produto para visualizar todos os seus dados." icon={Package}>
      <QuickCreateDialog label="Novo produto" defaults={{ tipo: '', unidade: 'metro', unidadeMinimo: 'unidade', status: 'ativo', minimo: 0, codigoAutomatico: true }} fields={[
        { name: 'nome', label: 'Nome', required: true, placeholder: 'Ex: Malha PV 67/33 Branca' },
        { name: 'codigo', label: 'Código interno', type: 'uniqueCode', required: true, placeholder: 'MP-TEC-010' },
        { name: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Descrição técnica...' },
        { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'materia_prima', label: 'Matéria-prima' }, { value: 'produto_acabado', label: 'Produto acabado' }] },
        { name: 'insumos', label: 'Matérias-primas por unidade', type: 'recipe', options: materiasPrimas.map(item => ({ value: item.id, label: `${item.codigo} · ${item.nome}` })), required: true, showWhen: f => f.tipo === 'produto_acabado', hint: 'Informe primeiro quais insumos são consumidos para fabricar uma unidade.' },
        { name: 'unidade', label: 'Unidade de medida', type: 'select', options: [{ value: 'metro', label: 'Metro' }, { value: 'unidade', label: 'Unidade' }, { value: 'kg', label: 'Quilograma' }, { value: 'outros', label: 'Outros' }], showWhen: f => Boolean(f.tipo) },
        { name: 'categoriaId', label: 'Categoria', type: 'select', options: categorias.map(item => ({ value: item.id, label: item.nome })), required: true, showWhen: f => f.tipo === 'produto_acabado' },
        { name: 'corIds', label: 'Cores (opcional)', type: 'multiselect', options: cores.filter(item=>item.status==='ativo').map(item => ({ value: item.id, label: item.nome })), showWhen: f => Boolean(f.tipo) },
        { name: 'tamanhoIds', label: 'Tamanhos (opcional)', type: 'multiselect', options: tamanhos.map(item => ({ value: item.id, label: item.nome })), showWhen: f => Boolean(f.tipo) },
        { name: 'unidadeMinimo', label: 'Unidade da quantidade mínima', type: 'select', required: true, options: [{ value: 'unidade', label: 'Quantidade unitária' }, { value: 'metro', label: 'Quantidade por metro' }], showWhen: f => Boolean(f.tipo) },
        { name: 'minimo', label: 'Quantidade mínima em estoque', type: 'number', required: true, placeholder: '0', showWhen: f => Boolean(f.tipo) },
        { name: 'status', label: 'Ativo', type: 'switch', showWhen: f => Boolean(f.tipo) },
      ]} onCreate={v => create({ ...v, categoriaId: v.tipo === 'produto_acabado' ? v.categoriaId : null, status: v.status === false ? 'inativo' : 'ativo' })} />
    </PageHeader>
    <div className="mb-4 max-w-xs"><Label className="mb-1.5 block">Exibir produtos por tipo</Label><Select value={tipoVisivel} onValueChange={setTipoVisivel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="materia_prima">Matérias-primas</SelectItem><SelectItem value="produto_acabado">Produtos acabados</SelectItem></SelectContent></Select></div>
    <DataTable data={produtosVisiveis} columns={columns} searchKeys={['nome']} onRowClick={produto => router.push(`/produtos/${produto.id}`)} />
    <EditProductDialog product={editing} categorias={categorias} cores={cores} tamanhos={tamanhos} onClose={closeEditing} onSave={async values => { await update(editing.id, values); closeEditing(); toast.success('Produto atualizado.') }} />
  </div>
}

function EditProductDialog({ product, categorias, cores, tamanhos, onClose, onSave }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!product) return
    setForm({ ...product,
      corIds: Array.from(new Set((product.variacoes || []).map(v => v.corId).filter(Boolean))),
      tamanhoIds: Array.from(new Set((product.variacoes || []).map(v => v.tamanhoId).filter(Boolean))),
      categoriaId: product.categoriaId ? String(product.categoriaId) : '',
      unidadeMinimo: product.unidadeMinimo || 'unidade',
    })
  }, [product])
  if (!form) return null
  const upd = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const toggle = (key, id) => upd(key, form[key].includes(id) ? form[key].filter(value => value !== id) : [...form[key], id])
  const acabado = form.tipo === 'produto_acabado'
  const submit = async event => { event.preventDefault(); setSaving(true); try { await onSave({ ...form, categoriaId: acabado ? form.categoriaId : null }) } catch (error) { toast.error(error.message) } finally { setSaving(false) } }

  return <Dialog open={Boolean(product)} onOpenChange={open => { if (!open) onClose() }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Editar produto</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2">
      <Field label="Nome"><Input value={form.nome || ''} onChange={event => upd('nome', event.target.value)} required /></Field>
      <Field label="Código"><Input value={form.codigo || ''} onChange={event => upd('codigo', event.target.value)} required /></Field>
      <div className="md:col-span-2"><Field label="Descrição"><Textarea value={form.descricao || ''} onChange={event => upd('descricao', event.target.value)} /></Field></div>
      <Field label="Tipo"><Select value={form.tipo} onValueChange={value => upd('tipo', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="materia_prima">Matéria-prima</SelectItem><SelectItem value="produto_acabado">Produto acabado</SelectItem></SelectContent></Select></Field>
      <Field label="Unidade"><Select value={form.unidade || 'unidade'} onValueChange={value => upd('unidade', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="metro">Metro</SelectItem><SelectItem value="unidade">Unidade</SelectItem><SelectItem value="kg">Quilograma</SelectItem><SelectItem value="outros">Outros</SelectItem></SelectContent></Select></Field>
      {acabado && <Field label="Categoria"><Select value={form.categoriaId} onValueChange={value => upd('categoriaId', value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categorias.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.nome}</SelectItem>)}</SelectContent></Select></Field>}
      <Multi label="Cores (opcional)" options={cores.filter(item => item.status === 'ativo' || form.corIds.map(String).includes(String(item.id)))} values={form.corIds} toggle={id => toggle('corIds', id)} />
      <Multi label="Tamanhos (opcional)" options={tamanhos} values={form.tamanhoIds} toggle={id => toggle('tamanhoIds', id)} />
      <Field label="Unidade do mínimo"><Select value={form.unidadeMinimo} onValueChange={value => upd('unidadeMinimo', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unidade">Quantidade unitária</SelectItem><SelectItem value="metro">Quantidade por metro</SelectItem></SelectContent></Select></Field>
      <Field label="Quantidade mínima"><Input type="number" min="0" step="0.001" value={form.minimo || 0} onChange={event => upd('minimo', event.target.value)} /></Field>
      <DialogFooter className="md:col-span-2 pt-3"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>
}

function Field({ label, children }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
function Multi({ label, options, values, toggle }) { return <div className="space-y-1.5"><Label>{label}</Label><div className="grid grid-cols-2 gap-2 rounded-md border p-3">{options.map(item => <label key={item.id} className="flex items-center gap-2 text-sm"><Checkbox checked={values.includes(item.id)} onCheckedChange={() => toggle(item.id)} />{item.nome}</label>)}</div></div> }
