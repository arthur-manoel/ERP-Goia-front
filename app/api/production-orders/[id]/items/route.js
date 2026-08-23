import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request, { params }) {
  const connection = await getDb().getConnection()
  try {
    const { id } = await params; const { empresaId, items } = await request.json()
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: 'Informe ao menos uma quantidade na grade.' }, { status: 400 })
    await connection.beginTransaction()
    const [[order]] = await connection.execute('SELECT id,quantidade_planejada FROM ordem_producao WHERE id=? AND id_empresa=? FOR UPDATE', [id, empresaId])
    if (!order) throw Object.assign(new Error('Ordem de produção inválida.'), { status: 404 })
    const total = items.reduce((sum, item) => sum + Number(item.quantidade || 0), 0)
    if (!(total > 0)) throw Object.assign(new Error('Informe ao menos uma peça para a ordem de produção.'), { status: 400 })
    await connection.execute('DELETE FROM ordem_producao_item WHERE id_ordem_producao=?', [id])
    for (const item of items) {
      const qty = Number(item.quantidade)
      if (!(qty > 0)) continue
      const [[product]] = await connection.execute(`SELECT p.id FROM produtos p JOIN produto_empresa pe ON pe.id_produto=p.id
        WHERE p.id=? AND pe.id_empresa=? AND pe.status='ATIVO' AND (p.permite_producao=1 OR p.permite_venda=1)`, [item.produtoId, empresaId])
      if (!product) throw Object.assign(new Error('A grade contém um produto acabado inválido.'), { status: 400 })
      const [[variation]] = await connection.execute(`SELECT pv.id,t.nome tamanho FROM produto_variacoes pv LEFT JOIN tamanhos t ON t.id=pv.id_tamanho
        WHERE pv.id_empresa=? AND pv.id_produto=? AND pv.id_cor <=> ? AND pv.id_tamanho <=> ? AND pv.status='ATIVO'`, [empresaId, item.produtoId, item.corId || null, item.tamanhoId || null])
      if (!variation) throw Object.assign(new Error('A grade contém uma cor/tamanho não relacionada ao produto.'), { status: 400 })
      await connection.execute(`INSERT INTO ordem_producao_item (id_ordem_producao,id_produto,id_cor,id_tamanho,tamanho,quantidade,quantidade_produzida)
        VALUES (?,?,?,?,?,?,0)`, [id, item.produtoId, item.corId, item.tamanhoId, variation.tamanho, qty])
    }
    await connection.execute('UPDATE ordem_producao SET quantidade_planejada=? WHERE id=?', [total, id])
    await connection.commit(); return NextResponse.json({ message: 'Grade de produção salva.' })
  } catch (error) { await connection.rollback(); console.error('Erro ao salvar grade da OP:', error); return NextResponse.json({ error: error.message }, { status: error.status || 500 }) }
  finally { connection.release() }
}
