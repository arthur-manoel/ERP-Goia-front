'use client'
// Store unificado carregado pela API MySQL e sempre escopado por empresa.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as seed from './mock-data'
import { friendlyError } from './field-format'

// Sementes iniciais para cada entidade (escopadas à empresa emp-1)
const SEEDS = {
  produtos: seed.produtos.map(p => ({ ...p, empresaId: 'emp-1' })),
  categorias: seed.categorias.map(c => ({ ...c, empresaId: 'emp-1' })),
  cores: seed.cores.map(c => ({ ...c, empresaId: 'emp-1' })),
  clientes: seed.clientes.map(c => ({ ...c, empresaId: 'emp-1' })),
  fornecedores: seed.fornecedores.map(f => ({ ...f, empresaId: 'emp-1' })),
  setores: seed.setores.map(s => ({ ...s, empresaId: 'emp-1' })),
  usuarios: seed.usuarios.map(u => ({ ...u, empresaId: 'emp-1', senha: 'demo1234', setorId: u.setor === 'Estoque' ? 's1' : u.setor === 'Corte' ? 's2' : u.setor === 'Costura' ? 's3' : u.setor === 'Expedição' ? 's5' : u.setor === 'Loja' ? 's6' : u.setor === 'Compras' ? 's7' : 's8' })),
  requisicoes: seed.requisicoes.map(r => ({ ...r, empresaId: 'emp-1' })),
  pedidos: seed.pedidosCompra.map(p => ({ ...p, empresaId: 'emp-1' })),
  notas: seed.notasFiscais.map(n => ({ ...n, empresaId: 'emp-1' })),
  ops: seed.ordensProducao.map(o => ({ ...o, empresaId: 'emp-1' })),
  vendas: seed.vendas.map(v => ({ ...v, empresaId: 'emp-1' })),
  kardex: seed.kardex.map(k => ({ ...k, empresaId: 'emp-1' })),
  auditoria: seed.auditoria.map(a => ({ ...a, empresaId: 'emp-1' })),
}

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [tables, setTables] = useState(() => Object.keys(SEEDS).reduce((acc, k) => ({ ...acc, [k]: [] }), {}))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setLoaded(true) }, [])

  const setEntity = useCallback((name, updater) => {
    setTables(prev => {
      const next = { ...prev, [name]: typeof updater === 'function' ? updater(prev[name] || []) : updater }
      return next
    })
  }, [])

  return (
    <DataContext.Provider value={{ tables, loaded, setEntity }}>
      {children}
    </DataContext.Provider>
  )
}

export function useEntity(name, empresaId) {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useEntity precisa de <DataProvider>')
  const all = ctx.tables[name] || []
  const reload = useCallback(async () => {
    if (!empresaId) return
    const response = await fetch(`/api/data/${name}?empresaId=${encodeURIComponent(empresaId)}`)
    const body = await response.json()
    if (!response.ok) throw new Error(friendlyError(body.error))
    ctx.setEntity(name, body)
    return body
  }, [name, empresaId])
  useEffect(() => { reload().catch(error => console.error(`Falha ao carregar ${name}:`, error)) }, [reload])
  // Sem empresa ativa não há acesso; com empresa, nenhum registro legado/sem dono vaza para o tenant.
  const filtered = empresaId ? all.filter(x => x.empresaId === empresaId) : []

  const create = async (data) => {
    if (!empresaId && !data.empresaId) throw new Error('Empresa obrigatória para criar registros.')
    const response = await fetch(`/api/data/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, empresaId: empresaId || data.empresaId }) })
    const item = await response.json()
    if (!response.ok) throw new Error(friendlyError(item.error))
    await reload()
    return item
  }
  const belongsToTenant = (x) => Boolean(empresaId) && x.empresaId === empresaId
  const update = async (id, data) => {
    const response = await fetch(`/api/data/${name}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, id, empresaId }) })
    const result = await response.json()
    if (!response.ok) throw new Error(friendlyError(result.error))
    await reload(); return result
  }
  const remove = async (id) => {
    const response = await fetch(`/api/data/${name}?empresaId=${encodeURIComponent(empresaId)}&id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!response.ok) { const body = await response.json(); throw new Error(friendlyError(body.error)) }
    await reload()
  }
  const get = (id) => filtered.find(x => x.id === id)

  return { data: filtered, all, loaded: ctx.loaded, create, update, remove, get, reload }
}

export function useDataRaw() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataRaw precisa de <DataProvider>')
  return ctx
}
