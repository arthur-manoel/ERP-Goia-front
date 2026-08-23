'use client'
// Store client-side de empresas: mantém o estado em memória + localStorage
// para que Admin Geral realmente crie/edite/desative/exclua empresas.

import { createContext, useContext, useEffect, useState } from 'react'

const EmpresasContext = createContext(null)
export function EmpresasProvider({ children }) {
  const [empresas, setEmpresas] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/empresas').then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setEmpresas(data)
    }).catch(error => console.error('Falha ao carregar empresas:', error)).finally(() => setLoaded(true))
  }, [])

  const create = async (data) => {
    const response = await fetch('/api/empresas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const nova = await response.json()
    if (!response.ok) throw new Error(nova.error)
    setEmpresas(prev => [nova, ...prev])
    return nova
  }
  const update = async (id, data) => {
    const atual = empresas.find(e => String(e.id) === String(id))
    if (!atual) throw new Error('Empresa não encontrada.')
    const completo = { ...atual, ...data, id }
    const response = await fetch('/api/empresas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(completo) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setEmpresas(prev => prev.map(e => String(e.id) === String(id) ? completo : e))
    return result
  }
  const remove = async (id) => {
    const response = await fetch(`/api/empresas?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!response.ok) { const body = await response.json(); throw new Error(body.error) }
    setEmpresas(prev => prev.filter(e => String(e.id) !== String(id)))
  }
  const setStatus = async (id, status) => update(id, { ...get(id), status })
  const get = (id) => empresas.find(e => String(e.id) === String(id))
  const reset = () => window.location.reload()

  return (
    <EmpresasContext.Provider value={{ empresas, loaded, create, update, remove, setStatus, get, reset }}>
      {children}
    </EmpresasContext.Provider>
  )
}

export const useEmpresas = () => {
  const ctx = useContext(EmpresasContext)
  if (!ctx) throw new Error('useEmpresas precisa de <EmpresasProvider>')
  return ctx
}
