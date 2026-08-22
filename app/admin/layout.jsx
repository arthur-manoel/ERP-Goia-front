import AppShell from '@/components/app-shell/app-shell'
import { EmpresasProvider } from '@/lib/empresas-store'

export default function AdminLayout({ children }) {
  return (
    <AppShell requireProfile="admin_geral">
      <EmpresasProvider>{children}</EmpresasProvider>
    </AppShell>
  )
}
