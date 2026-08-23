'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/common/status-badge'
import { useAuth } from '@/lib/auth-context'
import { formatBRL } from '@/lib/mock-data'
import { ArrowLeft, Package } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const tipoNome = tipo => tipo === 'materia_prima' ? 'Matéria-prima' : 'Produto acabado'
const simNao = valor => valor ? 'Sim' : 'Não'
const quantidade = valor => Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 4 })

export default function DetalheProduto() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [produto, setProduto] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!user?.empresaId || !id) return
    fetch(`/api/products/${id}?empresaId=${encodeURIComponent(user.empresaId)}`)
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body })
      .then(setProduto).catch(error => setErro(error.message))
  }, [id, user?.empresaId])

  if (erro) return <div className="space-y-4"><Button variant="outline" onClick={() => router.push('/produtos')}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button><Card><CardContent className="p-8 text-center text-muted-foreground">{erro}</CardContent></Card></div>
  if (!produto) return <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando produto…</CardContent></Card>

  const disponivel = Number(produto.estoqueTotal) - Number(produto.reservado)
  const cores = Array.from(new Set(produto.variacoes.map(v => v.cor).filter(Boolean)))
  const tamanhos = Array.from(new Set(produto.variacoes.map(v => v.tamanho).filter(Boolean)))

  return <div className="space-y-5">
    <PageHeader title={produto.nome} description={`${tipoNome(produto.tipo)} · Código ${produto.codigo}`} icon={Package}>
      <Button variant="outline" onClick={() => router.push('/produtos')}><ArrowLeft className="mr-2 h-4 w-4" />Voltar aos produtos</Button>
    </PageHeader>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Metric label="Estoque total" value={`${quantidade(produto.estoqueTotal)} ${produto.unidade}`} />
      <Metric label="Reservado" value={`${quantidade(produto.reservado)} ${produto.unidade}`} />
      <Metric label="Disponível" value={`${quantidade(disponivel)} ${produto.unidade}`} warning={disponivel <= Number(produto.minimo)} />
      <Metric label="Valor unitário" value={formatBRL(produto.valorUnitario)} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card><CardHeader><CardTitle className="text-base">Dados do produto</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Detail label="Nome" value={produto.nome} /><Detail label="Código" value={produto.codigo} />
        <Detail label="Tipo" value={tipoNome(produto.tipo)} /><Detail label="Status" value={<StatusBadge status={produto.status} />} />
        <Detail label="Categoria" value={produto.categoria || '—'} /><Detail label="Unidade" value={produto.unidade} />
        <Detail label="Quantidade mínima" value={`${quantidade(produto.minimo)} ${produto.unidadeMinimo === 'metro' ? 'm' : 'un.'}`} />
        <Detail label="Quantidade máxima" value={produto.maximo == null ? '—' : quantidade(produto.maximo)} />
        <Detail label="Custo atual" value={formatBRL(produto.custoAtual)} /><Detail label="Preço de venda" value={formatBRL(produto.precoVenda)} />
        <Detail label="Cores" value={cores.join(', ') || '—'} /><Detail label="Tamanhos" value={tamanhos.join(', ') || '—'} />
        <Detail label="Controla estoque" value={simNao(produto.controlaEstoque)} /><Detail label="Permite compra" value={simNao(produto.permiteCompra)} />
        <Detail label="Permite venda" value={simNao(produto.permiteVenda)} /><Detail label="Permite produção" value={simNao(produto.permiteProducao)} />
        <div className="sm:col-span-2"><Detail label="Descrição" value={produto.descricao || 'Sem descrição'} /></div>
        <Detail label="Cadastrado em" value={produto.cadastradoEm} />
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Estoque por local</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Local</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Reservado</TableHead><TableHead className="text-right">Disponível</TableHead></TableRow></TableHeader><TableBody>
          {!produto.estoques.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Sem saldo em estoque.</TableCell></TableRow>}
          {produto.estoques.map((item, index) => <TableRow key={index}><TableCell>{item.estoque || 'Sem local'}</TableCell><TableCell className="text-right">{quantidade(item.total)}</TableCell><TableCell className="text-right">{quantidade(item.reservado)}</TableCell><TableCell className="text-right font-medium">{quantidade(item.disponivel)}</TableCell></TableRow>)}
        </TableBody></Table>
      </CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle className="text-base">Matérias-primas utilizadas na confecção</CardTitle></CardHeader><CardContent>
      {produto.tipo === 'materia_prima' ? <p className="py-6 text-center text-muted-foreground">Este produto é uma matéria-prima e não possui composição de fabricação.</p> :
      <Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Matéria-prima</TableHead><TableHead className="text-right">Quantidade por unidade</TableHead><TableHead className="text-right">Perda</TableHead><TableHead className="text-right">Consumo com perda</TableHead><TableHead className="text-right">Custo unitário</TableHead></TableRow></TableHeader><TableBody>
        {!produto.insumos.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhuma matéria-prima cadastrada na ficha técnica.</TableCell></TableRow>}
        {produto.insumos.map(item => <TableRow key={item.produtoId}><TableCell className="font-mono text-xs">{item.codigo}</TableCell><TableCell className="font-medium">{item.nome}</TableCell><TableCell className="text-right">{quantidade(item.quantidade)} {item.unidade}</TableCell><TableCell className="text-right">{quantidade(item.perdaPercentual)}%</TableCell><TableCell className="text-right">{quantidade(item.quantidadeComPerda)} {item.unidade}</TableCell><TableCell className="text-right">{formatBRL(item.valorUnitario)}</TableCell></TableRow>)}
      </TableBody></Table>}
    </CardContent></Card>
  </div>
}

function Metric({ label, value, warning }) { return <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">{label}</div><div className={`mt-1 text-2xl font-semibold ${warning ? 'text-amber-400' : ''}`}>{value}</div></CardContent></Card> }
function Detail({ label, value }) { return <div className="border-b border-border/60 pb-2"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div> }
