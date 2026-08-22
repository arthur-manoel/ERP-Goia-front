import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request) {
  const connection = await getDb().getConnection()
  try {
    const { empresaId, produtoId, origemId, destinoId, quantidade, usuarioId } = await request.json()
    const qty = Number(quantidade)
    if (![empresaId, produtoId, origemId, destinoId, usuarioId].every(value => /^\d+$/.test(String(value || ''))) || !Number.isFinite(qty) || qty <= 0 || String(origemId) === String(destinoId)) {
      return NextResponse.json({ error: 'Dados da transferência são inválidos.' }, { status: 400 })
    }
    await connection.beginTransaction()
    const [locations] = await connection.execute('SELECT id FROM locais_estoque WHERE id_empresa=? AND id IN (?,?) AND status=\'ATIVO\'', [empresaId, origemId, destinoId])
    if (locations.length !== 2) throw Object.assign(new Error('Estoque de origem ou destino inválido.'), { status: 400 })
    const [sourceRows] = await connection.execute('SELECT id,quantidade,quantidade_reservada FROM estoque WHERE id_empresa=? AND id_local_estoque=? AND id_produto=? FOR UPDATE', [empresaId, origemId, produtoId])
    const source = sourceRows[0]; if (!source) throw Object.assign(new Error('O produto não possui saldo no estoque de origem.'), { status: 400 })
    const available = Number(source.quantidade) - Number(source.quantidade_reservada)
    if (available < qty) throw Object.assign(new Error(`Saldo disponível insuficiente. Disponível: ${available}.`), { status: 409 })
    const sourceBefore = Number(source.quantidade); const sourceAfter = sourceBefore - qty
    await connection.execute('UPDATE estoque SET quantidade=?,data_atualizacao=CURRENT_TIMESTAMP WHERE id=?', [sourceAfter, source.id])
    const [destinationRows] = await connection.execute('SELECT id,quantidade FROM estoque WHERE id_empresa=? AND id_local_estoque=? AND id_produto=? FOR UPDATE', [empresaId, destinoId, produtoId])
    const destination = destinationRows[0]; const destinationBefore = Number(destination?.quantidade || 0); const destinationAfter = destinationBefore + qty
    if (destination) await connection.execute('UPDATE estoque SET quantidade=?,data_atualizacao=CURRENT_TIMESTAMP WHERE id=?', [destinationAfter, destination.id])
    else await connection.execute('INSERT INTO estoque (id_empresa,id_local_estoque,id_produto,quantidade,quantidade_reservada) VALUES (?,?,?,?,0)', [empresaId, destinoId, produtoId, qty])
    const observation = `Transferência entre estoques ${origemId} → ${destinoId}`
    await connection.execute(`INSERT INTO movimentacao_estoque (id_empresa,id_local_estoque,id_produto,tipo,quantidade,valor_total,origem_tipo,id_usuario,observacao) VALUES (?,?,?,'TRANSFERENCIA_SAIDA',?,0,'TRANSFERENCIA',?,?)`, [empresaId, origemId, produtoId, qty, usuarioId, observation])
    await connection.execute(`INSERT INTO movimentacao_estoque (id_empresa,id_local_estoque,id_produto,tipo,quantidade,valor_total,origem_tipo,id_usuario,observacao) VALUES (?,?,?,'TRANSFERENCIA_ENTRADA',?,0,'TRANSFERENCIA',?,?)`, [empresaId, destinoId, produtoId, qty, usuarioId, observation])
    await connection.commit()
    return NextResponse.json({ message: 'Transferência concluída.', origemSaldo: sourceAfter, destinoSaldo: destinationAfter })
  } catch (error) {
    await connection.rollback(); console.error('Erro na transferência:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível transferir o item.' }, { status: error.status || 500 })
  } finally { connection.release() }
}
