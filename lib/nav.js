// Navegação com filtragem por perfil de acesso e permissões.
import {
  LayoutDashboard, Package, Layers3, Palette, Users, Truck, Building2, UserCog,
  ShoppingCart, FileText, Factory, ShoppingBag, Boxes, ScrollText, Bell,
  Shield, Settings, KeySquare, Ruler, Warehouse,
} from 'lucide-react'

export const navGroupsEmpresa = [
  { label: 'Visão Geral', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard' },
  ]},
  { label: 'Cadastros', items: [
    { href: '/produtos', label: 'Produtos', icon: Package, perm: 'produtos' },
    { href: '/categorias', label: 'Categorias', icon: Layers3, perm: 'categorias' },
    { href: '/cores', label: 'Cores', icon: Palette, perm: 'cores' },
    { href: '/tamanhos', label: 'Tamanhos', icon: Ruler, perm: 'tamanhos' },
    { href: '/clientes', label: 'Clientes', icon: Users, perm: 'clientes' },
    { href: '/fornecedores', label: 'Fornecedores', icon: Truck, perm: 'fornecedores' },
    { href: '/setores', label: 'Setores', icon: Building2, perm: null, adminOnly: true },
    { href: '/usuarios', label: 'Usuários', icon: UserCog, perm: null, adminOnly: true },
  ]},
  { label: 'Operações', items: [
    { href: '/compras', label: 'Compras', icon: ShoppingCart, perm: 'pedidos_compra' },
    { href: '/notas-fiscais', label: 'Notas Fiscais', icon: FileText, perm: 'notas_fiscais' },
    { href: '/ordens-producao', label: 'Ordens de Produção', icon: Factory, perm: 'ordens_producao' },
    { href: '/vendas', label: 'Vendas', icon: ShoppingBag, perm: 'vendas' },
  ]},
  { label: 'Estoque', items: [
    { href: '/estoque', label: 'Estoque', icon: Boxes, perm: 'estoque' },
    { href: '/kardex', label: 'Kardex', icon: ScrollText, perm: 'kardex' },
    { href: '/alertas-estoque', label: 'Alertas de Estoque', icon: Bell, perm: 'estoque' },
  ]},
  { label: 'Gestão', items: [
    { href: '/auditoria', label: 'Auditoria', icon: Shield, perm: null, adminOnly: true },
    { href: '/configuracoes', label: 'Configurações da Empresa', icon: Settings, perm: null, adminOnly: true },
    { href: '/permissoes', label: 'Permissões de Usuários', icon: KeySquare, perm: null, adminOnly: true },
  ]},
]

export const navGroupsAdminGeral = [
  { label: 'Plataforma', items: [
    { href: '/admin/dashboard', label: 'Visão Global', icon: LayoutDashboard, perm: null },
    { href: '/admin/empresas', label: 'Empresas', icon: Building2, perm: null },
  ]},
]

export const permissoesDeTela = navGroupsEmpresa.flatMap(group => group.items)
  .filter(item => item.perm && !item.adminOnly)
  .map(item => ({ chave: item.perm, nome: item.label }))
  .filter((item, index, all) => all.findIndex(other => other.chave === item.chave) === index)

export function navForUser(user) {
  if (!user) return []
  if (user.perfil === 'admin_geral') return navGroupsAdminGeral
  const isAdmin = user.perfil === 'admin_empresa'
  const perms = user.permissoes || []
  return navGroupsEmpresa
    .map(g => ({ ...g, items: g.items.filter(it => {
      if (it.adminOnly && !isAdmin) return false
      if (isAdmin) return true
      if (!it.perm) return true
      return perms.includes(it.perm)
    })}))
    .filter(g => g.items.length > 0)
}
