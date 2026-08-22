import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'

const statusDb = value => String(value || 'ATIVA').toUpperCase()

export async function GET() {
  try {
    const [rows] = await getDb().query(`
      SELECT e.id, e.razao_social AS razaoSocial, e.nome_fantasia AS nomeFantasia,
             e.cnpj, e.inscricao_estadual AS inscricaoEstadual, e.email, e.telefone,
             CONCAT_WS(', ', e.endereco, e.numero, e.bairro, e.cidade, e.estado) AS endereco,
             e.logo_url AS logo, e.cor_tema AS corPrimaria, LOWER(e.status) AS status,
             DATE(e.data_cadastro) AS cadastradaEm,
             (SELECT COUNT(*) FROM usuario_empresa ue WHERE ue.id_empresa = e.id) AS usuarios
        FROM empresas e ORDER BY e.data_cadastro DESC`)
    return NextResponse.json(rows.map(row => ({ ...row, id: String(row.id) })))
  } catch (error) {
    console.error('Erro ao listar empresas:', error)
    return NextResponse.json({ error: 'Não foi possível carregar as empresas.' }, { status: 500 })
  }
}

export async function POST(request) {
  const connection = await getDb().getConnection()
  try {
    const body = await request.json()
    await connection.beginTransaction()
    const [result] = await connection.execute(
      `INSERT INTO empresas (razao_social,nome_fantasia,cnpj,email,telefone,endereco,logo_url,cor_tema,status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [body.razaoSocial, body.nomeFantasia, body.cnpj, body.email || null, body.telefone || null,
       body.endereco || null, body.logo || null, body.corPrimaria || '#22c55e', statusDb(body.status)]
    )
    const empresaId = result.insertId
    const [cargo] = await connection.execute(
      `INSERT INTO cargos (id_empresa,nome,descricao,status) VALUES (?,'Administrador da empresa','Acesso administrativo da empresa','ATIVO')`,
      [empresaId]
    )
    const email = body.adminEmail.trim().toLowerCase()
    const [existing] = await connection.execute('SELECT id FROM usuarios WHERE LOWER(email)=? LIMIT 1', [email])
    let usuarioId = existing[0]?.id
    if (!usuarioId) {
      const hash = await bcrypt.hash(body.adminSenha, 12)
      const [userResult] = await connection.execute(
        'INSERT INTO usuarios (nome,email,senha,nivel_acesso,status) VALUES (?,?,?,?,?)',
        [body.adminNome, email, hash, 'ADMIN', 'ATIVO']
      )
      usuarioId = userResult.insertId
    }
    await connection.execute(
      'INSERT INTO usuario_empresa (id_usuario,id_empresa,id_cargo,nivel_acesso,status) VALUES (?,?,?,?,?)',
      [usuarioId, empresaId, cargo.insertId, 'EMPRESA', 'ATIVO']
    )
    await connection.commit()
    return NextResponse.json({ id: String(empresaId), ...body, status: String(body.status || 'ativa').toLowerCase(), usuarios: 1 }, { status: 201 })
  } catch (error) {
    await connection.rollback()
    console.error('Erro ao criar empresa:', error)
    const duplicate = error.code === 'ER_DUP_ENTRY'
    return NextResponse.json({ error: duplicate ? 'CNPJ ou vínculo já cadastrado.' : 'Não foi possível cadastrar a empresa.' }, { status: duplicate ? 409 : 500 })
  } finally { connection.release() }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'Empresa inválida.' }, { status: 400 })
    await getDb().execute(
      `UPDATE empresas SET razao_social=?,nome_fantasia=?,cnpj=?,email=?,telefone=?,endereco=?,logo_url=?,cor_tema=?,status=? WHERE id=?`,
      [body.razaoSocial, body.nomeFantasia, body.cnpj, body.email || null, body.telefone || null,
       body.endereco || null, body.logo || null, body.corPrimaria || '#22c55e', statusDb(body.status), body.id]
    )
    return NextResponse.json({ ...body, id: String(body.id) })
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
    return NextResponse.json({ error: 'Não foi possível atualizar a empresa.' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Empresa inválida.' }, { status: 400 })
    await getDb().execute('DELETE FROM empresas WHERE id=?', [id])
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Erro ao excluir empresa:', error)
    return NextResponse.json({ error: 'A empresa possui registros que impedem a exclusão.' }, { status: 409 })
  }
}
