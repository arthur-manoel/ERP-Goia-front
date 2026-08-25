'use client'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { formatBRL } from '@/lib/mock-data'
import { Bell, AlertTriangle } from 'lucide-react'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'

export default function AlertasEstoquePage() {
  const { user } = useAuth(); const { data } = useEntity('estoque', user?.empresaId)
  const criticos = data.filter(p => Number(p.disponivel) <= Number(p.minimo))
  return (
    <div>
      <PageHeader title="Alertas de Estoque" description="Produtos abaixo do estoque mínimo definido." icon={Bell} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {criticos.map(p => (
          <Card key={p.id} className={`${Number(p.disponivel) === 0 ? 'border-red-500/40 bg-red-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{p.estoque}</div>
                  <div className="font-medium mt-1">{p.nome}</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{p.codigo}</div>
                </div>
                <AlertTriangle className={`h-5 w-5 ${Number(p.disponivel) === 0 ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[10px] text-muted-foreground uppercase">Atual</div><div className={`text-lg font-semibold ${Number(p.disponivel) === 0 ? 'text-red-400' : 'text-amber-400'}`}>{Number(p.disponivel || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</div></div>
                <div><div className="text-[10px] text-muted-foreground uppercase">Mínimo</div><div className="text-lg font-semibold">{p.minimo}</div></div>
                <div><div className="text-[10px] text-muted-foreground uppercase">Valor</div><div className="text-sm font-semibold">{formatBRL(p.valorTotal)}</div></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
