import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { createAccessToken, passwordMatches, profileFromCargo } from '@/lib/auth-server'

const cleanCnpj = (value = '') => value.replace(/\D/g, '')

export async function POST(request) {
  try {
    const { email = '', senha = '', cnpj = '' } = await request.json()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCnpj = cleanCnpj(cnpj)
    const isGeneralAdmin = normalizedEmail === process.env.ADMIN_EMAIL?.trim().toLowerCase()

    if (!normalizedEmail || !senha) {
      return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
    }

    if (isGeneralAdmin && !normalizedCnpj) {
      if (senha !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
      }
      const user = {
        id: 'admin-geral', nome: 'Castro', email: normalizedEmail,
        perfil: 'admin_geral', cargo: 'Administrador',
        empresaId: null, empresaNome: null, vinculoId: null,
      }
      const token = await createAccessToken(user)
      const response = NextResponse.json({ user: { ...user, token } })
      response.cookies.set('goiabd-token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 8, path: '/' })
      return response
    }

    if (normalizedCnpj.length !== 14) {
      return NextResponse.json({ error: 'Informe um CNPJ válido para acessar uma empresa.' }, { status: 400 })
    }

    const [rows] = await getDb().execute(
      `SELECT u.id, u.nome, u.email, u.senha, u.status AS usuario_status,
              ue.id AS vinculo_id, ue.id_setor, ue.status AS vinculo_status,
              e.id AS empresa_id, e.nome_fantasia, e.status AS empresa_status,
              c.nome AS cargo, s.nome AS setor
         FROM usuarios u
         JOIN usuario_empresa ue ON ue.id_usuario = u.id
         JOIN empresas e ON e.id = ue.id_empresa
         JOIN cargos c ON c.id = ue.id_cargo AND c.id_empresa = e.id
         LEFT JOIN setores s ON s.id = ue.id_setor
        WHERE LOWER(u.email) = ?
          AND REPLACE(REPLACE(REPLACE(REPLACE(e.cnpj, '.', ''), '/', ''), '-', ''), ' ', '') = ?
        LIMIT 1`,
      [normalizedEmail, normalizedCnpj]
    )

    const account = rows[0]
    if (!account || !(await passwordMatches(senha, account.senha))) {
      return NextResponse.json({ error: 'E-mail, senha ou CNPJ inválidos.' }, { status: 401 })
    }
    if (account.usuario_status !== 'ATIVO' || account.vinculo_status !== 'ATIVO' || account.empresa_status !== 'ATIVA') {
      return NextResponse.json({ error: 'Usuário, vínculo ou empresa está inativo.' }, { status: 403 })
    }

    const user = {
      id: String(account.id),
      nome: account.nome,
      email: account.email,
      perfil: profileFromCargo(account.cargo),
      cargo: account.cargo,
      empresaId: String(account.empresa_id),
      empresaNome: account.nome_fantasia,
      vinculoId: String(account.vinculo_id),
      setorId: account.id_setor ? String(account.id_setor) : null,
      setor: account.setor || null,
    }
    if (user.perfil === 'usuario') {
      const [sectorRows] = account.id_setor
        ? await getDb().execute('SELECT recurso FROM permissoes_setor WHERE id_setor=?', [account.id_setor])
        : [[]]
      const sectorPerms = sectorRows.map(row => row.recurso)
      const [individualRows] = await getDb().execute('SELECT recurso,pode_ler FROM permissoes_usuario WHERE id_usuario_empresa=?', [account.vinculo_id])
      const individualAllowed = individualRows.filter(row => row.pode_ler).map(row => row.recurso)
      user.permissoes = individualRows.length ? sectorPerms.filter(p => individualAllowed.includes(p)) : sectorPerms
      user.permissoesSetor = sectorPerms
    }
    const token = await createAccessToken(user)
    const response = NextResponse.json({ user: { ...user, token } })
    response.cookies.set('goiabd-token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 8, path: '/' })
    return response
  } catch (error) {
    console.error('Falha no login:', error)
    return NextResponse.json({ error: 'Não foi possível acessar o banco de dados.' }, { status: 500 })
  }
}
