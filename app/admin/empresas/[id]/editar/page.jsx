'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Building2, Upload, Scissors, X } from 'lucide-react'
import { toast } from 'sonner'
import { useEmpresas } from '@/lib/empresas-store'
import { fileToBase64 } from '@/lib/upload'

function formatCNPJ(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 14)
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}
function formatTel(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
}

export default function EditarEmpresa() {
  const { id } = useParams()
  const router = useRouter()
  const { get, update, loaded } = useEmpresas()
  const [f, setF] = useState(null)
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!loaded) return
    const e = get(id)
    if (e) setF({ ...e })
  }, [loaded, id, get])

  if (!f) return <div className="text-sm text-muted-foreground">Carregando…</div>

  const upd = (k, v) => setF(s => ({ ...s, [k]: v }))

  const onLogo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo muito grande (máx. 2MB).'); return }
    setUploading(true)
    try { const b64 = await fileToBase64(file); upd('logo', b64); toast.success('Logo carregada!') }
    catch { toast.error('Não foi possível ler a imagem.') }
    finally { setUploading(false) }
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!f.razaoSocial) errs.razaoSocial = 'Obrigatório'
    if (!f.nomeFantasia) errs.nomeFantasia = 'Obrigatório'
    if ((f.cnpj || '').replace(/\D/g,'').length !== 14) errs.cnpj = 'CNPJ inválido'
    if (!f.email) errs.email = 'Obrigatório'
    if (Object.keys(errs).length) { setErrors(errs); return }
    update(id, f)
    toast.success('Empresa atualizada!')
    router.push(`/admin/empresas/${id}`)
  }

  return (
    <form onSubmit={submit}>
      <PageHeader title={`Editar — ${f.nomeFantasia}`} description="Atualize os dados cadastrais da empresa." icon={Building2}>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" className="company-primary-bg text-primary-foreground hover:opacity-90">Salvar alterações</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader><CardTitle className="text-base">Dados cadastrais</CardTitle><CardDescription>Todos os campos podem ser editados.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Razão social <span className="text-red-400">*</span></Label>
              <Input value={f.razaoSocial || ''} onChange={e => upd('razaoSocial', e.target.value)} />
              {errors.razaoSocial && <p className="text-xs text-red-400">{errors.razaoSocial}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nome fantasia <span className="text-red-400">*</span></Label>
              <Input value={f.nomeFantasia || ''} onChange={e => upd('nomeFantasia', e.target.value)} />
              {errors.nomeFantasia && <p className="text-xs text-red-400">{errors.nomeFantasia}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ <span className="text-red-400">*</span></Label>
              <Input value={f.cnpj || ''} onChange={e => upd('cnpj', formatCNPJ(e.target.value))} className="font-mono" />
              {errors.cnpj && <p className="text-xs text-red-400">{errors.cnpj}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>E-mail <span className="text-red-400">*</span></Label>
              <Input type="email" value={f.email || ''} onChange={e => upd('email', e.target.value)} />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={f.telefone || ''} onChange={e => upd('telefone', formatTel(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex items-center gap-3 h-10 rounded-md border border-border bg-secondary/40 px-3">
                <Switch checked={f.status === 'ativa'} onCheckedChange={(v) => upd('status', v ? 'ativa' : 'inativa')} />
                <span className="text-sm">{f.status === 'ativa' ? 'Ativa' : 'Inativa'}</span>
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Endereço</Label>
              <Textarea rows={2} value={f.endereco || ''} onChange={e => upd('endereco', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border h-fit">
          <CardHeader><CardTitle className="text-base">Logo da empresa</CardTitle><CardDescription>Substitui a logo atual e reflete na sidebar.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="h-32 rounded-lg border border-dashed border-border grid place-items-center bg-secondary/30 overflow-hidden relative">
              {f.logo
                ? <>
                    <img src={f.logo} alt="logo" className="h-full object-contain" />
                    <button type="button" onClick={() => upd('logo', null)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 border border-border grid place-items-center hover:bg-red-500/20" title="Remover">
                      <X className="h-3 w-3" />
                    </button>
                  </>
                : <div className="text-center"><Scissors className="h-5 w-5 mx-auto text-muted-foreground" /><div className="text-xs text-muted-foreground mt-1">Sem logo</div></div>}
            </div>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border border-border bg-secondary/40 px-3 py-2 hover:bg-secondary/60">
              <Upload className="h-3.5 w-3.5" /> {uploading ? 'Enviando…' : (f.logo ? 'Trocar logo' : 'Enviar logo')}
              <input type="file" accept="image/*" onChange={onLogo} className="hidden" />
            </label>
            <div className="text-[11px] text-muted-foreground">PNG ou JPG até 2MB. Será salva em base64.</div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
