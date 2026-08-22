// Cliente HTTP central. Aceita base URL + token para plugar no backend real.
// Uso: import { api } from '@/lib/api/client'

function getSession() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem('goiabd-session') || 'null') } catch { return null }
}

function getBaseUrl() {
  return (typeof window !== 'undefined' && window.__COMPET_API__)
    || process.env.NEXT_PUBLIC_API_URL
    || ''
}

async function request(method, path, { body, params, headers } = {}) {
  const base = getBaseUrl()
  if (!base) throw new Error('API_URL não configurada')

  const url = new URL(base.replace(/\/$/, '') + path)
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v))

  const session = getSession()
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(session?.empresaId ? { 'X-Empresa-Id': session.empresaId } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  if (!res.ok) {
    let msg = res.statusText
    try { const j = await res.json(); msg = j.message || j.error || msg } catch {}
    throw new Error(msg)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  get:  (path, opts)        => request('GET',    path, opts),
  post: (path, body, opts)  => request('POST',   path, { ...opts, body }),
  put:  (path, body, opts)  => request('PUT',    path, { ...opts, body }),
  patch:(path, body, opts)  => request('PATCH',  path, { ...opts, body }),
  del:  (path, opts)        => request('DELETE', path, opts),
  isConfigured: () => !!getBaseUrl(),
}
