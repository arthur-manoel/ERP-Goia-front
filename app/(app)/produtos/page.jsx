'use client'
import { useEffect, useState } from 'react'
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
import { Package, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

export default function ProdutosPage() {
  const { user } = useAuth()
  const { data, create, update, remove } = useEntity('produtos', user?.empresaId)
  const { data: categorias } = useEntity('categorias', user?.empresaId)
  const { data: cores } = useEntity('cores', user?.empresaId)
  const { data: tamanhos } = useEntity('tamanhos', user?.empresaId)
  const [editing, setEditing] = useState(null)
  const [tipoVisivel, setTipoVisivel] = useState('todos')
  const materiasPrimas = data.filter(p => p.tipo === 'materia_prima')
  const produtosVisiveis = tipoVisivel === 'todos' ? data : data.filter(p => p.tipo === tipoVisivel)
  const atributos = (r, chave) => Array.from(new Set((r.variacoes || []).map(v => v[chave]).filter(Boolean))).join(', ') || '—'

  const columns = [
    { key: 'codigo', label: 'Código', render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.codigo}</span> },
    { key: 'nome', label: 'Produto', render: (r) => <div><div className="font-medium text-sm">{r.nome}</div><div className="text-[11px] text-muted-foreground">{r.tipo === 'materia_prima' ? 'Matéria-prima' : 'Produto acabado'}</div></div> },
    { key: 'unidade', label: 'Unid.' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'cor', label: 'Cores', render: r => atributos(r, 'cor') },
    { key: 'tamanho', label: 'Tamanhos', render: r => atributos(r, 'tamanho') },
    { key: 'minimo', label: 'Qtd. mínima', render: r => <span>{Number(r.minimo || 0)} {r.unidadeMinimo === 'metro' ? 'm' : 'un.'}</span> },
    { key: 'estoqueTotal', label: 'Estoque', render: (r) => <span>{r.estoqueTotal ?? 0}</span> },
    { key: 'valorUnitario', label: 'Valor unit.', render: (r) => formatBRL(r.valorUnitario ?? 0) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status || 'ativo'} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={async () => { if (confirm(`Excluir ${r.nome}?`)) { try { await remove(r.id); toast.success('Produto removido com segurança.') } catch(error) { toast.error(error.message) } } }}><Trash2 className="h-3.5 w-3.5" /></Button></div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Produtos" description="Cadastro de matérias-primas e produtos acabados com categoria, cor e tamanho." icon={Package}>
        <QuickCreateDialog label="Novo produto" defaults={{ tipo: '', unidade: 'metro', unidadeMinimo: 'unidade', status: 'ativo', estoqueTotal: 0, reservado: 0, minimo: 0, valorTotal: 0, valorUnitario: 0 }} fields={[
          { name: 'nome', label: 'Nome', required: true, placeholder: 'Ex: Malha PV 67/33 Branca' },
          { name: 'codigo', label: 'Código interno', type: 'uniqueCode', required: true, placeholder: 'MP-TEC-010' },
          { name: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Descrição técnica...' },
          { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'materia_prima', label: 'Matéria-prima' }, { value: 'produto_acabado', label: 'Produto acabado' }] },
          { name: 'unidade', label: 'Unidade de medida', type: 'select', options: [{ value: 'metro', label: 'Metro' }, { value: 'unidade', label: 'Unidade' }, { value: 'kg', label: 'Quilograma' }, { value: 'outros', label: 'Outros' }], showWhen: f => Boolean(f.tipo) },
          { name: 'categoriaId', label: 'Categoria', type: 'select', options: categorias.map(item => ({ value: item.id, label: item.nome })), required: true, showWhen: f => f.tipo === 'produto_acabado' },
          { name: 'corIds', label: 'Cores (opcional)', type: 'multiselect', options: cores.map(item => ({ value: item.id, label: item.nome })), showWhen: f => Boolean(f.tipo) },
          { name: 'tamanhoIds', label: 'Tamanhos (opcional)', type: 'multiselect', options: tamanhos.map(item => ({ value: item.id, label: item.nome })), showWhen: f => Boolean(f.tipo) },
          { name: 'insumos', label: 'Matérias-primas por unidade', type: 'recipe', options: materiasPrimas.map(item => ({ value: item.id, label: `${item.codigo} · ${item.nome}` })), required: true, showWhen: f => f.tipo === 'produto_acabado' },
          { name: 'unidadeMinimo', label: 'Unidade da quantidade mínima', type: 'select', required: true, options: [{ value: 'unidade', label: 'Quantidade unitária' }, { value: 'metro', label: 'Quantidade por metro' }], showWhen: f => Boolean(f.tipo) },
          { name: 'minimo', label: 'Quantidade mínima em estoque', type: 'number', required: true, placeholder: '0', showWhen: f => Boolean(f.tipo) },
          { name: 'status', label: 'Ativo', type: 'switch', showWhen: f => Boolean(f.tipo) },
        ]} onCreate={(v) => create({ ...v, categoriaId: v.tipo === 'produto_acabado' ? v.categoriaId : null, status: v.status === false ? 'inativo' : 'ativo' })} />
      </PageHeader>
      <div className="mb-4 max-w-xs"><Label className="mb-1.5 block">Exibir produtos por tipo</Label><Select value={tipoVisivel} onValueChange={setTipoVisivel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="materia_prima">Matérias-primas</SelectItem><SelectItem value="produto_acabado">Produtos acabados</SelectItem></SelectContent></Select></div>
      <DataTable data={produtosVisiveis} columns={columns} searchKeys={['nome','codigo']} />
      <EditProductDialog product={editing} onClose={()=>setEditing(null)} categorias={categorias} cores={cores} tamanhos={tamanhos} onSave={async values=>{await update(editing.id,values);setEditing(null);toast.success('Produto atualizado.')}} />
    </div>
  )
}

