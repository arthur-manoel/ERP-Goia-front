'use client'
import { useParams } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusBadge from '@/components/common/status-badge'
import { produtos, formatBRL, kardex } from '@/lib/mock-data'
import { Package } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function DetalheProduto() {
  const { id } = useParams()
  const p = produtos.find(x => x.id === id) || produtos[0]
  const disp = p.estoqueTotal - p.reservado
  const movs = kardex.filter(k => k.produto === p.nome).slice(0, 5)
  return (
    <div>
      <PageHeader title={p.nome} description={`Código ${p.codigo} · ${p.categoria} · ${p.unidade}`} icon={Package} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border"><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Estoque total</div><div className="text-2xl font-semibold mt-1">{p.estoqueTotal}</div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Reservado</div><div className="text-2xl font-semibold mt-1">{p.reservado}</div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Disponível</div><div className={`text-2xl font-semibold mt-1 ${disp <= p.minimo ? 'text-amber-400' : ''}`}>{disp}</div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Valor em estoque</div><div className="text-2xl font-semibold mt-1">{formatBRL(p.valorTotal)}</div><div className="text-[11px] text-muted-foreground mt-1">Unitário: {formatBRL(p.valorUnitario)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Últimas movimentações</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="border-border"><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Setor</TableHead><TableHead className="text-right">Entrada</TableHead><TableHead className="text-right">Saída</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
              <TableBody>
                {movs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Sem movimentações</TableCell></TableRow>}
                {movs.map(m => (
                  <TableRow key={m.id} className="border-border">
                    <TableCell className="text-xs">{m.data}</TableCell>
                    <TableCell><StatusBadge status={m.tipo.split('_')[0]} /></TableCell>
                    <TableCell>{m.setor}</TableCell>
                    <TableCell className="text-right text-emerald-400">{m.entrada || '—'}</TableCell>
                    <TableCell className="text-right text-red-400">{m.saida || '—'}</TableCell>
                    <TableCell className="text-right font-medium">{m.saldo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={p.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Estoque mínimo</span><span>{p.minimo}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Permite compra</span><span>{p.permiteCompra ? 'Sim' : 'Não'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Permite venda</span><span>{p.permiteVenda ? 'Sim' : 'Não'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Permite produção</span><span>{p.permiteProducao ? 'Sim' : 'Não'}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
