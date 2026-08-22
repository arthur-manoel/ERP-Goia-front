'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function CurrencyInput({ className, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        R$
      </span>
      <Input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        className={cn('pl-11', className)}
        {...props}
      />
    </div>
  )
}
