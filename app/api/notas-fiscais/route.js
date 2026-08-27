import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const fail = (message, status = 400) => Object.assign(new Error(message), { status })

async function updateLinkedProductionOrder(connection, purchase, companyId, items) {
  if (!purchase.id_pedido_compra_legado || !purchase.id_ordem_producao) return
  for (const item of items) {
    const [[stock]] = await connection.execute('SELECT COALESCE(SUM(quantidade-quantidade_reservada),0) total FROM estoque WHERE id_empresa=? AND id_produto=?', [companyId, item.id_produto])
    const available = Number(stock.total || 0)
    await connection.execute(`UPDATE necessidade_producao SET quantidade_reservada=LEAST(quantidade_necessaria,?),
      status=CASE WHEN ?>=quantidade_necessaria THEN 'RESERVADA' ELSE 'PARCIAL' END
      WHERE id_ordem_producao=? AND id_produto=?`, [available, available, purchase.id_ordem_producao, item.id_produto])
    const [planned] = await connection.execute('SELECT id,quantidade_necessaria FROM ordem_producao_consumo_planejado WHERE id_ordem_producao=? AND id_materia_prima=? ORDER BY id', [purchase.id_ordem_producao, item.id_produto])
    let remaining = available
    for (const row of planned) {
      const needed = Number(row.quantidade_necessaria), used = Math.min(needed, Math.max(0, remaining))
      await connection.execute('UPDATE ordem_producao_consumo_planejado SET quantidade_disponivel=?,quantidade_faltante=? WHERE id=?', [used, Math.max(0, needed - used), row.id])
      remaining -= used
    }
  }
  await connection.execute("UPDATE pedido_compra SET status='RECEBIDO' WHERE id=?", [purchase.id_pedido_compra_legado])
  await connection.execute(`UPDATE ordem_producao SET status=CASE
    WHEN EXISTS (SELECT 1 FROM necessidade_producao WHERE id_ordem_producao=? AND status IN ('PENDENTE','PARCIAL'))
    THEN 'AGUARDANDO_MATERIAL' ELSE 'LIBERADA' END WHERE id=? AND id_empresa=?`,
  [purchase.id_ordem_producao, purchase.id_ordem_producao, companyId])
}

