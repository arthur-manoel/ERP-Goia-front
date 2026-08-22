// Camada de serviços tipada. Cada função mantém a mesma assinatura
// independentemente de estar usando mocks ou o backend real.
// Basta setar NEXT_PUBLIC_API_URL para trocar de fonte.

import { api } from './client'
import * as mock from '@/lib/mock-data'

const delay = (ms = 250) => new Promise(r => setTimeout(r, ms))
const useApi = () => api.isConfigured()

// Escopa dados por empresa a partir da sessão atual (mock).
function currentEmpresaId() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem('goiabd-session') || 'null')?.empresaId } catch { return null }
}
const scoped = (arr) => arr // Em produção o backend fará o filtro; nos mocks tudo pertence à empresa emp-1.

export const EmpresasService = {
  list: async () => useApi() ? api.get('/empresas') : (await delay(), mock.empresas),
  get:  async (id) => useApi() ? api.get(`/empresas/${id}`) : mock.empresas.find(e => e.id === id),
  create: async (data) => useApi() ? api.post('/empresas', data) : (await delay(), { id: `emp-${Date.now()}`, ...data }),
  update: async (id, data) => useApi() ? api.put(`/empresas/${id}`, data) : (await delay(), { id, ...data }),
  desativar: async (id) => useApi() ? api.patch(`/empresas/${id}/desativar`, {}) : (await delay(), { id, status: 'inativa' }),
  reativar:  async (id) => useApi() ? api.patch(`/empresas/${id}/reativar`, {})  : (await delay(), { id, status: 'ativa' }),
  remove: async (id) => useApi() ? api.del(`/empresas/${id}`) : (await delay(), { id }),
  metrics: async () => useApi() ? api.get('/empresas/metrics') : ({
    total: mock.empresas.length,
    ativas: mock.empresas.filter(e => e.status === 'ativa').length,
    inativas: mock.empresas.filter(e => e.status !== 'ativa').length,
    noMes: mock.empresas.filter(e => e.cadastradaEm.startsWith('2025-06')).length,
    usuarios: mock.empresas.reduce((s, e) => s + e.usuarios, 0),
  }),
}

const crud = (path, data) => ({
  list:   async () => useApi() ? api.get(path) : (await delay(), scoped(data)),
  get:    async (id) => useApi() ? api.get(`${path}/${id}`) : data.find(x => x.id === id),
  create: async (payload) => useApi() ? api.post(path, payload) : (await delay(), { id: crypto.randomUUID(), ...payload, empresaId: currentEmpresaId() }),
  update: async (id, payload) => useApi() ? api.put(`${path}/${id}`, payload) : (await delay(), { id, ...payload }),
  remove: async (id) => useApi() ? api.del(`${path}/${id}`) : (await delay(), { id }),
})

export const ProdutosService     = crud('/produtos', mock.produtos)
export const CategoriasService   = crud('/categorias', mock.categorias)
export const CoresService        = crud('/cores', mock.cores)
export const ClientesService     = crud('/clientes', mock.clientes)
export const FornecedoresService = crud('/fornecedores', mock.fornecedores)
export const SetoresService      = crud('/setores', mock.setores)
export const UsuariosService     = crud('/usuarios', mock.usuarios)
export const NotasFiscaisService = { ...crud('/notas-fiscais', mock.notasFiscais),
  receber: async (id) => useApi() ? api.patch(`/notas-fiscais/${id}/receber`, {}) : (await delay(), { id, status: 'recebida' }),
}
export const OrdensProducaoService = { ...crud('/ordens-producao', mock.ordensProducao),
  reservar: async (id) => useApi() ? api.patch(`/ordens-producao/${id}/reservar`, {}) : (await delay(), { id }),
  consumir: async (id) => useApi() ? api.patch(`/ordens-producao/${id}/consumir`, {}) : (await delay(), { id }),
  concluir: async (id) => useApi() ? api.patch(`/ordens-producao/${id}/concluir`, {}) : (await delay(), { id, status: 'concluida' }),
}
export const VendasService = { ...crud('/vendas', mock.vendas),
  entregar: async (id) => useApi() ? api.patch(`/vendas/${id}/entregar`, {}) : (await delay(), { id, status: 'entregue' }),
}
export const EstoqueService = { list: async () => useApi() ? api.get('/estoque') : (await delay(), mock.estoquePorSetor) }
export const KardexService  = { list: async (params) => useApi() ? api.get('/kardex', { params }) : (await delay(), mock.kardex) }
export const AuditoriaService = { list: async () => useApi() ? api.get('/auditoria') : (await delay(), mock.auditoria) }
export const RequisicoesService  = crud('/requisicoes-compra', mock.requisicoes)
export const PedidosCompraService = crud('/pedidos-compra', mock.pedidosCompra)
export const DashboardService = {
  metrics: async () => useApi() ? api.get('/dashboard/metrics') : (await delay(), {
    faturamento: 56300, vendas: 32, opAbertas: 3, nfPendentes: 2, valorEstoque: 26815, abaixoMinimo: 3,
  }),
  faturamentoMensal: async () => useApi() ? api.get('/dashboard/faturamento') : (await delay(), mock.faturamentoMensal),
  produtosMaisVendidos: async () => useApi() ? api.get('/dashboard/produtos-mais-vendidos') : (await delay(), mock.produtosMaisVendidos),
  distribuicaoEstoque: async () => useApi() ? api.get('/dashboard/distribuicao-estoque') : (await delay(), mock.distribuicaoEstoque),
}

export const AuthService = {
  login: async ({ email, password, mode }) => useApi() ? api.post('/auth/login', { email, password, mode }) : (await delay(), { ok: true }),
  me:    async () => useApi() ? api.get('/auth/me') : ({ ok: true }),
  logout:async () => useApi() ? api.post('/auth/logout', {}) : ({ ok: true }),
}
