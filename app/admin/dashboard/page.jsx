'use client'
import PageHeader from '@/components/common/page-header'
import MetricCard from '@/components/common/metric-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { empresas } from '@/lib/mock-data'
import { Building2, Users, TrendingUp, Activity } from 'lucide-react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const chartTip = { contentStyle: { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 } }

export default function AdminDashboardPage() {
  const total = empresas.length
  const ativas = empresas.filter(e => e.status === 'ativa').length
  const inativas = total - ativas
  const usuariosTotal = empresas.reduce((s, e) => s + e.usuarios, 0)
  const noMes = empresas.filter(e => e.cadastradaEm.startsWith('2025-06')).length

  const porEmpresa = empresas.map(e => ({ nome: e.nomeFantasia.split(' ')[0], usuarios: e.usuarios }))

  return (
    <div>
      <PageHeader title="Visão Global da Plataforma" description="Você está no perfil Admin Geral. Aqui gerencia as empresas da plataforma sem acessar dados operacionais delas." icon={Activity} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <MetricCard label="Empresas totais" value={total} icon={Building2} />
        <MetricCard label="Ativas" value={ativas} icon={Building2} tone="success" />
        <MetricCard label="Inativas" value={inativas} icon={Building2} tone="danger" />
        <MetricCard label="Novas no mês" value={noMes} icon={TrendingUp} tone="accent" />
        <MetricCard label="Usuários totais" value={usuariosTotal} icon={Users} />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Usuários por empresa</CardTitle>
          <CardDescription>Distribuição de contas cadastradas por cliente da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={porEmpresa} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip {...chartTip} />
                <Bar dataKey="usuarios" fill="hsl(var(--company-primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 bg-card border-border">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Como <span className="text-foreground font-medium">Admin Geral</span>, você não vê produtos, estoque, notas ou ordens de produção das empresas. Sua responsabilidade é apenas <span className="text-foreground">criar, editar, desativar e excluir empresas</span> — os dados operacionais são privados de cada cliente da plataforma.
        </CardContent>
      </Card>
    </div>
  )
}
