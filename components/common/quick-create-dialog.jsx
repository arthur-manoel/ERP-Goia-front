'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Check, Plus } from 'lucide-react'

// Botão + Dialog genérico de criação para qualquer entidade CRUD.
// fields: [{ name, label, type: 'text'|'email'|'number'|'currency'|'textarea'|'select'|'color'|'switch'|'password', options?, required? }]
export default function QuickCreateDialog({ label = 'Novo cadastro', fields, onCreate, defaults = {}, buttonClass = 'company-primary-bg text-primary-foreground hover:opacity-90' }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(defaults)
  const [errors, setErrors] = useState({})

  const reset = () => { setF(defaults); setErrors({}) }
  const upd = (k, v) => setF(s => ({ ...s, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    for (const fld of fields.filter(field => !field.showWhen || field.showWhen(f))) {
      const automatico = fld.type === 'uniqueCode' && f[`${fld.name}Automatico`] !== false
      if (fld.required && !automatico && (!f[fld.name] || (Array.isArray(f[fld.name]) && f[fld.name].length === 0))) errs[fld.name] = 'Obrigatório'
    }
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      await onCreate(f)
      toast.success(`${label} realizado!`)
      setOpen(false); reset()
    } catch (error) { toast.error(error.message || 'Não foi possível salvar.') }
  }

  return (
    <>
      <Button onClick={() => { reset(); setOpen(true) }} className={`gap-2 ${buttonClass}`}><Plus className="h-4 w-4" />{label}</Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{label}</DialogTitle><DialogDescription>Preencha os campos abaixo.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-3 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin" autoComplete="off">
            {fields.filter(fld => !fld.showWhen || fld.showWhen(f)).map(fld => (
              <div key={fld.name} className="space-y-1.5">
                <Label>{fld.label}{fld.required && <span className="text-red-400 ml-1">*</span>}</Label>
                {fld.type === 'uniqueCode'
                  ? <div className="space-y-2 rounded-md border border-border p-3">
                      <label className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={f[`${fld.name}Automatico`] !== false} onCheckedChange={v => { upd(`${fld.name}Automatico`, Boolean(v)); if (v) upd(fld.name, '') }} />Gerar automaticamente</label>
                      {f[`${fld.name}Automatico`] === false && <Input value={f[fld.name] || ''} onChange={e => upd(fld.name, e.target.value)} placeholder={fld.placeholder} autoComplete="off" />}
                      {f[`${fld.name}Automatico`] !== false && <p className="text-xs text-muted-foreground">O próximo código automático será reservado ao salvar.</p>}
                    </div>
                  : fld.type === 'recipe'
                    ? <div className="space-y-2 rounded-md border border-border p-3">
                        {(f[fld.name] || []).map((row, index) => <div key={index} className="grid grid-cols-[1fr_110px_36px] gap-2">
                          <Select value={String(row.produtoId || '')} onValueChange={v => upd(fld.name, (f[fld.name] || []).map((x,i) => i === index ? {...x, produtoId:v} : x))}><SelectTrigger><SelectValue placeholder="Matéria-prima" /></SelectTrigger><SelectContent>{(fld.options || []).map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent></Select>
                          <Input type="number" min="0.0001" step="0.0001" value={row.quantidade || ''} onChange={e => upd(fld.name, (f[fld.name] || []).map((x,i) => i === index ? {...x, quantidade:e.target.value} : x))} placeholder="Qtd./un." />
                          <Button type="button" variant="ghost" onClick={() => upd(fld.name, (f[fld.name] || []).filter((_,i) => i !== index))}>×</Button>
                        </div>)}
                        <Button type="button" variant="outline" size="sm" onClick={() => upd(fld.name, [...(f[fld.name] || []), { produtoId:'', quantidade:'1' }])}>Adicionar matéria-prima</Button>
                      </div>
                  : fld.type === 'currency'
                  ? <CurrencyInput value={f[fld.name] ?? ''} onChange={e => upd(fld.name, e.target.value)} placeholder={fld.placeholder || '0,00'} autoComplete="off" />
                  : fld.type === 'textarea'
                  ? <Textarea rows={fld.rows || 2} value={f[fld.name] || ''} onChange={e => upd(fld.name, e.target.value)} placeholder={fld.placeholder} />
                  : fld.type === 'select'
                    ? <Select value={f[fld.name] || ''} onValueChange={(v) => upd(fld.name, v)}>
                        <SelectTrigger><SelectValue placeholder={fld.placeholder || 'Selecione…'} /></SelectTrigger>
                        <SelectContent>{(fld.options || []).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    : fld.type === 'multiselect'
                      ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-border p-3">
                          {(fld.options || []).length === 0 && <p className="col-span-full text-xs text-muted-foreground">Nenhuma opção cadastrada.</p>}
                          {(fld.options || []).map(o => {
                            const value = String(o.value)
                            const current = Array.isArray(f[fld.name]) ? f[fld.name].map(String) : []
                            const selected = current.includes(value)
                            return <button key={value} type="button" aria-pressed={selected} onClick={() => upd(fld.name, selected ? current.filter(v => v !== value) : [...current, value])} className={`flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${selected ? 'company-primary-bg border-transparent text-primary-foreground' : 'border-border bg-background hover:bg-secondary'}`}><span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-current' : 'border-muted-foreground'}`}>{selected && <Check className="h-3 w-3" />}</span>{o.label}</button>
                          })}
                        </div>
                    : fld.type === 'switch'
                      ? <div className="flex items-center gap-3 h-10 rounded-md border border-border bg-secondary/40 px-3"><Switch checked={f[fld.name] ?? true} onCheckedChange={(v) => upd(fld.name, v)} /><span className="text-sm">{(f[fld.name] ?? true) ? 'Ativo' : 'Inativo'}</span></div>
                      : fld.type === 'color'
                        ? <div className="flex items-center gap-2"><input type="color" value={f[fld.name] || '#22c55e'} onChange={e => upd(fld.name, e.target.value)} className="h-10 w-14 rounded-md border border-border bg-transparent cursor-pointer" /><Input value={f[fld.name] || ''} onChange={e => upd(fld.name, e.target.value)} className="font-mono text-xs" /></div>
                        : <Input type={fld.type || 'text'} value={f[fld.name] || ''} onChange={e => upd(fld.name, e.target.value)} placeholder={fld.placeholder} autoComplete="off" />}
                {errors[fld.name] && <p className="text-xs text-red-400">{errors[fld.name]}</p>}
                {fld.hint && <p className="text-[11px] text-muted-foreground">{fld.hint}</p>}
              </div>
            ))}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="company-primary-bg text-primary-foreground hover:opacity-90">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
