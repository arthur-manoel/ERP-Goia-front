import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request, { params }) {
  const connection = await getDb().getConnection()
  try {
    const { id } = await params
    const { empresaId, usuarioId } = await request.json()
    if (!/^\d+$/.test(String(id || '')) || !/^\d+$/.test(String(empresaId || ''))) return NextResponse.json({ error: 'Nota fiscal inválida.' }, { status: 400 })
    await connection.beginTransaction()
    const [notes] = await connection.execute(`SELECT id,id_empresa,id_local_estoque,id_pedido_compra,status,entrada_processada
      FROM nota_fiscal WHERE id=? AND id_empresa=? FOR UPDATE`, [id, empresaId])
    const note = notes[0]
    if (!note) throw Object.assign(new Error('Nota fiscal não encontrada.'), { status: 404 })
    if (note.status === 'CANCELADA') throw Object.assign(new Error('Uma nota cancelada não pode ser recebida.'), { status: 409 })
    if (note.entrada_processada) throw Object.assign(new Error('Esta nota fiscal já foi recebida e processada.'), { status: 409 })
    if (!note.id_local_estoque) throw Object.assign(new Error('A nota não possui estoque de destino.'), { status: 400 })
    const effectiveUserId = /^\d+$/.test(String(usuarioId || ''))
      ? (await connection.execute('SELECT id_usuario id FROM usuario_empresa WHERE id_usuario=? AND id_empresa=? AND status=\'ATIVO\' LIMIT 1', [usuarioId, empresaId]))[0][0]?.id
      : (await connection.execute('SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status=\'ATIVO\' LIMIT 1', [empresaId]))[0][0]?.id
    if (!effectiveUserId) throw Object.assign(new Error('Nenhum usuário ativo foi encontrado para processar a entrada.'), { status: 400 })
    const [items] = await connection.execute('SELECT id_produto,quantidade,valor_total FROM item_nota_fiscal WHERE id_nota_fiscal=? ORDER BY numero_item', [id])
    if (!items.length) throw Object.assign(new Error('A nota fiscal não possui produtos.'), { status: 400 })

    for (const item of items) {
      if (!item.id_produto || !(Number(item.quantidade) > 0)) throw Object.assign(new Error('A nota possui um item inválido.'), { status: 400 })
      const [balances] = await connection.execute(`SELECT id,quantidade FROM estoque
        WHERE id_empresa=? AND id_local_estoque=? AND id_produto=? FOR UPDATE`, [empresaId, note.id_local_estoque, item.id_produto])
      const balance = balances[0]
      const before = Number(balance?.quantidade || 0)
      const after = before + Number(item.quantidade)
      const [companyProducts] = await connection.execute('SELECT custo_atual FROM produto_empresa WHERE id_empresa=? AND id_produto=? FOR UPDATE', [empresaId, item.id_produto])
      const previousCost = Number(companyProducts[0]?.custo_atual || 0)
      const newCost = after > 0 ? ((before * previousCost) + Number(item.valor_total || 0)) / after : 0
      if (balance) await connection.execute('UPDATE estoque SET quantidade=?,data_atualizacao=CURRENT_TIMESTAMP WHERE id=?', [after, balance.id])
      else await connection.execute('INSERT INTO estoque (id_empresa,id_local_estoque,id_produto,quantidade,quantidade_reservada) VALUES (?,?,?,?,0)', [empresaId, note.id_local_estoque, item.id_produto, item.quantidade])
      await connection.execute('UPDATE produto_empresa SET custo_atual=? WHERE id_empresa=? AND id_produto=?', [newCost, empresaId, item.id_produto])
      await connection.execute(`INSERT INTO movimentacao_estoque
        (id_empresa,id_local_estoque,id_produto,tipo,quantidade,valor_total,origem_tipo,origem_id,id_usuario,observacao)
        VALUES (?,?,?,'ENTRADA_NF',?,?, 'NOTA_FISCAL',?,?,?)`, [empresaId, note.id_local_estoque, item.id_produto, item.quantidade, Number(item.valor_total || 0), id, effectiveUserId, `Entrada da nota fiscal ${id}`])
      if (note.id_pedido_compra) {
        const [[linkedOrder]] = await connection.execute('SELECT id_ordem_producao opId FROM pedido_compra WHERE id=?', [note.id_pedido_compra])
        const [[availableStock]] = await connection.execute('SELECT COALESCE(SUM(quantidade-quantidade_reservada),0) total FROM estoque WHERE id_empresa=? AND id_produto=?', [empresaId, item.id_produto])
        const totalAvailable = Number(availableStock.total || 0)
        await connection.execute(`UPDATE necessidade_producao SET quantidade_reservada=LEAST(quantidade_necessaria,?)
          WHERE id_ordem_producao=? AND id_produto=?`, [totalAvailable, linkedOrder?.opId || 0, item.id_produto])
        await connection.execute(`UPDATE necessidade_producao np JOIN pedido_compra pc ON pc.id_ordem_producao=np.id_ordem_producao
          SET np.status=CASE WHEN np.quantidade_reservada>=np.quantidade_necessaria THEN 'RESERVADA' ELSE 'PARCIAL' END WHERE pc.id=? AND np.id_produto=?`, [note.id_pedido_compra, item.id_produto])
        if (linkedOrder?.opId) {
          const [plannedRows] = await connection.execute('SELECT id,quantidade_necessaria FROM ordem_producao_consumo_planejado WHERE id_ordem_producao=? AND id_materia_prima=? ORDER BY id', [linkedOrder.opId, item.id_produto])
          let remaining = totalAvailable
          for (const planned of plannedRows) {
            const needed = Number(planned.quantidade_necessaria); const used = Math.min(needed, Math.max(0, remaining)); const missing = Math.max(0, needed - used)
            await connection.execute('UPDATE ordem_producao_consumo_planejado SET quantidade_disponivel=?,quantidade_faltante=? WHERE id=?', [used, missing, planned.id])
            remaining -= used
          }
        }
      }
    }
    if (note.id_pedido_compra) {
      await connection.execute("UPDATE pedido_compra SET status='RECEBIDO' WHERE id=?", [note.id_pedido_compra])
      await connection.execute(`UPDATE ordem_producao o JOIN pedido_compra pc ON pc.id_ordem_producao=o.id
        SET o.status=CASE WHEN EXISTS (SELECT 1 FROM necessidade_producao np WHERE np.id_ordem_producao=o.id AND np.status IN ('PENDENTE','PARCIAL')) THEN 'AGUARDANDO_MATERIAL' ELSE 'LIBERADA' END
        WHERE pc.id=?`, [note.id_pedido_compra])
    }
    await connection.execute(`UPDATE nota_fiscal SET status='RECEBIDA',data_recebimento=COALESCE(data_recebimento,NOW()),
      entrada_processada=1,data_processamento=NOW() WHERE id=? AND id_empresa=?`, [id, empresaId])
    await connection.commit()
    return NextResponse.json({ message: 'Nota recebida e estoque atualizado.' })
  } catch (error) {
    await connection.rollback()
    console.error('Erro ao receber nota fiscal:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível receber a nota fiscal.' }, { status: error.status || 500 })
  } finally { connection.release() }
}
