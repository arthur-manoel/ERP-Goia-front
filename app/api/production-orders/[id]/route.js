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
      CAST(oi.id_tamanho AS CHAR) tamanhoId,COALESCE(t.nome,oi.tamanho) tamanho,oi.quantidade,oi.quantidade_produzida quantidadeProduzida,
      COALESCE((SELECT SUM(mi.quantidade) FROM ordem_producao_movimentacao_item mi JOIN ordem_producao_movimentacao_setor m ON m.id=mi.id_movimentacao WHERE mi.id_ordem_producao_item=oi.id AND m.status='ENTREGUE' AND m.id_setor_destino=(SELECT f.id_setor FROM ordem_producao_fluxo_setor f WHERE f.id_ordem_producao=oi.id_ordem_producao ORDER BY f.ordem DESC LIMIT 1)),0) quantidadeUltimoSetor
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
    const [movimentacoes] = await getDb().execute(`SELECT m.id,m.quantidade,origem.nome setorOrigem,destino.nome setorDestino,LOWER(m.status) status,
      DATE_FORMAT(m.data_envio,'%d/%m/%Y %H:%i') dataEnvio,DATE_FORMAT(m.data_recebimento,'%d/%m/%Y %H:%i') dataRecebimento,m.observacao
      FROM ordem_producao_movimentacao_setor m LEFT JOIN setores origem ON origem.id=m.id_setor_origem JOIN setores destino ON destino.id=m.id_setor_destino
      WHERE m.id_ordem_producao=? ORDER BY m.data_envio DESC,m.id DESC`, [id])
    const [movimentacaoItens]=await getDb().execute(`SELECT mi.id,CAST(mi.id_movimentacao AS CHAR) movimentacaoId,CAST(mi.id_ordem_producao_item AS CHAR) itemId,mi.quantidade,c.nome cor,COALESCE(t.nome,oi.tamanho) tamanho
      FROM ordem_producao_movimentacao_item mi JOIN ordem_producao_item oi ON oi.id=mi.id_ordem_producao_item
      LEFT JOIN cores c ON c.id=oi.id_cor LEFT JOIN tamanhos t ON t.id=oi.id_tamanho WHERE oi.id_ordem_producao=? ORDER BY mi.id`,[id])
    const [fluxo] = await getDb().execute(`SELECT f.id,f.ordem,CAST(f.id_setor AS CHAR) setorId,s.nome setor
      FROM ordem_producao_fluxo_setor f JOIN setores s ON s.id=f.id_setor WHERE f.id_ordem_producao=? ORDER BY f.ordem`,[id])
    const [[purchase]] = await getDb().execute(`SELECT pc.numero,c.id compraId FROM pedido_compra pc
      LEFT JOIN compras c ON c.id_pedido_compra_legado=pc.id
      WHERE pc.id_ordem_producao=? AND pc.id_empresa=? ORDER BY pc.id DESC LIMIT 1`, [id, empresaId])
    const movimentosDetalhados=movimentacoes.map(m=>({...m,itens:movimentacaoItens.filter(i=>i.movimentacaoId===String(m.id))}))
    return NextResponse.json({ ...order, id: String(order.id), items: items.map(item => ({ ...item, id: String(item.id) })), consumption, suggestedConsumption, fluxo, movimentacoes:movimentosDetalhados, movimentacaoPendente: movimentosDetalhados.find(m => m.status === 'em_transito') || null, pedidoCompra: purchase?.numero || null, pedidoCompraId: purchase?.compraId ? String(purchase.compraId) : null })
  } catch (error) { console.error('Erro ao carregar OP:', error); return NextResponse.json({ error: 'Não foi possível carregar a ordem de produção.' }, { status: 500 }) }
}

export async function PATCH(request,{params}){try{const{id}=await params,body=await request.json();const first=body.fluxo?.[0]||body.setorId;const[setor]=await getDb().execute("SELECT id FROM setores WHERE id=? AND id_empresa=? AND status='ATIVO'",[first,body.empresaId]);if(!setor[0])return NextResponse.json({error:'Cadastre o fluxo de setores antes de concluir.'},{status:400});await getDb().execute(`UPDATE ordem_producao SET id_setor=?,prioridade=?,status=?,data_inicio=?,data_previsao=?,observacao=? WHERE id=? AND id_empresa=?`,[first,String(body.prioridade||'NORMAL').toUpperCase(),String(body.status||'PLANEJADA').toUpperCase(),body.dataAbertura||new Date(),body.prazoConclusao||null,body.observacao||null,id,body.empresaId]);return NextResponse.json({message:'Ordem de produção concluída.'})}catch(e){return NextResponse.json({error:e.message},{status:500})}}
