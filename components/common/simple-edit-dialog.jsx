'use client'
import { useEffect,useState } from 'react'
import { Dialog,DialogContent,DialogFooter,DialogHeader,DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Check } from 'lucide-react'
import { formatField } from '@/lib/field-format'
export default function SimpleEditDialog({item,title='Editar',fields,onClose,onSave}){
 const[form,setForm]=useState(null);const[saving,setSaving]=useState(false);useEffect(()=>setForm(item?{...item}:null),[item]);if(!form)return null
 const set=(k,v)=>setForm(x=>({...x,[k]:v}));const submit=async e=>{e.preventDefault();setSaving(true);try{await onSave(form)}finally{setSaving(false)}}
 return <Dialog open={Boolean(item)} onOpenChange={o=>!o&&onClose()}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">{fields.map(f=><div key={f.name} className="space-y-1.5"><Label>{f.label}</Label>{f.type==='textarea'?<Textarea value={form[f.name]||''} onChange={e=>set(f.name,e.target.value)}/>:f.type==='select'?<Select value={String(form[f.name]||'')} onValueChange={v=>set(f.name,v)}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{(f.options||[]).map(o=><SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent></Select>:f.type==='switch'?<div className="flex items-center gap-3 rounded-md border p-3"><Switch checked={form[f.name]==='ativo'||form[f.name]===true} onCheckedChange={v=>set(f.name,v?'ativo':'inativo')}/><span className="text-sm">{form[f.name]==='ativo'||form[f.name]===true?'Ativo':'Inativo'}</span></div>:f.type==='multiselect'?<div className="grid grid-cols-2 gap-2 rounded-md border p-3">{(f.options||[]).map(o=>{const values=(form[f.name]||[]).map(String),active=values.includes(String(o.value));return <button key={o.value} type="button" onClick={()=>set(f.name,active?values.filter(x=>x!==String(o.value)):[...values,String(o.value)])} className={`flex items-center gap-2 rounded border p-2 text-sm ${active?'company-primary-bg text-primary-foreground':'bg-background'}`}>{active&&<Check className="h-3 w-3"/>}{o.label}</button>})}</div>:<Input type={f.type||'text'} inputMode={['cnpj','cpf','documento','telefone'].some(x=>f.name.toLowerCase().includes(x))?'numeric':undefined} value={form[f.name]??''} onChange={e=>set(f.name,formatField(f.name,f.type,e.target.value))} required={f.required}/>}</div>)}<DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={saving}>{saving?'Salvando…':'Salvar alterações'}</Button></DialogFooter></form></DialogContent></Dialog>
}
