'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useEntity } from '@/lib/data-store'
import { navGroupsEmpresa, permissoesDeTela } from '@/lib/nav'
import { toast } from 'sonner'
import { KeySquare, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function PermissoesPage() {
  const { user } = useAuth()
  const { data: usuariosEmpresa } = useEntity('usuarios', user?.empresaId)
  const usuariosComuns = usuariosEmpresa.filter(u => u.perfil === 'usuario')
  const [selectedId, setSelectedId] = useState('')
  const [perms, setPerms] = useState(new Set())
  const [sectorPerms, setSectorPerms] = useState(new Set())

  useEffect(() => {
    if (!usuariosComuns.some(u => u.id === selectedId)) setSelectedId(usuariosComuns[0]?.id || '')
  }, [usuariosComuns, selectedId])

  useEffect(() => {
    if (!selectedId || !user?.empresaId) { setPerms(new Set()); setSectorPerms(new Set()); return }
    fetch(`/api/permissions?empresaId=${user.empresaId}&userId=${selectedId}`).then(r=>r.json()).then(data=>{setPerms(new Set(data.individual||[]));setSectorPerms(new Set(data.setor||[]))}).catch(()=>{})
  }, [selectedId, user?.empresaId])

  const usuario = usuariosComuns.find(u => u.id === selectedId) || usuariosComuns[0]

  const toggle = (k) => setPerms(prev => {
    const n = new Set(prev)
    n.has(k) ? n.delete(k) : n.add(k)
    return n
  })

  const salvar = async () => {
    if (!usuario) return
    const arr = Array.from(perms)
    const response = await fetch('/api/permissions',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({empresaId:user.empresaId,userId:selectedId,permissoes:arr})})
    const body = await response.json(); if(!response.ok) return toast.error(body.error)
    setPerms(new Set(body.permissoes)); toast.success(`Permissões de ${usuario.nome} atualizadas!`)
  }

  // Simula sidebar do usuário com as permissões atuais
  const previewUser = { perfil: 'usuario', permissoes: Array.from(perms) }
  const previewNav = navGroupsEmpresa
    .map(g => ({ ...g, items: g.items.map(it => ({
      ...it,
      visible: !it.adminOnly && (it.perm ? previewUser.permissoes.includes(it.perm) : true),
    }))}))

  return (
    <div>
      <PageHeader title="Permissões de Usuários" description="Marcar/desmarcar já remove ou adiciona as telas na sidebar do usuário." icon={KeySquare}>
        <Button onClick={salvar} disabled={!usuario} className="company-primary-bg text-primary-foreground hover:opacity-90">Salvar permissões</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Selecionar usuário</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5"><Label>Usuário</Label>
                  <Select value={selectedId} onValueChange={setSelectedId} disabled={!usuariosComuns.length}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{usuariosComuns.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="rounded-md border border-border p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Setor:</span> <span className="font-medium">{usuario?.setor || '—'}</span></div>
                <div><span className="text-muted-foreground">Perfil:</span> <span className="font-medium">Usuário comum</span></div>
                <div className="truncate"><span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{usuario?.email || 'Nenhum usuário comum nesta empresa'}</span></div>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-3 text-[11px] text-muted-foreground">
                Auditoria, Configurações e Permissões são exclusivas do Admin da Empresa e não aparecem para usuários comuns.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Prévia da sidebar</CardTitle><CardDescription>O que este usuário vê agora</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {previewNav.map(g => (
                <div key={g.label}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{g.label}</div>
                  <div className="space-y-0.5">
                    {g.items.map(it => (
                      <div key={it.href} className={`flex items-center gap-2 text-xs rounded px-2 py-1 ${it.visible ? 'text-foreground' : 'text-muted-foreground/40 line-through'}`}>
                        {it.visible ? <Eye className="h-3 w-3 company-primary-text" /> : <EyeOff className="h-3 w-3" />}
                        {it.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 bg-card border-border h-fit">
          <CardHeader><CardTitle className="text-base">Permissões de acesso</CardTitle><CardDescription>Marque para liberar e desmarque para bloquear cada tela.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissoesDeTela.map(p => (
                <label key={p.chave} className="flex items-start gap-3 rounded-md border border-border p-3 hover:bg-secondary/30 cursor-pointer">
                  <Checkbox checked={perms.has(p.chave)} disabled={!sectorPerms.has(p.chave)} onCheckedChange={() => toggle(p.chave)} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{p.nome}</div>
                    <div className="text-[11px] text-muted-foreground">{sectorPerms.has(p.chave) ? 'Permitida pelo setor' : 'Bloqueada nas permissões do setor'}</div>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
