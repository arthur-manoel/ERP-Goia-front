'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Settings, Upload, RotateCcw, Scissors, X } from 'lucide-react'
import { empresaAtual } from '@/lib/mock-data'
import { fileToBase64 } from '@/lib/upload'
import { useEmpresas } from '@/lib/empresas-store'
import { useAuth } from '@/lib/auth-context'

// Hex ↔ HSL helpers
function hexToHsl(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let hh, s, l = (max + min) / 2
  if (max === min) { hh = 0; s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: hh = (g - b) / d + (g < b ? 6 : 0); break
      case g: hh = (b - r) / d + 2; break
      default: hh = (r - g) / d + 4
    }
    hh /= 6
  }
  return `${Math.round(hh * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}
function hslToHex(hslStr) {
  const [hStr, sStr, lStr] = hslStr.split(' ')
  const h = Number(hStr), s = Number(sStr.replace('%','')) / 100, l = Number(lStr.replace('%','')) / 100
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const DEFAULT_THEME = {
  primary: empresaAtual.corPrimaria,
  secondary: empresaAtual.corSecundaria,
  accent: empresaAtual.corDestaque,
}

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const { get, update } = useEmpresas()
  const empresa = get(user?.empresaId)
  const [theme, setTheme] = useState(DEFAULT_THEME)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('goiabd-theme') : null
    if (saved) setTheme(JSON.parse(saved))
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--company-primary', theme.primary)
    document.documentElement.style.setProperty('--company-secondary', theme.secondary)
    document.documentElement.style.setProperty('--company-accent', theme.accent)
  }, [theme])

  const save = () => {
    window.localStorage.setItem('goiabd-theme', JSON.stringify(theme))
    if (empresa) update(empresa.id, { corPrimaria: theme.primary, corSecundaria: theme.secondary, corDestaque: theme.accent })
    toast.success('Tema salvo! Aplicado em toda a plataforma.')
  }
  const reset = () => {
    setTheme(DEFAULT_THEME)
    window.localStorage.removeItem('goiabd-theme')
    toast.success('Tema restaurado ao padrão.')
  }

  const setColor = (k, hex) => setTheme(t => ({ ...t, [k]: hexToHsl(hex) }))

  const onLogo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo muito grande (máx. 2MB).'); return }
    try {
      const b64 = await fileToBase64(file)
      if (!empresa) throw new Error('Empresa não encontrada.')
      await update(empresa.id, { logo: b64 })
      e.target.value = ''
      toast.success('Logo atualizada!')
    } catch (error) { toast.error(error.message || 'Não foi possível carregar a imagem.') }
  }
  const removerLogo = async () => { try { if (empresa) await update(empresa.id, { logo: null }); toast.success('Logo removida.') } catch(error) { toast.error(error.message) } }

  return (
    <div>
      <PageHeader title="Configurações da Empresa" description="Identidade visual e dados da empresa." icon={Settings}>
        <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw className="h-3.5 w-3.5" />Restaurar padrão</Button>
        <Button onClick={save} className="company-primary-bg text-primary-foreground hover:opacity-90">Salvar tema</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Logo</CardTitle><CardDescription>Aparece na sidebar e cabeçalho.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="h-32 rounded-lg border border-dashed border-border grid place-items-center bg-secondary/30 overflow-hidden relative">
              {empresa?.logo
                ? <>
                    <img src={empresa.logo} alt="logo" className="h-full object-contain" />
                    <button type="button" onClick={removerLogo} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 border border-border grid place-items-center hover:bg-red-500/20" title="Remover">
                      <X className="h-3 w-3" />
                    </button>
                  </>
                : <div className="text-center"><Scissors className="h-6 w-6 mx-auto text-muted-foreground" /><div className="text-xs text-muted-foreground mt-2">Sem logo enviada</div></div>}
            </div>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border border-border bg-secondary/40 px-3 py-2 hover:bg-secondary/60">
              <Upload className="h-3.5 w-3.5" /> {empresa?.logo ? 'Trocar logo' : 'Enviar logo'}
              <input type="file" accept="image/*" onChange={onLogo} className="hidden" />
            </label>
            <div className="text-[11px] text-muted-foreground">PNG ou JPG até 2MB. Aparece na sidebar da empresa em tempo real.</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader><CardTitle className="text-base">Paleta da empresa</CardTitle><CardDescription>As cores são aplicadas em botes, gráficos e destaques.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'primary', label: 'Cor primária', hint: 'Botões principais e links ativos' },
              { key: 'secondary', label: 'Cor secundária', hint: 'Fundos sutis e badges' },
              { key: 'accent', label: 'Cor de destaque', hint: 'Dados importantes e gráficos' },
            ].map(({ key, label, hint }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={hslToHex(theme[key])} onChange={(e) => setColor(key, e.target.value)} className="h-10 w-14 rounded-md border border-border bg-transparent cursor-pointer" />
                  <Input value={hslToHex(theme[key])} onChange={(e) => setColor(key, e.target.value)} className="font-mono text-xs" />
                </div>
                <p className="text-[11px] text-muted-foreground">{hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-card border-border">
          <CardHeader><CardTitle className="text-base">Prévia ao vivo</CardTitle><CardDescription>Veja como sua paleta ficará na interface.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4 bg-background">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Botões</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="company-primary-bg text-primary-foreground hover:opacity-90">Primário</Button>
                <Button variant="outline">Secundário</Button>
                <Button style={{ background: `hsl(${theme.accent})`, color: 'hsl(160 30% 8%)' }}>Destaque</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4 bg-background">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Card métrica</div>
              <div className="mt-3">
                <div className="text-[11px] text-muted-foreground">Faturamento</div>
                <div className="text-2xl font-semibold company-primary-text">R$ 56.300</div>
                <div className="text-[11px] text-emerald-400">+10%</div>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4 bg-background">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Barra do menu</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-md company-primary-bg grid place-items-center"><Scissors className="h-4 w-4 text-primary-foreground" /></div>
                <div className="text-sm font-medium">COMPET</div>
              </div>
              <div className="mt-3 h-3 rounded-full overflow-hidden flex">
                <div className="flex-1 company-primary-bg" />
                <div className="flex-1" style={{ background: `hsl(${theme.secondary})` }} />
                <div className="flex-1 company-accent-bg" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
