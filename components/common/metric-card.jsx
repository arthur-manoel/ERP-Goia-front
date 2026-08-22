'use client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown } from 'lucide-react'

export default function MetricCard({ label, value, delta, icon: Icon, tone = 'default', hint }) {
  const toneMap = {
    default: 'company-primary-text',
    accent: 'company-accent-text',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    success: 'text-emerald-400',
  }
  const positive = typeof delta === 'number' ? delta >= 0 : null
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          {Icon && (
            <div className={cn('h-8 w-8 rounded-md grid place-items-center bg-secondary/60', toneMap[tone])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {positive !== null && (
            <span className={cn('inline-flex items-center gap-0.5 font-medium', positive ? 'text-emerald-400' : 'text-red-400')}>
              {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
