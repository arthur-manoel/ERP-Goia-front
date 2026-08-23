'use client'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import { Shield } from 'lucide-react'
import { useEntity } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'

export default function AuditoriaPage() {
  const {user}=useAuth();const{data:auditoria}=useEntity('auditoria',user?.empresaId)
  const columns = [
    { key: 'data', label: 'Data', cellClass: 'text-xs' },
    { key: 'usuario', label: 'Usuário', render: (r) => <div><div className="font-medium text-sm">{r.usuario}</div><div className="text-[11px] text-muted-foreground">{r.setor}</div></div> },
    { key: 'modulo', label: 'Módulo' },
    { key: 'acao', label: 'Ação' },
    { key: 'registro', label: 'Registro', render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.registro}</span> },
    { key: 'ip', label: 'IP', cellClass: 'text-xs text-muted-foreground' },
  ]
  return (
    <div>
      <PageHeader title="Auditoria" description="Histórico completo das ações realizadas na plataforma." icon={Shield} />
      <DataTable data={auditoria} columns={columns} searchKeys={['usuario','modulo','acao','registro']} />
    </div>
  )
}
