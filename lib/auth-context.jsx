'use client'
// Contexto de autenticação. Guarda a sessão retornada pela API + empresa escopada.
// As permissões efetivas são retornadas pelo MySQL durante o login.

import { createContext, useContext, useEffect, useState } from 'react'
import { empresas } from './mock-data'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const s = window.localStorage.getItem('goiabd-session')
      if (s) {
        const parsed = JSON.parse(s)
        setUser(parsed)
      }
    } catch {}
    setLoaded(true)
  }, [])

  const persistSession = (u) => {
    window.localStorage.setItem('goiabd-session', JSON.stringify(u))
    setUser(u)
  }

  const login = (sessionUser) => {
    const u = { ...sessionUser }
    persistSession(u)
    return u
  }

  const logout = () => {
    window.localStorage.removeItem('goiabd-session')
    setUser(null)
  }

  // Atualiza permissões de um usuário; se for o logado, reflete imediatamente na sidebar
  const setPermissions = (userId, perms) => {
    if (user && user.id === userId && user.perfil === 'usuario') {
      persistSession({ ...user, permissoes: perms })
    }
  }

  const empresa = user?.empresaId
    ? (empresas.find(e => String(e.id) === String(user.empresaId)) || { id: user.empresaId, nomeFantasia: user.empresaNome })
    : null

  const hasPerm = (perm) => {
    if (!user) return false
    if (user.perfil === 'admin_geral') return false
    if (user.perfil === 'admin_empresa') return true
    if (!perm) return true
    return (user.permissoes || []).includes(perm)
  }

  return (
    <AuthContext.Provider value={{ user, empresa, loaded, login, logout, hasPerm, setPermissions }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
