'use client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MetricCard from '@/components/common/metric-card'
import StatusBadge from '@/components/common/status-badge'
import { DollarSign, ShoppingBag, Factory, FileText, Boxes, AlertTriangle, RefreshCw, Plus, ArrowRight, Bell, FilePlus, PackagePlus, ShoppingCart, Search } from 'lucide-react'
import { formatBRL } from '@/lib/mock-data'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import Link from 'next/link'

const chartTooltip = {
  contentStyle: { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'hsl(var(--muted-foreground))' },
}

export default function DashboardPage() {
  const { user, empresa } = useAuth()
  const { data: produtos } = useEntity('produtos', user?.empresaId)
  const { data: notasFiscais } = useEntity('notas', user?.empresaId)
  const { data: ordensProducao } = useEntity('ops', user?.empresaId)
  const { data: vendas } = useEntity('vendas', user?.empresaId)
  const { data: auditoria } = useEntity('auditoria', user?.empresaId)
  const abaixoDoMinimo = produtos.filter(p => p.estoqueTotal <= p.minimo).length
  const nfPendentes = notasFiscais.filter(n => n.status === 'pendente').length
  const opAbertas = ordensProducao.filter(o => ['aberta', 'em_producao', 'aguardando_material'].includes(o.status)).length
  const faturamento = vendas.filter(v => v.status === 'entregue').reduce((s, v) => s + Number(v.valor || 0), 0)
  const valorEstoque = produtos.reduce((s, p) => s + Number(p.valorTotal ?? (p.estoqueTotal || 0) * (p.valorUnitario || 0)), 0)
  const faturamentoMensal = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((mes, i) => ({
    mes,
    atual: vendas.filter(v => Number(String(v.data || '').slice(5, 7)) === i + 1 && v.status === 'entregue').reduce((s, v) => s + Number(v.valor || 0), 0),
  }))
  const produtosMaisVendidos = vendas.map(v => ({ produto: v.numero, qtd: Number(v.itens || 0), valor: Number(v.valor || 0) })).slice(0, 5)
  const distribuicaoEstoque = [{ setor: 'Estoque da empresa', valor: valorEstoque }]

  const pieColors = ['hsl(var(--company-primary))', 'hsl(var(--company-accent))', 'hsl(190 70% 55%)', 'hsl(280 55% 65%)', 'hsl(25 85% 60%)']

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Olá, {user?.nome?.split(' ')[0] || 'usuário'} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão exclusiva de {empresa?.nomeFantasia || 'sua empresa'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2"><RefreshCw className="h-3.5 w-3.5" />Atualizar</Button>
          <Button size="sm" className="gap-2 company-primary-bg text-primary-foreground hover:opacity-90"><Plus className="h-3.5 w-3.5" />Nova operação</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="Faturamento entregue" value={formatBRL(faturamento)} hint="somente desta empresa" icon={DollarSign} tone="default" />
        <MetricCard label="Total de vendas" value={vendas.length} hint="somente desta empresa" icon={ShoppingBag} tone="accent" />
        <MetricCard label="OPs em aberto" value={opAbertas} hint="em produção ou aguardando" icon={Factory} />
        <MetricCard label="NFs pendentes" value={nfPendentes} hint="aguardando recebimento" icon={FileText} tone="warning" />
        <MetricCard label="Valor em estoque" value={formatBRL(valorEstoque)} icon={Boxes} tone="success" />
        <MetricCard label="Abaixo do mínimo" value={abaixoDoMinimo} hint="produtos críticos" icon={AlertTriangle} tone="danger" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Faturamento mensal</CardTitle>
              <CardDescription>Comparação com o mesmo período do ano anterior</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full company-primary-bg" />Atual</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/60" />Ano anterior</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={faturamentoMensal} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAtual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--company-primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--company-primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip {...chartTooltip} formatter={(v) => formatBRL(v)} />
                  <Area type="monotone" dataKey="atual" stroke="hsl(var(--company-primary))" strokeWidth={2} fill="url(#gAtual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de estoque</CardTitle>
            <CardDescription>Valor por setor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip {...chartTooltip} formatter={(v) => formatBRL(v)} />
                  <Pie data={distribuicaoEstoque} dataKey="valor" nameKey="setor" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="hsl(var(--card))">
                    {distribuicaoEstoque.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Produtos com maior saída</CardTitle>
            <CardDescription>Vendas da empresa por quantidade de itens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={produtosMaisVendidos} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="produto" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} angle={-8} textAnchor="end" height={50} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="qtd" fill="hsl(var(--company-primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Alertas de estoque</CardTitle>
              <CardDescription>Produtos críticos</CardDescription>
            </div>
            <Bell className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent className="space-y-2">
            {produtos.filter(p => p.estoqueTotal <= p.minimo).map(p => (
              <div key={p.id} className={`flex items-center justify-between rounded-md border p-3 ${p.estoqueTotal === 0 ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.nome}</div>
                  <div className="text-[11px] text-muted-foreground">Mín.: {p.minimo} · Atual: {p.estoqueTotal}</div>
                </div>
                <AlertTriangle className={`h-4 w-4 ${p.estoqueTotal === 0 ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">OPs em andamento</CardTitle>
            <Link href="/ordens-producao" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">Ver tudo <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordensProducao.slice(0, 4).map(op => (
              <div key={op.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{op.numero}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{op.produto} · {op.produzida}/{op.planejada}</div>
                </div>
                <StatusBadge status={op.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">NFs aguardando</CardTitle>
            <Link href="/notas-fiscais" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">Ver tudo <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {notasFiscais.filter(n => n.status === 'pendente').map(nf => (
              <div key={nf.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">NF {nf.numero}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{nf.fornecedor} · {formatBRL(nf.valorTotal)}</div>
                </div>
                <StatusBadge status={nf.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Atividades recentes</CardTitle>
            <CardDescription>Auditoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditoria.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="h-2 w-2 mt-2 rounded-full company-primary-bg shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm">{a.acao} <span className="text-muted-foreground">· {a.registro}</span></div>
                  <div className="text-[11px] text-muted-foreground">{a.usuario} · {a.data}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Atalhos rápidos</CardTitle>
          <CardDescription>Comece uma nova operação em segundos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { href: '/notas-fiscais/nova', label: 'Nova nota fiscal', icon: FilePlus },
              { href: '/ordens-producao', label: 'Nova ordem', icon: Factory },
              { href: '/produtos/novo', label: 'Novo produto', icon: PackagePlus },
              { href: '/vendas', label: 'Nova venda', icon: ShoppingCart },
              { href: '/estoque', label: 'Consultar estoque', icon: Search },
            ].map((s) => (
              <Link key={s.href} href={s.href} className="group rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 p-4 flex flex-col items-start gap-2 transition">
                <div className="h-8 w-8 rounded-md company-primary-bg grid place-items-center">
                  <s.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="text-sm font-medium">{s.label}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
