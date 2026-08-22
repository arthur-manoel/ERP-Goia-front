'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Building2, Scissors, Upload, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useEmpresas } from '@/lib/empresas-store'
import { fileToBase64 } from '@/lib/upload'

function formatCNPJ(v) { const d = (v||'').replace(/\D/g,'').slice(0,14); return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2') }
function formatTel(v) { const d=(v||'').replace(/\D/g,'').slice(0,11); return d.length<=10?d.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3').trim():d.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3').trim() }
function hexToHsl(hex){const h=(hex||'#22c55e').replace('#','');const r=parseInt(h.substring(0,2),16)/255;const g=parseInt(h.substring(2,4),16)/255;const b=parseInt(h.substring(4,6),16)/255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let hh,s,l=(max+min)/2;if(max===min){hh=0;s=0}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:hh=(g-b)/d+(g<b?6:0);break;case g:hh=(b-r)/d+2;break;default:hh=(r-g)/d+4}hh/=6}return `${Math.round(hh*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`}

const DEFAULTS = { razaoSocial: '', nomeFantasia: '', cnpj: '', email: '', telefone: '', endereco: '', status: 'ativa', logo: null, corPrimaria: '152 60% 45%', corSecundaria: '160 20% 18%', corDestaque: '43 90% 60%', adminNome: '', adminEmail: '', adminSenha: '' }

