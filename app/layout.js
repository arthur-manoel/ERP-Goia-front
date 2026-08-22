import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'COMPET — Gestão de Camisaria',
  description: 'SaaS de gestão operacional para empresas de camisaria e confecção',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground scrollbar-thin">
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton theme="dark" />
        </Providers>
      </body>
    </html>
  )
}
