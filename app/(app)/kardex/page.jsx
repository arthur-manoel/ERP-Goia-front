'use client'
import { useMemo, useState } from 'react'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatBRL } from '@/lib/mock-data'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { ScrollText, ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Legend } from 'recharts'

const tipoLabel = {
  entrada_nf: 'Entrada por NF', entrada_producao: 'Entrada por produção',
  saida_consumo: 'Saída por consumo', saida_venda: 'Saída por venda',
  ajuste_entrada: 'Ajuste de entrada', ajuste_saida: 'Ajuste de saída',
  transferencia: 'Transferência', reserva: 'Reserva',
}

const chartTip = { contentStyle: { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }, labelStyle: { color: 'hsl(var(--muted-foreground))' } }

function serieDe(produto, kardex) {
  const porDia = new Map()
  kardex.filter(k => k.produto === produto).forEach(k => {
    const data = String(k.data || '').slice(0, 10)
    const atual = porDia.get(data) || { data, entrada: 0, saida: 0 }
    atual.entrada += Number(k.entrada || 0)
    atual.saida += Number(k.saida || 0)
    porDia.set(data, atual)
  })
  return Array.from(porDia.values()).reverse()
}

export default function KardexPage() {
  const { user } = useAuth(); const { data: kardex } = useEntity('kardex', user?.empresaId)
  const listaProdutos = useMemo(() => Array.from(new Set(kardex.map(k => k.produto))), [kardex])
  const [produtoSel, setProdutoSel] = useState('')
  const produtoAtual = produtoSel || listaProdutos[0] || ''

  const registrosDoProduto = kardex.filter(k => k.produto === produtoAtual)
  const entradas = registrosDoProduto.reduce((s, k) => s + Number(k.entrada || 0), 0)
  const saidas = registrosDoProduto.reduce((s, k) => s + Number(k.saida || 0), 0)
  const saldosPorEstoque = registrosDoProduto.reduce((map, k) => { const key = k.estoque || 'Sem estoque'; if (!map.has(key)) map.set(key, Number(k.saldo || 0)); return map }, new Map())
  const saldoAtual = Array.from(saldosPorEstoque.values()).reduce((s, value) => s + value, 0)
  const serie = useMemo(() => serieDe(produtoAtual, kardex), [produtoAtual, kardex])

  const columns = [
    { key: 'data', label: 'Data', cellClass: 'text-xs' },
    { key: 'produto', label: 'Produto', render: (r) => <div><div className="font-medium text-sm">{r.produto}</div><div className="text-[11px] text-muted-foreground">{r.estoque} · {r.usuario}</div></div> },
    { key: 'tipo', label: 'Tipo', render: (r) => {
      const entrada = Number(r.entrada) > 0
      return <span className={`inline-flex items-center gap-1 text-xs ${entrada ? 'text-emerald-400' : 'text-red-400'}`}>{entrada ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}{tipoLabel[r.tipo] || r.tipo}</span>
    }},
    { key: 'origem', label: 'Origem', render: (r) => <span className="font-mono text-xs">{r.origem}</span> },
    { key: 'entrada', label: 'Entrada', cellClass: 'text-right', render: (r) => Number(r.entrada) > 0 ? <span className="text-emerald-400">+{r.entrada}</span> : '—' },
    { key: 'saida', label: 'Saída', cellClass: 'text-right', render: (r) => Number(r.saida) > 0 ? <span className="text-red-400">-{r.saida}</span> : '—' },
    { key: 'saldoAnterior', label: 'Saldo anterior', cellClass: 'text-right' },
    { key: 'saldo', label: 'Saldo', cellClass: 'text-right font-medium' },
    { key: 'valorTotal', label: 'Valor', cellClass: 'text-right', render: (r) => formatBRL(r.valorTotal) },
  ]

  return (
    <div>
      <PageHeader title="Kardex" description="Extrato detalhado das movimentações de estoque." icon={ScrollText}>
        <div className="w-64">
          <Select value={produtoAtual} onValueChange={setProdutoSel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{listaProdutos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="bg-card border-border"><CardContent className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Entradas (período)</div>
          <div className="text-2xl font-semibold mt-1 text-emerald-400">+{entradas}</div>
          <div className="text-[11px] text-muted-foreground">Somatório das entradas de estoque</div>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Saídas (período)</div>
          <div className="text-2xl font-semibold mt-1 text-red-400">-{saidas}</div>
          <div className="text-[11px] text-muted-foreground">Consumo + vendas + ajustes</div>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Saldo atual</div>
          <div className="text-2xl font-semibold mt-1">{saldoAtual}</div>
          <div className="text-[11px] text-muted-foreground">Última posição registrada</div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 company-primary-text" />Movimentação — {produtoAtual}</CardTitle>
              <CardDescription>Entradas e saídas nos últimos 7 dias</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Entradas</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Saídas</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={serie} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(248,113,113)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="rgb(248,113,113)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip {...chartTip} />
                  <Area type="monotone" dataKey="entrada" stroke="rgb(52,211,153)" strokeWidth={2} fill="url(#gE)" />
                  <Area type="monotone" dataKey="saida" stroke="rgb(248,113,113)" strokeWidth={2} fill="url(#gS)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Comparativo diário</CardTitle><CardDescription>Entradas vs saídas</CardDescription></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={serie} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip {...chartTip} />
                  <Bar dataKey="entrada" fill="rgb(52,211,153)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="saida" fill="rgb(248,113,113)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <DataTable data={kardex} columns={columns} searchKeys={['produto','estoque','origem','usuario']} />
      </div>
    </div>
  )
}
