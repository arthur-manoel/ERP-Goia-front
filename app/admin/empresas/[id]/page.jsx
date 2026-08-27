'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/common/page-header'
import StatusBadge from '@/components/common/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEmpresas } from '@/lib/empresas-store'
import { formatDate } from '@/lib/mock-data'
import { Building2, Pencil, Ban, RefreshCw, Trash2, Mail, Phone, MapPin, Calendar, Users, Hash } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function DetalheEmpresa() {
  const { id } = useParams()
  const router = useRouter()
  const { get, setStatus, remove, loaded } = useEmpresas()
  const [askToggle, setAskToggle] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  if (!loaded) return null
  const e = get(id)
  if (!e) {
    return (
      <div>
        <PageHeader title="Empresa não encontrada" description="O registro pode ter sido removido." icon={Building2} />
        <Link href="/admin/empresas"><Button variant="outline">Voltar</Button></Link>
      </div>
    )
  }

  const expected = `EXCLUIR ${e.cnpj}`

  return (
    <div>
      <PageHeader title={e.nomeFantasia} description={e.razaoSocial} icon={Building2}>
        <Link href="/admin/empresas"><Button variant="outline">Voltar</Button></Link>
        <Link href={`/admin/empresas/${e.id}/editar`}><Button variant="outline" className="gap-2"><Pencil className="h-3.5 w-3.5" />Editar</Button></Link>
        <Button variant="outline" className="gap-2" onClick={() => setAskToggle(true)}>
          {e.status === 'ativa' ? <><Ban className="h-3.5 w-3.5" />Desativar</> : <><RefreshCw className="h-3.5 w-3.5" />Reativar</>}
        </Button>
        <Button variant="outline" className="gap-2 text-red-400 border-red-500/40 hover:bg-red-500/10" onClick={() => setAskDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" />Excluir
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-14 w-14 rounded-xl company-primary-bg grid place-items-center text-lg font-semibold text-primary-foreground overflow-hidden">
              {e.logo ? <img src={e.logo} alt="logo" className="h-full w-full object-cover" /> : e.nomeFantasia.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{e.nomeFantasia}</CardTitle>
              <CardDescription>{e.razaoSocial}</CardDescription>
            </div>
            <div className="ml-auto"><StatusBadge status={e.status} /></div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3"><Hash className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-[11px] text-muted-foreground uppercase">CNPJ</div><div className="font-mono">{e.cnpj}</div></div></div>
            <div className="flex items-start gap-3"><Mail className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-[11px] text-muted-foreground uppercase">E-mail</div><div>{e.email}</div></div></div>
            <div className="flex items-start gap-3"><Phone className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-[11px] text-muted-foreground uppercase">Telefone</div><div>{e.telefone || '—'}</div></div></div>
            <div className="flex items-start gap-3"><Calendar className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-[11px] text-muted-foreground uppercase">Cadastrada em</div><div>{formatDate(e.cadastradaEm)}</div></div></div>
            <div className="md:col-span-2 flex items-start gap-3"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-[11px] text-muted-foreground uppercase">Endereço</div><div>{e.endereco || '—'}</div></div></div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Uso da plataforma</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />Usuários</span>
                <span className="font-semibold">{e.usuarios ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={e.status} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Identidade visual</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { l: 'Primária', v: e.corPrimaria },
                { l: 'Secundária', v: e.corSecundaria },
                { l: 'Destaque', v: e.corDestaque },
              ].map(c => (
                <div key={c.l} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.l}</span>
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded border border-border" style={{ background: `hsl(${c.v})` }} />
                    <span className="font-mono text-xs text-muted-foreground">{c.v}</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal ativar/desativar */}
      <Dialog open={askToggle} onOpenChange={setAskToggle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{e.status === 'ativa' ? 'Desativar empresa' : 'Reativar empresa'}</DialogTitle>
            <DialogDescription>
              {e.status === 'ativa'
                ? 'Usuários, sessões e operações ficarão indisponíveis até a reativação.'
                : 'A empresa poderá acessar a plataforma normalmente após a reativação.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskToggle(false)}>Cancelar</Button>
            <Button onClick={() => {
              const proximo = e.status === 'ativa' ? 'inativa' : 'ativa'
              setStatus(e.id, proximo)
              toast.success(`${e.nomeFantasia} ${proximo === 'inativa' ? 'desativada' : 'reativada'}.`)
              setAskToggle(false)
            }} className="company-primary-bg text-primary-foreground hover:opacity-90">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal excluir */}
      <Dialog open={askDelete} onOpenChange={setAskDelete}>
        <DialogContent className="border-red-500/40">
          <DialogHeader>
            <DialogTitle className="text-red-400">Excluir empresa</DialogTitle>
            <DialogDescription>
              Ação irreversível. Todos os dados vinculados a <b>{e.nomeFantasia}</b> ({e.cnpj}) serão removidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Digite para confirmar: <span className="font-mono text-red-400">{expected}</span></Label>
            <Input value={confirmText} onChange={(ev) => setConfirmText(ev.target.value)} className="font-mono" placeholder={expected} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskDelete(false)}>Cancelar</Button>
            <Button disabled={confirmText !== expected}
              onClick={async () => { try { await remove(e.id); toast.success(`${e.nomeFantasia} excluída.`); router.push('/admin/empresas') } catch (error) { toast.error(error.message || 'Esta empresa possui registros vinculados e não pode ser excluída.') } }}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-40">
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
