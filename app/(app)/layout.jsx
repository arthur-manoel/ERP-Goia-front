import AppShell from '@/components/app-shell/app-shell'
import { EmpresasProvider } from '@/lib/empresas-store'
import { DataProvider } from '@/lib/data-store'

export default function AppGroupLayout({ children }) {
  return (
    <AppShell requireProfile="empresa">
      <EmpresasProvider>
        <DataProvider>{children}</DataProvider>
      </EmpresasProvider>
    </AppShell>
  )
}
