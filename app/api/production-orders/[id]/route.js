import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const empresaId = new URL(request.url).searchParams.get('empresaId')
    const [[order]] = await getDb().execute(`SELECT o.id,o.numero,o.prioridade,o.quantidade_planejada quantidadePlanejada,
      LOWER(o.status) status,DATE_FORMAT(o.data_inicio,'%Y-%m-%d') dataAbertura,DATE_FORMAT(o.data_previsao,'%Y-%m-%d') prazoConclusao,
      s.id setorId,s.nome setor FROM ordem_producao o LEFT JOIN setores s ON s.id=o.id_setor WHERE o.id=? AND o.id_empresa=?`, [id, empresaId])
    if (!order) return NextResponse.json({ error: 'Ordem de produção não encontrada.' }, { status: 404 })
    const [items] = await getDb().execute(`SELECT oi.id,CAST(oi.id_produto AS CHAR) produtoId,p.nome produto,CAST(oi.id_cor AS CHAR) corId,c.nome cor,
      CAST(oi.id_tamanho AS CHAR) tamanhoId,COALESCE(t.nome,oi.tamanho) tamanho,oi.quantidade,oi.quantidade_produzida quantidadeProduzida
      FROM ordem_producao_item oi JOIN produtos p ON p.id=oi.id_produto LEFT JOIN cores c ON c.id=oi.id_cor LEFT JOIN tamanhos t ON t.id=oi.id_tamanho
      WHERE oi.id_ordem_producao=? ORDER BY c.nome,t.ordem,t.nome`, [id])
    const [consumption] = await getDb().execute(`SELECT calculo.id,calculo.itemId,calculo.materiaPrimaId,calculo.materiaPrima,calculo.unidade,calculo.porPeca,calculo.necessario,
      GREATEST(0,LEAST(calculo.necessario,calculo.estoqueDisponivel-calculo.necessidadeAnterior)) disponivel,
      GREATEST(0,calculo.necessario-GREATEST(0,LEAST(calculo.necessario,calculo.estoqueDisponivel-calculo.necessidadeAnterior))) faltante
      FROM (SELECT cp.id,cp.id_ordem_producao_item itemId,CAST(cp.id_materia_prima AS CHAR) materiaPrimaId,p.nome materiaPrima,p.unidade,
        cp.quantidade_por_peca porPeca,cp.quantidade_necessaria necessario,
        COALESCE((SELECT SUM(e.quantidade-e.quantidade_reservada) FROM estoque e JOIN ordem_producao op ON op.id=cp.id_ordem_producao WHERE e.id_empresa=op.id_empresa AND e.id_produto=cp.id_materia_prima),0) estoqueDisponivel,
        COALESCE((SELECT SUM(anterior.quantidade_necessaria) FROM ordem_producao_consumo_planejado anterior WHERE anterior.id_ordem_producao=cp.id_ordem_producao AND anterior.id_materia_prima=cp.id_materia_prima AND anterior.id<cp.id),0) necessidadeAnterior
        FROM ordem_producao_consumo_planejado cp JOIN produtos p ON p.id=cp.id_materia_prima WHERE cp.id_ordem_producao=?) calculo
      ORDER BY calculo.itemId,calculo.materiaPrima`, [id])
    const [suggestedConsumption] = await getDb().execute(`SELECT oi.id itemId,CAST(mp.id AS CHAR) materiaPrimaId,mp.nome materiaPrima,mp.unidade,
      fti.quantidade porPeca,(fti.quantidade*oi.quantidade) necessario
      FROM ordem_producao_item oi JOIN ficha_tecnica ft ON ft.id_produto=oi.id_produto AND ft.id_empresa=? AND ft.status='ATIVA'
      JOIN ficha_tecnica_item fti ON fti.id_ficha_tecnica=ft.id JOIN produtos mp ON mp.id=fti.id_produto_componente
      WHERE oi.id_ordem_producao=? AND ft.versao=(SELECT MAX(ft2.versao) FROM ficha_tecnica ft2 WHERE ft2.id_empresa=ft.id_empresa AND ft2.id_produto=ft.id_produto AND ft2.status='ATIVA')
      ORDER BY oi.id,mp.nome`, [empresaId, id])
    const [movimentacoes] = await getDb().execute(`SELECT m.id,origem.nome setorOrigem,destino.nome setorDestino,LOWER(m.status) status,
      DATE_FORMAT(m.data_envio,'%d/%m/%Y %H:%i') dataEnvio,DATE_FORMAT(m.data_recebimento,'%d/%m/%Y %H:%i') dataRecebimento,m.observacao
      FROM ordem_producao_movimentacao_setor m LEFT JOIN setores origem ON origem.id=m.id_setor_origem JOIN setores destino ON destino.id=m.id_setor_destino
      WHERE m.id_ordem_producao=? ORDER BY m.data_envio DESC,m.id DESC`, [id])
    const [[purchase]] = await getDb().execute(`SELECT pc.numero FROM pedido_compra pc WHERE pc.observacao LIKE ? AND pc.id_empresa=? ORDER BY pc.id DESC LIMIT 1`, [`%OP ${order.numero}%`, empresaId])
    return NextResponse.json({ ...order, id: String(order.id), items: items.map(item => ({ ...item, id: String(item.id) })), consumption, suggestedConsumption, movimentacoes, movimentacaoPendente: movimentacoes.find(m => m.status === 'em_transito') || null, pedidoCompra: purchase?.numero || null })
  } catch (error) { console.error('Erro ao carregar OP:', error); return NextResponse.json({ error: 'Não foi possível carregar a ordem de produção.' }, { status: 500 }) }
}
