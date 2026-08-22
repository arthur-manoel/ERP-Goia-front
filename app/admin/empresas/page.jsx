'use client'
import Link from 'next/link'
import { useState } from 'react'
import PageHeader from '@/components/common/page-header'
import DataTable from '@/components/common/data-table'
import StatusBadge from '@/components/common/status-badge'
import MetricCard from '@/components/common/metric-card'
import { useEmpresas } from '@/lib/empresas-store'
import { formatDate } from '@/lib/mock-data'
import { Building2, Eye, Pencil, Ban, RefreshCw, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminEmpresasPage() {
  const { empresas, setStatus, remove, loaded } = useEmpresas()
  const [confirmText, setConfirmText] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [toToggle, setToToggle] = useState(null) // { empresa, para }

  const total = empresas.length
  const ativas = empresas.filter(e => e.status === 'ativa').length
  const inativas = total - ativas
  const noMes = empresas.filter(e => (e.cadastradaEm || '').startsWith(new Date().toISOString().slice(0, 7))).length
  const usuariosTotal = empresas.reduce((s, e) => s + (e.usuarios || 0), 0)

  const columns = [
    { key: 'logo', label: '', render: (r) => <div className="h-8 w-8 rounded-md company-primary-bg grid place-items-center text-xs font-semibold text-primary-foreground">{r.nomeFantasia.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div> },
    { key: 'nomeFantasia', label: 'Empresa', render: (r) => <div><div className="font-medium text-sm">{r.nomeFantasia}</div><div className="text-[11px] text-muted-foreground">{r.razaoSocial}</div></div> },
    { key: 'cnpj', label: 'CNPJ', cellClass: 'text-xs font-mono' },
    { key: 'email', label: 'E-mail', cellClass: 'text-xs' },
    { key: 'usuarios', label: 'Usuários', cellClass: 'text-right' },
    { key: 'cadastradaEm', label: 'Cadastrada em', render: (r) => formatDate(r.cadastradaEm) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'a', label: '', cellClass: 'text-right', render: (r) => (
      <div className="flex justify-end gap-1">
        <Link href={`/admin/empresas/${r.id}`}><Button variant="ghost" size="icon" className="h-8 w-8" title="Detalhes"><Eye className="h-3.5 w-3.5" /></Button></Link>
        <Link href={`/admin/empresas/${r.id}/editar`}><Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"><Pencil className="h-3.5 w-3.5" /></Button></Link>
        {r.status === 'ativa'
          ? <Button variant="ghost" size="icon" className="h-8 w-8" title="Desativar" onClick={() => setToToggle({ empresa: r, para: 'inativa' })}><Ban className="h-3.5 w-3.5" /></Button>
          : <Button variant="ghost" size="icon" className="h-8 w-8" title="Reativar" onClick={() => setToToggle({ empresa: r, para: 'ativa' })}><RefreshCw className="h-3.5 w-3.5" /></Button>}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" title="Excluir" onClick={() => { setToDelete(r); setConfirmText('') }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ]

  const expected = toDelete ? `EXCLUIR ${toDelete.cnpj}` : ''

  return (
    <div>
      <PageHeader title="Empresas" description="Administração central da plataforma COMPET." icon={Building2} action="Nova empresa" actionHref="/admin/empresas/nova" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <MetricCard label="Total" value={total} icon={Building2} />
        <MetricCard label="Ativas" value={ativas} icon={Building2} tone="success" />
        <MetricCard label="Inativas" value={inativas} icon={Building2} tone="danger" />
        <MetricCard label="Novas no mês" value={noMes} icon={Building2} tone="accent" />
        <MetricCard label="Usuários totais" value={usuariosTotal} icon={Users} />
      </div>

      {loaded && <DataTable data={empresas} columns={columns} searchKeys={['nomeFantasia','razaoSocial','cnpj','email']} />}

      {/* Modal de ativar/desativar */}
      <Dialog open={!!toToggle} onOpenChange={(o) => !o && setToToggle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toToggle?.para === 'inativa' ? 'Desativar empresa' : 'Reativar empresa'}</DialogTitle>
            <DialogDescription>
              {toToggle?.para === 'inativa'
                ? <>Ao desativar <b>{toToggle?.empresa?.nomeFantasia}</b>, usuários, sessões e operações ficarão indisponíveis. Login será bloqueado até a reativação.</>
                : <>Ao reativar <b>{toToggle?.empresa?.nomeFantasia}</b>, os usuários poderão voltar a acessar a plataforma normalmente.</>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToToggle(null)}>Cancelar</Button>
            <Button className={toToggle?.para === 'inativa' ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'company-primary-bg text-primary-foreground hover:opacity-90'}
              onClick={() => {
                setStatus(toToggle.empresa.id, toToggle.para)
                toast.success(`${toToggle.empresa.nomeFantasia} ${toToggle.para === 'inativa' ? 'desativada' : 'reativada'}.`)
                setToToggle(null)
              }}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de exclusão */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="border-red-500/40">
          <DialogHeader>
            <DialogTitle className="text-red-400">Excluir empresa</DialogTitle>
            <DialogDescription>
              Esta ação é <b>irreversível</b>. Todos os usuários, estoque, produtos, NFs, OPs e demais dados vinculados a <b>{toDelete?.nomeFantasia}</b> ({toDelete?.cnpj}) serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Para confirmar, digite: <span className="font-mono text-red-400">{expected}</span></Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="font-mono" placeholder={expected} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button disabled={confirmText !== expected}
              onClick={() => { remove(toDelete.id); toast.success(`${toDelete.nomeFantasia} excluída.`); setToDelete(null) }}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-40">
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
