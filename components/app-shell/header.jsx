'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Search, Bell, ChevronDown, LogOut, PackageX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function Header({ onOpenMobile, breadcrumb }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [stockAlerts, setStockAlerts] = useState([])
  useEffect(() => {
    if (!user?.empresaId) { setStockAlerts([]); return }
    fetch(`/api/data/estoque?empresaId=${encodeURIComponent(user.empresaId)}`)
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body })
      .then(items => setStockAlerts(items.filter(item => Number(item.disponivel) < Number(item.minimo))))
      .catch(() => setStockAlerts([]))
  }, [user?.empresaId])
  const quickLogout = () => { logout(); router.replace('/login') }
  const initials = (user?.nome || '?').split(' ').map(n => n[0]).slice(0, 2).join('')
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-full items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile} aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumb?.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-foreground font-medium' : ''}>{b}</span>
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar…" className="w-64 pl-8 bg-secondary/50 border-border" />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Alertas de estoque">
                <Bell className="h-4 w-4" />
                {stockAlerts.length > 0 && <><span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full company-accent-bg text-[9px] text-black grid place-items-center">{stockAlerts.length > 9 ? '9+' : stockAlerts.length}</span></>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-4 py-3 border-b border-border"><div className="text-sm font-semibold">Estoque abaixo do mínimo</div><div className="text-xs text-muted-foreground">{stockAlerts.length} {stockAlerts.length === 1 ? 'item requer' : 'itens requerem'} atenção</div></div>
              <div className="max-h-72 overflow-y-auto">
                {!user?.empresaId ? <div className="p-4 text-xs text-muted-foreground">Selecione uma empresa para visualizar alertas.</div>
                  : stockAlerts.length === 0 ? <div className="p-4 text-xs text-muted-foreground">Nenhum item abaixo do estoque mínimo.</div>
                  : stockAlerts.map(item => <button key={item.id} onClick={() => router.push('/alertas-estoque')} className="w-full px-4 py-3 text-left border-b border-border/60 hover:bg-secondary/50 flex gap-3">
                      <PackageX className="h-4 w-4 mt-0.5 text-red-400 shrink-0" />
                      <span className="min-w-0"><span className="block text-sm font-medium truncate">{item.produto}</span><span className="block text-[11px] text-muted-foreground">{item.estoque} · disponível {item.disponivel} / mínimo {item.minimo}</span></span>
                    </button>)}
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 border-l border-border rounded-md outline-none hover:bg-secondary/40 pr-2 py-1" aria-label="Menu do perfil">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback></Avatar>
                <div className="hidden sm:block leading-tight text-left">
                  <div className="text-sm font-medium">{user?.nome}</div>
                  <div className="text-[11px] text-muted-foreground">{user?.perfil === 'admin_geral' ? 'Admin Geral' : user?.setor}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5"><div className="text-sm font-medium truncate">{user?.nome}</div><div className="text-xs text-muted-foreground truncate">{user?.email}</div></div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={quickLogout} className="text-red-400 focus:text-red-400"><LogOut />Sair rapidamente</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
