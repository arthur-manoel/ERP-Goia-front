import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request, { params }) {
  const connection = await getDb().getConnection()
  try {
    const { id } = await params; const { empresaId, usuarioId, consumos } = await request.json()
    if (!Array.isArray(consumos) || !consumos.length) return NextResponse.json({ error: 'Informe o consumo de matéria-prima.' }, { status: 400 })
    await connection.beginTransaction()
    const [[order]] = await connection.execute('SELECT id,numero FROM ordem_producao WHERE id=? AND id_empresa=? FOR UPDATE', [id, empresaId])
    if (!order) throw Object.assign(new Error('Ordem de produção inválida.'), { status: 404 })
    const [opItems] = await connection.execute('SELECT id,quantidade FROM ordem_producao_item WHERE id_ordem_producao=?', [id])
    const itemMap = new Map(opItems.map(item => [String(item.id), item]))
    const [rawProducts] = await connection.execute(`SELECT p.id,p.nome,p.unidade,COALESCE(pe.custo_atual,0) custo,
      COALESCE((SELECT SUM(e.quantidade-e.quantidade_reservada) FROM estoque e WHERE e.id_empresa=pe.id_empresa AND e.id_produto=p.id),0) disponivel
      FROM produtos p JOIN produto_empresa pe ON pe.id_produto=p.id WHERE pe.id_empresa=? AND p.permite_producao=0 AND p.permite_venda=0`, [empresaId])
    const rawMap = new Map(rawProducts.map(product => [String(product.id), product]))
    const linhas = []; const totais = new Map()
    for (const consumo of consumos) {
      const opItem = itemMap.get(String(consumo.itemId)); const raw = rawMap.get(String(consumo.materiaPrimaId)); const perPiece = Number(consumo.porPeca)
      if (!opItem || !raw || !(perPiece > 0)) throw Object.assign(new Error('Existe um consumo inválido.'), { status: 400 })
      const needed = Number(opItem.quantidade) * perPiece
      linhas.push({ opItem, raw, perPiece, needed })
      totais.set(String(raw.id), (totais.get(String(raw.id)) || 0) + needed)
    }
    await connection.execute('DELETE FROM ordem_producao_consumo_planejado WHERE id_ordem_producao=?', [id])
    await connection.execute('DELETE FROM necessidade_producao WHERE id_ordem_producao=?', [id])
    const restante = new Map(rawProducts.map(raw => [String(raw.id), Number(raw.disponivel)]))
    for (const linha of linhas) {
      const available = Math.max(0, restante.get(String(linha.raw.id)) || 0); const used = Math.min(available, linha.needed); const missing = Math.max(0, linha.needed - used)
      restante.set(String(linha.raw.id), available - used)
      await connection.execute(`INSERT INTO ordem_producao_consumo_planejado
        (id_ordem_producao,id_ordem_producao_item,id_materia_prima,quantidade_por_peca,quantidade_necessaria,quantidade_disponivel,quantidade_faltante)
        VALUES (?,?,?,?,?,?,?)`, [id, linha.opItem.id, linha.raw.id, linha.perPiece, linha.needed, used, missing])
    }
    let hasShortage = false
    for (const [rawId, needed] of totais) {
      const raw = rawMap.get(rawId); const shortage = Math.max(0, needed - Number(raw.disponivel)); hasShortage ||= shortage > 0
      await connection.execute(`INSERT INTO necessidade_producao (id_ordem_producao,id_produto,quantidade_necessaria,quantidade_reservada,quantidade_consumida,status)
        VALUES (?,?,?,?,0,?)`, [id, rawId, needed, Math.min(needed, Number(raw.disponivel)), shortage > 0 ? 'PARCIAL' : 'RESERVADA'])
    }
    let purchaseNumber = null
    if (hasShortage) {
      const [[supplier]] = await connection.execute('SELECT id FROM fornecedores WHERE id_empresa=? AND status=\'ATIVO\' ORDER BY id LIMIT 1', [empresaId])
      if (!supplier) throw Object.assign(new Error('Cadastre um fornecedor ativo para gerar o pedido de compra automático.'), { status: 400 })
      const [[user]] = await connection.execute('SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status=\'ATIVO\' ORDER BY (id_usuario=?) DESC LIMIT 1', [empresaId, usuarioId || 0])
      if (!user) throw Object.assign(new Error('Nenhum usuário ativo encontrado para criar o pedido.'), { status: 400 })
      await connection.execute(`INSERT INTO empresa_fornecedor (id_empresa,id_fornecedor,status) SELECT ?,?,'ATIVO'
        WHERE NOT EXISTS (SELECT 1 FROM empresa_fornecedor WHERE id_empresa=? AND id_fornecedor=?)`, [empresaId, supplier.id, empresaId, supplier.id])
      purchaseNumber = `PC-AUTO-OP-${id}`
      const [purchase] = await connection.execute(`INSERT INTO pedido_compra (id_empresa,id_fornecedor,id_ordem_producao,id_usuario,numero,data_pedido,status,observacao)
        VALUES (?,?,?,?,?,NOW(),'EMITIDO',?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id),id_ordem_producao=VALUES(id_ordem_producao),status='EMITIDO',observacao=VALUES(observacao)`, [empresaId, supplier.id, id, user.id, purchaseNumber, `Compra automática por falta de material na OP ${order.numero}`])
      await connection.execute('DELETE FROM item_pedido_compra WHERE id_pedido_compra=?', [purchase.insertId])
      for (const [rawId, needed] of totais) {
        const raw = rawMap.get(rawId); const shortage = Math.max(0, needed - Number(raw.disponivel)); if (!(shortage > 0)) continue
        await connection.execute('INSERT INTO item_pedido_compra (id_pedido_compra,id_produto,quantidade,valor_unitario,valor_total) VALUES (?,?,?,?,?)', [purchase.insertId, rawId, shortage, Number(raw.custo), shortage * Number(raw.custo)])
      }
    }
    await connection.execute('UPDATE ordem_producao SET status=? WHERE id=?', [hasShortage ? 'AGUARDANDO_MATERIAL' : 'LIBERADA', id])
    await connection.commit(); return NextResponse.json({ message: hasShortage ? 'Consumo salvo e pedido de compra gerado.' : 'Consumo salvo. Materiais suficientes.', pedidoCompra: purchaseNumber, faltante: hasShortage })
  } catch (error) { await connection.rollback(); console.error('Erro ao planejar consumo:', error); return NextResponse.json({ error: error.message }, { status: error.status || 500 }) }
  finally { connection.release() }
}
