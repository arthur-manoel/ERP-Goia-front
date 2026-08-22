import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

export async function passwordMatches(candidate, stored) {
  if (!stored) return false
  if (/^\$2[aby]\$/.test(stored)) return bcrypt.compare(candidate, stored)
  // Compatibilidade temporária com cargas legadas do SQL. Novas senhas devem usar bcrypt.
  return candidate === stored
}

export function profileFromCargo(cargo = '') {
  const value = cargo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  if (value === 'administrador' || value.includes('admin geral') || value.includes('administrador geral') || value.includes('superadmin')) return 'admin_geral'
  if (value.includes('admin') || value.includes('administrador')) return 'admin_empresa'
  return 'usuario'
}

export async function createAccessToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não configurado')
  return new SignJWT({ perfil: user.perfil, empresaId: user.empresaId, vinculoId: user.vinculoId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(new TextEncoder().encode(secret))
}