export default function NovaEmpresaPage() {
  const router = useRouter()
  const { create } = useEmpresas()
  const [f, setF] = useState(DEFAULTS)
  const [errors, setErrors] = useState({})
  const [showPwd, setShowPwd] = useState(false)
  const [uploading, setUploading] = useState(false)

  const upd = (k, v) => setF(s => ({ ...s, [k]: v }))

  const onLogo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2*1024*1024) { toast.error('Logo muito grande (máx. 2MB).'); return }
    setUploading(true)
    try { upd('logo', await fileToBase64(file)); toast.success('Logo carregada!') } catch { toast.error('Erro ao ler imagem.') }
    finally { setUploading(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!f.razaoSocial) errs.razaoSocial = 'Obrigatório'
    if (!f.nomeFantasia) errs.nomeFantasia = 'Obrigatório'
    if (f.cnpj.replace(/\D/g,'').length !== 14) errs.cnpj = 'CNPJ inválido'
    if (!f.email) errs.email = 'Obrigatório'
    if (!f.adminNome) errs.adminNome = 'Nome do administrador é obrigatório'
    if (!f.adminEmail) errs.adminEmail = 'E-mail do administrador é obrigatório'
    if (!f.adminSenha || f.adminSenha.length < 4) errs.adminSenha = 'Senha mínima de 4 caracteres'
    if (Object.keys(errs).length) { setErrors(errs); return }

    try {
      const nova = await create(f)
      toast.success(`Empresa ${nova.nomeFantasia} cadastrada com conta admin!`)
      router.push('/admin/empresas')
    } catch (error) { toast.error(error.message) }
  }

  return (
    <form onSubmit={submit} autoComplete="off">
      <PageHeader title="Nova empresa" description="Cadastre uma nova empresa e a conta de administrador dela." icon={Building2}>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" className="company-primary-bg text-primary-foreground hover:opacity-90">Salvar empresa</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader><CardTitle className="text-base">Dados cadastrais</CardTitle><CardDescription>Informações principais da empresa.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Razão social <span className="text-red-400">*</span></Label><Input value={f.razaoSocial} onChange={e => upd('razaoSocial', e.target.value)} placeholder="Nome oficial" />{errors.razaoSocial && <p className="text-xs text-red-400">{errors.razaoSocial}</p>}</div>
            <div className="space-y-1.5"><Label>Nome fantasia <span className="text-red-400">*</span></Label><Input value={f.nomeFantasia} onChange={e => upd('nomeFantasia', e.target.value)} placeholder="Marca" />{errors.nomeFantasia && <p className="text-xs text-red-400">{errors.nomeFantasia}</p>}</div>
            <div className="space-y-1.5"><Label>CNPJ <span className="text-red-400">*</span></Label><Input value={f.cnpj} onChange={e => upd('cnpj', formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" className="font-mono" />{errors.cnpj && <p className="text-xs text-red-400">{errors.cnpj}</p>}</div>
            <div className="space-y-1.5"><Label>E-mail <span className="text-red-400">*</span></Label><Input type="email" value={f.email} onChange={e => upd('email', e.target.value)} placeholder="contato@empresa.com" />{errors.email && <p className="text-xs text-red-400">{errors.email}</p>}</div>
            <div className="space-y-1.5"><Label>Telefone</Label><Input value={f.telefone} onChange={e => upd('telefone', formatTel(e.target.value))} placeholder="(00) 00000-0000" /></div>
            <div className="space-y-1.5"><Label>Status</Label><div className="flex items-center gap-3 h-10 rounded-md border border-border bg-secondary/40 px-3"><Switch checked={f.status === 'ativa'} onCheckedChange={(v) => upd('status', v ? 'ativa' : 'inativa')} /><span className="text-sm">{f.status === 'ativa' ? 'Ativa' : 'Inativa'}</span></div></div>
            <div className="md:col-span-2 space-y-1.5"><Label>Endereço</Label><Textarea rows={2} value={f.endereco} onChange={e => upd('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade/UF" /></div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Logo</CardTitle><CardDescription>Máx. 2MB.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="h-28 rounded-lg border border-dashed border-border grid place-items-center bg-secondary/30 overflow-hidden relative">
                {f.logo ? <><img src={f.logo} alt="logo" className="h-full object-contain" /><button type="button" onClick={() => upd('logo', null)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 border border-border grid place-items-center hover:bg-red-500/20"><X className="h-3 w-3" /></button></> : <div className="text-center"><Scissors className="h-5 w-5 mx-auto text-muted-foreground" /><div className="text-xs text-muted-foreground mt-1">Sem logo</div></div>}
              </div>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border border-border bg-secondary/40 px-3 py-2 hover:bg-secondary/60"><Upload className="h-3.5 w-3.5" /> {uploading ? 'Enviando…' : (f.logo ? 'Trocar' : 'Enviar')}<input type="file" accept="image/*" onChange={onLogo} className="hidden" /></label>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Identidade visual</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[{ key: 'corPrimaria', label: 'Primária', def: '#2eb877' }, { key: 'corSecundaria', label: 'Secundária', def: '#253731' }, { key: 'corDestaque', label: 'Destaque', def: '#f5c13d' }].map(c => (
                <div key={c.key} className="flex items-center gap-2"><input type="color" defaultValue={c.def} onChange={(e) => upd(c.key, hexToHsl(e.target.value))} className="h-9 w-12 rounded-md border border-border bg-transparent cursor-pointer" /><div className="text-sm flex-1">Cor {c.label}</div></div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Conta Admin da Empresa */}
        <Card className="lg:col-span-3 bg-card border-border border-l-4 border-l-[hsl(var(--company-primary))]">
          <CardHeader><CardTitle className="text-base">Conta do administrador da empresa</CardTitle><CardDescription>Esta pessoa poderá acessar o painel administrativo da empresa e criar os demais usuários.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Nome completo <span className="text-red-400">*</span></Label><Input value={f.adminNome} onChange={e => upd('adminNome', e.target.value)} placeholder="Ex: Maria Silva" autoComplete="off" />{errors.adminNome && <p className="text-xs text-red-400">{errors.adminNome}</p>}</div>
            <div className="space-y-1.5"><Label>E-mail de acesso <span className="text-red-400">*</span></Label><Input type="email" value={f.adminEmail} onChange={e => upd('adminEmail', e.target.value)} placeholder="admin@empresa.com" autoComplete="off" />{errors.adminEmail && <p className="text-xs text-red-400">{errors.adminEmail}</p>}</div>
            <div className="space-y-1.5"><Label>Senha inicial <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input type={showPwd ? 'text' : 'password'} value={f.adminSenha} onChange={e => upd('adminSenha', e.target.value)} placeholder="mínimo 4 caracteres" autoComplete="new-password" className="pr-10" />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {errors.adminSenha && <p className="text-xs text-red-400">{errors.adminSenha}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
