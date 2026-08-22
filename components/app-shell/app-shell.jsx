'use client'
import { useState, useEffect } from 'react'
import Sidebar from './sidebar'
import Header from './header'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { empresaAtual } from '@/lib/mock-data'
import { Loader2 } from 'lucide-react'
import { navForUser } from '@/lib/nav'

function applyCompanyTheme(empresa) {
  if (typeof window === 'undefined') return
  const saved = window.localStorage.getItem('goiabd-theme')
  const theme = saved ? JSON.parse(saved) : {
    primary:  empresa?.corPrimaria   || empresaAtual.corPrimaria,
    secondary:empresa?.corSecundaria || empresaAtual.corSecundaria,
    accent:   empresa?.corDestaque   || empresaAtual.corDestaque,
  }
  document.documentElement.style.setProperty('--company-primary', theme.primary)
  document.documentElement.style.setProperty('--company-secondary', theme.secondary)
  document.documentElement.style.setProperty('--company-accent', theme.accent)
}

function crumbsFrom(pathname) {
  const parts = (pathname || '/').split('/').filter(Boolean)
  const map = { dashboard: 'Dashboard', produtos: 'Produtos', categorias: 'Categorias', modelos: 'Modelos', cores: 'Cores', tamanhos: 'Tamanhos', clientes: 'Clientes', fornecedores: 'Fornecedores', setores: 'Setores', usuarios: 'Usuários', 'requisicoes-compra': 'Requisições de Compra', 'pedidos-compra': 'Pedidos de Compra', 'notas-fiscais': 'Notas Fiscais', 'ordens-producao': 'Ordens de Produção', vendas: 'Vendas', estoques: 'Estoque', estoque: 'Estoque', kardex: 'Kardex', 'alertas-estoque': 'Alertas de Estoque', auditoria: 'Auditoria', configuracoes: 'Configurações', permissoes: 'Permissões', admin: 'Administração', empresas: 'Empresas', novo: 'Novo', nova: 'Nova', editar: 'Editar' }
  return ['COMPET', ...parts.map(p => map[p] || p)]
}

export default function AppShell({ children, requireProfile }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, empresa, loaded } = useAuth()

  useEffect(() => { applyCompanyTheme(empresa) }, [empresa])

  // Guardas de acesso
  useEffect(() => {
    if (!loaded) return
    if (!user) { router.replace('/login'); return }
    if (requireProfile === 'admin_geral' && user.perfil !== 'admin_geral') { router.replace('/dashboard'); return }
    if (requireProfile === 'empresa' && user.perfil === 'admin_geral') { router.replace('/admin/empresas'); return }
    if (requireProfile === 'empresa' && user.perfil === 'usuario') {
      const allowed = navForUser(user).flatMap(group => group.items)
      const canAccess = allowed.some(item => pathname === item.href || pathname?.startsWith(item.href + '/'))
      if (!canAccess) router.replace(allowed[0]?.href || '/login')
    }
  }, [loaded, user, requireProfile, router, pathname])

  if (!loaded || !user) {
    return <div className="h-screen w-full grid place-items-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden lg:block h-full">
        <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(v => !v)} />
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-sidebar border-sidebar-border">
          <Sidebar collapsed={false} onCollapse={() => {}} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobile={() => setMobileOpen(true)} breadcrumb={crumbsFrom(pathname)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