function EditProductDialog({product,onClose,categorias,cores,tamanhos,onSave}){
  const[f,setF]=useState(null);const[saving,setSaving]=useState(false);const modelos=[]
  useEffect(()=>{if(product)setF({...product,corIds:Array.from(new Set((product.variacoes||[]).map(v=>v.corId))),tamanhoIds:Array.from(new Set((product.variacoes||[]).map(v=>v.tamanhoId))),categoriaId:product.categoriaId?String(product.categoriaId):'',modeloId:product.modeloId?String(product.modeloId):'',unidadeMinimo:product.unidadeMinimo||'unidade'})},[product])
  if(!f)return null;const upd=(k,v)=>setF(p=>({...p,[k]:v}));const toggle=(key,id)=>upd(key,f[key].includes(id)?f[key].filter(x=>x!==id):[...f[key],id]);const acabado=f.tipo==='produto_acabado'
  const submit=async e=>{e.preventDefault();setSaving(true);try{await onSave({...f,categoriaId:acabado?f.categoriaId:null,status:'ativo'})}catch(error){toast.error(error.message)}finally{setSaving(false)}}
  return <Dialog open={!!product} onOpenChange={open=>{if(!open)onClose()}}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Editar produto</DialogTitle></DialogHeader><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2"><Field label="Nome"><Input value={f.nome||''} onChange={e=>upd('nome',e.target.value)} required/></Field><Field label="Código"><Input value={f.codigo||''} onChange={e=>upd('codigo',e.target.value)} required/></Field><div className="md:col-span-2"><Field label="Descrição"><Textarea value={f.descricao||''} onChange={e=>upd('descricao',e.target.value)}/></Field></div><Field label="Tipo"><Select value={f.tipo} onValueChange={v=>upd('tipo',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="materia_prima">Matéria-prima</SelectItem><SelectItem value="produto_acabado">Produto acabado</SelectItem></SelectContent></Select></Field><Field label="Unidade"><Select value={f.unidade||'unidade'} onValueChange={v=>upd('unidade',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="metro">Metro</SelectItem><SelectItem value="unidade">Unidade</SelectItem><SelectItem value="kg">Quilograma</SelectItem></SelectContent></Select></Field>{acabado&&<><Field label="Categoria"><Select value={f.categoriaId} onValueChange={v=>upd('categoriaId',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{categorias.map(x=><SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent></Select></Field><Field label="Modelo"><Select value={f.modeloId} onValueChange={v=>upd('modeloId',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{modelos.map(x=><SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent></Select></Field></>}<Multi label="Cores" options={cores} values={f.corIds} toggle={id=>toggle('corIds',id)}/><Multi label="Tamanhos" options={tamanhos} values={f.tamanhoIds} toggle={id=>toggle('tamanhoIds',id)}/><Field label="Unidade do mínimo"><Select value={f.unidadeMinimo} onValueChange={v=>upd('unidadeMinimo',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="unidade">Quantidade unitária</SelectItem><SelectItem value="metro">Quantidade por metro</SelectItem></SelectContent></Select></Field><Field label="Quantidade mínima"><Input type="number" min="0" step="0.001" value={f.minimo||0} onChange={e=>upd('minimo',e.target.value)}/></Field><DialogFooter className="md:col-span-2 pt-3"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={saving}>{saving?'Salvando…':'Salvar alterações'}</Button></DialogFooter></form></DialogContent></Dialog>
}
function Field({label,children}){if(label==='Modelo')return null;return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>}
function Multi({label,options,values,toggle}){return <div className="space-y-1.5"><Label>{label}</Label><div className="grid grid-cols-2 gap-2 rounded-md border p-3">{options.map(x=><label key={x.id} className="flex items-center gap-2 text-sm"><Checkbox checked={values.includes(x.id)} onCheckedChange={()=>toggle(x.id)}/>{x.nome}</label>)}</div></div>}