export async function POST(request) {
  const connection = await getDb().getConnection()
  try {
    const body = await request.json(), companyId = String(body.empresaId || '')
    if (!/^\d+$/.test(companyId) || !/^\d+$/.test(String(body.compraId || '')) || !body.chave?.trim()) return NextResponse.json({ error: 'Informe a compra e os dados obrigatórios da nota.' }, { status: 400 })
    await connection.beginTransaction()
    const [[purchase]] = await connection.execute(`SELECT c.*,COALESCE(SUM(ci.valor_total),0) total FROM compras c
      LEFT JOIN compra_itens ci ON ci.id_compra=c.id WHERE c.id=? AND c.id_empresa=? GROUP BY c.id FOR UPDATE`, [body.compraId, companyId])
    if (!purchase) throw fail('Compra não encontrada.', 404)
    if (purchase.status !== 'EMITIDA') throw fail('A compra precisa estar emitida e ainda não entregue.', 409)
    const [items] = await connection.execute(`SELECT ci.*,p.codigo,p.nome,p.unidade FROM compra_itens ci
      JOIN produtos p ON p.id=ci.id_produto WHERE ci.id_compra=? ORDER BY ci.id`, [purchase.id])
    if (!items.length) throw fail('A compra não possui produtos.')
    let number = String(body.numero || '').trim()
    if (body.numeroAutomatico !== false) {
      await connection.execute("INSERT INTO sequencias_automaticas (id_empresa,entidade,ultimo_numero) VALUES (?,'notas',LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE ultimo_numero=LAST_INSERT_ID(ultimo_numero+1)", [companyId])
      const [[sequence]] = await connection.query('SELECT LAST_INSERT_ID() numero')
      number = String(sequence.numero).padStart(6, '0')
    }
    if (!number) throw fail('Informe o número da nota.')
    const [[user]] = await connection.execute("SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status='ATIVO' ORDER BY (id_usuario=?) DESC LIMIT 1", [companyId, body.usuarioId || 0])
    if (!user) throw fail('Usuário ativo não encontrado.')
    await connection.execute("INSERT INTO empresa_fornecedor (id_empresa,id_fornecedor,status) SELECT ?,?,'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM empresa_fornecedor WHERE id_empresa=? AND id_fornecedor=?)", [companyId, purchase.id_fornecedor, companyId, purchase.id_fornecedor])
    const [note] = await connection.execute(`INSERT INTO nota_fiscal
      (id_empresa,id_local_estoque,id_fornecedor,id_pedido_compra,id_compra,numero,serie,chave_acesso,status,data_emissao,data_recebimento,valor_total,observacao,entrada_processada,data_processamento)
      VALUES (?,?,?,?,?,?,?,?,'RECEBIDA',?,NOW(),?,?,1,NOW())`, [companyId, purchase.id_local_estoque, purchase.id_fornecedor, purchase.id_pedido_compra_legado, purchase.id, number, body.serie || '1', body.chave.trim(), body.dataEmissao || new Date(), purchase.total, body.observacao || null])
    for (const [index, item] of items.entries()) {
      await connection.execute(`INSERT INTO item_nota_fiscal
        (id_nota_fiscal,numero_item,id_produto,codigo_produto,descricao_produto,quantidade,unidade,valor_unitario,valor_total,produto_cadastrado_automaticamente,id_cor,id_tamanho,tipo_valor)
        VALUES (?,?,?,?,?,?,?,?,?,0,?,?,'UNITARIO')`, [note.insertId, index + 1, item.id_produto, item.codigo, item.nome, item.quantidade, item.unidade, item.valor_unitario, item.valor_total, item.id_cor, item.id_tamanho])
      const [[balance]] = await connection.execute('SELECT id,quantidade FROM estoque WHERE id_empresa=? AND id_local_estoque=? AND id_produto=? FOR UPDATE', [companyId, purchase.id_local_estoque, item.id_produto])
      const before = Number(balance?.quantidade || 0), after = before + Number(item.quantidade)
      const [[companyProduct]] = await connection.execute('SELECT custo_atual FROM produto_empresa WHERE id_empresa=? AND id_produto=? FOR UPDATE', [companyId, item.id_produto])
      const cost = after > 0 ? ((before * Number(companyProduct?.custo_atual || 0)) + Number(item.valor_total || 0)) / after : 0
      if (balance) await connection.execute('UPDATE estoque SET quantidade=?,data_atualizacao=NOW() WHERE id=?', [after, balance.id])
      else await connection.execute('INSERT INTO estoque (id_empresa,id_local_estoque,id_produto,quantidade,quantidade_reservada) VALUES (?,?,?,?,0)', [companyId, purchase.id_local_estoque, item.id_produto, item.quantidade])
      await connection.execute('UPDATE produto_empresa SET custo_atual=? WHERE id_empresa=? AND id_produto=?', [cost, companyId, item.id_produto])
      await connection.execute(`INSERT INTO movimentacao_estoque
        (id_empresa,id_local_estoque,id_produto,tipo,quantidade,valor_total,origem_tipo,origem_id,id_usuario,observacao)
        VALUES (?,?,?,'ENTRADA_NF',?,?,'NOTA_FISCAL',?,?,?)`, [companyId, purchase.id_local_estoque, item.id_produto, item.quantidade, item.valor_total, note.insertId, user.id, `Entrada da nota fiscal ${number} / compra ${purchase.codigo}`])
    }
    await connection.execute("UPDATE compras SET status='ENTREGUE' WHERE id=?", [purchase.id])
    await updateLinkedProductionOrder(connection, purchase, companyId, items)
    await connection.commit()
    return NextResponse.json({ id: String(note.insertId), numero: number }, { status: 201 })
  } catch (error) {
    await connection.rollback()
    console.error('Erro ao cadastrar e receber nota:', error)
    return NextResponse.json({ error: error.code === 'ER_DUP_ENTRY' ? 'Número ou chave da nota já cadastrado.' : error.message }, { status: error.status || 500 })
  } finally { connection.release() }
}
