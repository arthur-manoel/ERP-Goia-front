import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const activeUser = async (connection, empresaId, usuarioId) => (await connection.execute(`SELECT id_usuario id FROM usuario_empresa
  WHERE id_empresa=? AND status='ATIVO' ORDER BY (id_usuario=?) DESC LIMIT 1`, [empresaId, usuarioId || 0]))[0][0]?.id

export async function POST(request, { params }) {
  const connection = await getDb().getConnection()
  try {
    const { id } = await params; const { empresaId, setorDestinoId, usuarioId, observacao } = await request.json()
    await connection.beginTransaction()
    const [[order]] = await connection.execute('SELECT id,id_setor FROM ordem_producao WHERE id=? AND id_empresa=? FOR UPDATE', [id, empresaId])
    if (!order) throw Object.assign(new Error('Ordem de produção inválida.'), { status: 404 })
    if (String(order.id_setor) === String(setorDestinoId)) throw Object.assign(new Error('Escolha um setor diferente do atual.'), { status: 400 })
    const [[destination]] = await connection.execute("SELECT id FROM setores WHERE id=? AND id_empresa=? AND status='ATIVO'", [setorDestinoId, empresaId])
    if (!destination) throw Object.assign(new Error('Setor de destino inválido.'), { status: 400 })
    const [[pending]] = await connection.execute("SELECT id FROM ordem_producao_movimentacao_setor WHERE id_ordem_producao=? AND status='EM_TRANSITO' LIMIT 1", [id])
    if (pending) throw Object.assign(new Error('Esta ordem já está a caminho de outro setor.'), { status: 409 })
    const userId = await activeUser(connection, empresaId, usuarioId)
    await connection.execute(`INSERT INTO ordem_producao_movimentacao_setor
      (id_ordem_producao,id_setor_origem,id_setor_destino,id_usuario_envio,status,observacao) VALUES (?,?,?,?, 'EM_TRANSITO',?)`, [id, order.id_setor, destination.id, userId, observacao || null])
    await connection.commit(); return NextResponse.json({ message: 'Ordem enviada. Status: a caminho.' })
  } catch (error) { await connection.rollback(); return NextResponse.json({ error: error.message }, { status: error.status || 500 }) }
  finally { connection.release() }
}

export async function PATCH(request, { params }) {
  const connection = await getDb().getConnection()
  try {
    const { id } = await params; const { empresaId, usuarioId } = await request.json()
    await connection.beginTransaction()
    const [[movement]] = await connection.execute(`SELECT m.id,m.id_setor_destino FROM ordem_producao_movimentacao_setor m
      JOIN ordem_producao o ON o.id=m.id_ordem_producao WHERE m.id_ordem_producao=? AND o.id_empresa=? AND m.status='EM_TRANSITO' ORDER BY m.id DESC LIMIT 1 FOR UPDATE`, [id, empresaId])
    if (!movement) throw Object.assign(new Error('Não existe movimentação a caminho para receber.'), { status: 404 })
    const userId = await activeUser(connection, empresaId, usuarioId)
    await connection.execute("UPDATE ordem_producao_movimentacao_setor SET status='ENTREGUE',id_usuario_recebimento=?,data_recebimento=NOW() WHERE id=?", [userId, movement.id])
    await connection.execute('UPDATE ordem_producao SET id_setor=? WHERE id=? AND id_empresa=?', [movement.id_setor_destino, id, empresaId])
    await connection.commit(); return NextResponse.json({ message: 'Ordem recebida no novo setor.' })
  } catch (error) { await connection.rollback(); return NextResponse.json({ error: error.message }, { status: error.status || 500 }) }
  finally { connection.release() }
}
