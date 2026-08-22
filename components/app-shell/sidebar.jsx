'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { navForUser } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Scissors, LogOut, ChevronsLeft, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import { useEmpresas } from '@/lib/empresas-store'

export default function Sidebar({ collapsed, onCollapse, onNavigate }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const isAdminGeral = user?.perfil === 'admin_geral'

  // Consulta a empresa do usuário via store (pega logo atualizada em tempo real)
  let empresa = null
  try { empresa = useEmpresas().get(user?.empresaId) } catch { empresa = null }

  const groups = navForUser(user)
  const doLogout = () => { logout(); router.push('/login') }

  return (
    <aside className={cn(
      'flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200',
      collapsed ? 'w-[76px]' : 'w-[260px]'
    )}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg company-primary-bg grid place-items-center shadow-sm overflow-hidden">
          {empresa?.logo
            ? <img src={empresa.logo} alt="logo" className="h-full w-full object-cover" />
            : isAdminGeral
              ? <Building2 className="h-5 w-5 text-primary-foreground" />
              : <Scissors className="h-5 w-5 text-primary-foreground" />}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{isAdminGeral ? 'COMPET · Plataforma' : (empresa?.nomeFantasia || 'COMPET')}</div>
            <div className="text-[11px] text-muted-foreground truncate">{isAdminGeral ? 'Administração central' : 'Tema · COMPET'}</div>
          </div>
        )}
        <button onClick={onCollapse} className="ml-auto hidden lg:grid h-7 w-7 place-items-center rounded-md hover:bg-sidebar-accent" title={collapsed ? 'Expandir' : 'Recolher'}>
          <ChevronsLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        {groups.map((g) => (
          <div key={g.label} className="px-3 pb-3">
            {!collapsed && (
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{g.label}</div>
            )}
            <div className="flex flex-col gap-0.5">
              {g.items.map((it) => {
                const Icon = it.icon
                const active = pathname === it.href || pathname?.startsWith(it.href + '/')
                return (
                  <Link key={it.href} href={it.href} onClick={onNavigate}
                    className={cn('group relative flex items-center gap-3 rounded-md px-2 py-2 text-sm transition',
                      active ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/60')}
                    title={collapsed ? it.label : undefined}>
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r company-primary-bg" />}
                    <Icon className={cn('h-4 w-4 shrink-0', active && 'company-primary-text')} />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar className="h-9 w-9"><AvatarFallback className="bg-sidebar-accent text-xs">{(user?.nome || '?').split(' ').map(n=>n[0]).slice(0,2).join('')}</AvatarFallback></Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.nome}</div>
              <div className="text-[11px] text-muted-foreground truncate">{isAdminGeral ? 'Admin Geral' : user?.setor}</div>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={doLogout} title="Sair"><LogOut className="h-4 w-4" /></Button>
          )}
        </div>
      </div>
    </aside>
  )
}
