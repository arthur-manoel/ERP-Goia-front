'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Scissors, User, Shield, Boxes, Factory, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
const MAX_TRIES = 5
const LOCK_SECONDS = 30

function formatCNPJ(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 14)
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}

function LoginContent() {
  const router = useRouter()
  const { login } = useAuth()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [cnpj, setCnpj] = useState('')

  const [tries, setTries] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [lembrarPerfil, setLembrarPerfil] = useState(false)

  useEffect(() => {
    try {
      const lembrar = window.localStorage.getItem('goiabd-lembrar') === '1'
      setLembrarPerfil(lembrar)
      const rawLock = window.localStorage.getItem('goiabd-login-lock')
      if (rawLock) {
        const parsed = JSON.parse(rawLock)
        if (parsed?.until && parsed.until > Date.now()) { setTries(parsed.tries || 0); setLockUntil(parsed.until) }
        else window.localStorage.removeItem('goiabd-login-lock')
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!lockUntil) return
    const it = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(it)
  }, [lockUntil])

  const remaining = Math.max(0, Math.ceil((lockUntil - now) / 1000))
  const isLocked = lockUntil > now

  const registerFail = (msg) => {
    const next = tries + 1
    if (next >= MAX_TRIES) {
      const until = Date.now() + LOCK_SECONDS * 1000
      setLockUntil(until); setTries(next)
      window.localStorage.setItem('goiabd-login-lock', JSON.stringify({ tries: next, until }))
      setError(`Muitas tentativas. Aguarde ${LOCK_SECONDS}s.`)
    } else {
      setTries(next)
      setError(`${msg} Tentativa ${next} de ${MAX_TRIES}.`)
    }
  }

  const clearFails = () => { setTries(0); setLockUntil(0); window.localStorage.removeItem('goiabd-login-lock') }

  const submit = async (e) => {
    e.preventDefault()
    if (isLocked) return
    setError('')

    if (!email || !senha) { setError('Preencha e-mail e senha.'); return }
    const digits = cnpj.replace(/\D/g, '')
    if (digits.length !== 0 && digits.length !== 14) { setError('Informe um CNPJ válido com 14 dígitos.'); return }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, cnpj: digits }),
      })
      const data = await response.json()
      if (!response.ok) { registerFail(data.error || 'Não foi possível entrar.'); return }
      const u = login(data.user)
      clearFails(); setLoading(false)
      if (lembrarPerfil) window.localStorage.setItem('goiabd-lembrar', '1')
      else window.localStorage.removeItem('goiabd-lembrar')
      toast.success(`Bem-vindo(a), ${u.nome.split(' ')[0]}!`)
      window.location.href = u.perfil === 'admin_geral' ? '/admin/empresas' : '/dashboard'
    } catch {
      registerFail('Não foi possível conectar ao servidor.');
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col justify-center px-6 py-10 md:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl company-primary-bg grid place-items-center shadow"><Scissors className="h-5 w-5 text-primary-foreground" /></div>
            <div><div className="text-lg font-semibold tracking-tight">COMPET</div><div className="text-[11px] text-muted-foreground">Gestão para camisarias</div></div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">Gestão completa para sua camisaria</h1>
          <p className="text-sm text-muted-foreground mt-2">Estoque, produção, vendas e auditoria em um só lugar.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" autoComplete="off">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" className="bg-secondary/40" required disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input id="senha" type={show ? 'text' : 'password'} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••" className="bg-secondary/40 pr-10" required disabled={isLocked} />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={isLocked}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" inputMode="numeric" autoComplete="off" value={cnpj} onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00" className="bg-secondary/40 font-mono" disabled={isLocked} />
                <p className="text-[11px] text-muted-foreground">Informe o CNPJ quando sua conta estiver vinculada a uma empresa.</p>
            </div>

            {isLocked && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-xs px-3 py-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <div><div className="font-medium">Login temporariamente bloqueado.</div><div className="opacity-80">Aguarde <span className="font-mono">{remaining}s</span>.</div></div>
              </div>
            )}
            {error && !isLocked && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-xs px-3 py-2">{error}</div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={lembrarPerfil} onChange={(e) => setLembrarPerfil(e.target.checked)} className="h-3.5 w-3.5 rounded border-border bg-secondary" /> Manter conectado
              </label>
              <a href="#" className="company-primary-text hover:underline">Esqueci minha senha</a>
            </div>

            <Button type="submit" disabled={loading || isLocked} className="w-full company-primary-bg text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {isLocked ? `Aguarde ${remaining}s…` : loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando…</> : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex relative overflow-hidden border-l border-border bg-gradient-to-br from-[hsl(var(--company-primary)/0.15)] via-background to-background">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(var(--company-primary)/0.4), transparent 40%), radial-gradient(circle at 80% 60%, hsl(var(--company-accent)/0.3), transparent 40%)' }} />
        <div className="relative z-10 m-auto max-w-md p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full company-primary-bg" /> Plataforma para confecção
          </div>
          <h2 className="mt-5 text-3xl font-semibold leading-tight">Do corte à expedição em um fluxo só</h2>
          <p className="mt-3 text-sm text-muted-foreground">Multiempresa, multiusuário e multisetor.</p>
          <div className="mt-8 grid grid-cols-1 gap-3">
            {[
              { icon: Boxes, title: 'Controle de estoque', desc: 'Por setor com kardex completo' },
              { icon: Factory, title: 'Produção integrada', desc: 'Ficha técnica, reserva e consumo' },
              { icon: Shield, title: 'Auditoria', desc: 'Registro de cada ação importante' },
              { icon: User, title: 'Gestão por setores', desc: 'Permissões finas por perfil' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-4">
                <div className="h-9 w-9 rounded-md company-primary-bg grid place-items-center shrink-0"><f.icon className="h-4 w-4 text-primary-foreground" /></div>
                <div className="min-w-0"><div className="text-sm font-medium">{f.title}</div><div className="text-xs text-muted-foreground">{f.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginContent />
}
