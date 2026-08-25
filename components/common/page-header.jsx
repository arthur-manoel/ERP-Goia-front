'use client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, description, action, actionHref, onAction, icon: Icon, children }) {
  const pathname=usePathname();const compraDetail=/^\/compras\/[^/]+$/.test(pathname||'')
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 company-primary-text" />}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {compraDetail&&<Button asChild variant="outline"><Link href="/compras"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar às compras</Link></Button>}
        {children}
        {action && actionHref && (
          <Link href={actionHref}>
            <Button className="company-primary-bg text-primary-foreground hover:opacity-90">{action}</Button>
          </Link>
        )}
        {action && onAction && (
          <Button onClick={onAction} className="company-primary-bg text-primary-foreground hover:opacity-90">{action}</Button>
        )}
      </div>
    </div>
  )
}
