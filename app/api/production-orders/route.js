import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const statusMap = { rascunho: 'PLANEJADA', planejada: 'PLANEJADA', aberta: 'PLANEJADA', aguardando_material: 'AGUARDANDO_MATERIAL', liberada: 'LIBERADA', em_producao: 'EM_PRODUCAO', pausada: 'PAUSADA', concluida: 'CONCLUIDA', cancelada: 'CANCELADA' }

export async function POST(request) {
  const connection = await getDb().getConnection()
  try {
    const body = await request.json()
    if (!/^\d+$/.test(String(body.empresaId || '')) || (body.numeroAutomatico === false && !body.numero?.trim()) || !/^\d+$/.test(String(body.setorId || ''))) return NextResponse.json({ error: 'Número da OP e setor responsável são obrigatórios.' }, { status: 400 })
    await connection.beginTransaction()
    if (body.numeroAutomatico !== false) {
      await connection.execute(`INSERT INTO sequencias_automaticas (id_empresa,entidade,ultimo_numero) VALUES (?,'ops',LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE ultimo_numero=LAST_INSERT_ID(ultimo_numero+1)`, [body.empresaId])
      const [[sequence]] = await connection.query('SELECT LAST_INSERT_ID() numero')
      body.numero = `OP-${String(sequence.numero).padStart(6,'0')}`
    }
    const [sectors] = await connection.execute('SELECT id FROM setores WHERE id=? AND id_empresa=? AND status=\'ATIVO\'', [body.setorId, body.empresaId])
    if (!sectors[0]) throw Object.assign(new Error('Setor responsável inválido.'), { status: 400 })
    const [users] = await connection.execute('SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status=\'ATIVO\' ORDER BY (id_usuario=?) DESC LIMIT 1', [body.empresaId, body.usuarioId || 0])
    if (!users[0]) throw Object.assign(new Error('Nenhum usuário ativo encontrado.'), { status: 400 })
    const [result] = await connection.execute(`INSERT INTO ordem_producao
      (id_empresa,id_usuario,id_setor,numero,prioridade,quantidade_planejada,status,data_inicio,data_previsao)
      VALUES (?,?,?,?,?,?,?,?,?)`, [body.empresaId, users[0].id, body.setorId, body.numero.trim(), String(body.prioridade || 'NORMAL').toUpperCase(), 0, statusMap[String(body.status || '').toLowerCase()] || 'PLANEJADA', body.dataAbertura || new Date(), body.prazoConclusao || null])
    await connection.commit()
    return NextResponse.json({ id: String(result.insertId) }, { status: 201 })
  } catch (error) {
    await connection.rollback(); console.error('Erro ao criar OP:', error)
    return NextResponse.json({ error: error.code === 'ER_DUP_ENTRY' ? 'Este número de OP já existe.' : error.message }, { status: error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500) })
  } finally { connection.release() }
}
