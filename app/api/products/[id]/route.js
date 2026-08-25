import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const empresaId = new URL(request.url).searchParams.get('empresaId')
    if (!/^\d+$/.test(id || '') || !/^\d+$/.test(empresaId || '')) return NextResponse.json({ error: 'Produto ou empresa inválida.' }, { status: 400 })

    const [[produto]] = await getDb().execute(`SELECT p.id,p.nome,COALESCE(pe.codigo_interno,p.codigo) codigo,p.descricao,p.unidade,
      CASE WHEN p.permite_producao=1 OR p.permite_venda=1 THEN 'produto_acabado' ELSE 'materia_prima' END tipo,
      ca.nome categoria,LOWER(pe.status) status,pe.estoque_minimo minimo,LOWER(pe.unidade_estoque_minimo) unidadeMinimo,
      pe.preco_venda precoVenda,pe.custo_atual custoAtual,CASE WHEN p.permite_producao=1 OR p.permite_venda=1 THEN COALESCE((SELECT SUM(fti.quantidade*COALESCE(cpe.custo_atual,0)) FROM ficha_tecnica ft JOIN ficha_tecnica_item fti ON fti.id_ficha_tecnica=ft.id JOIN produto_empresa cpe ON cpe.id_produto=fti.id_produto_componente AND cpe.id_empresa=ft.id_empresa WHERE ft.id_empresa=pe.id_empresa AND ft.id_produto=p.id AND ft.status='ATIVA' AND ft.versao=(SELECT MAX(ft2.versao) FROM ficha_tecnica ft2 WHERE ft2.id_empresa=ft.id_empresa AND ft2.id_produto=ft.id_produto AND ft2.status='ATIVA')),0) ELSE COALESCE(pe.custo_atual,0) END valorUnitario,
      pe.estoque_maximo maximo,p.controla_estoque controlaEstoque,p.permite_compra permiteCompra,
      p.permite_venda permiteVenda,p.permite_producao permiteProducao,DATE_FORMAT(p.data_cadastro,'%d/%m/%Y %H:%i') cadastradoEm,
      COALESCE(SUM(e.quantidade),0) estoqueTotal,COALESCE(SUM(e.quantidade_reservada),0) reservado
      FROM produtos p JOIN produto_empresa pe ON pe.id_produto=p.id AND pe.id_empresa=?
      LEFT JOIN categorias ca ON ca.id=p.id_categoria LEFT JOIN estoque e ON e.id_empresa=pe.id_empresa AND e.id_produto=p.id
      WHERE p.id=? GROUP BY p.id,pe.id,ca.nome`, [empresaId, id])
    if (!produto) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 })

    const [variacoes] = await getDb().execute(`SELECT pv.id,c.nome cor,t.nome tamanho,LOWER(pv.status) status
      FROM produto_variacoes pv LEFT JOIN cores c ON c.id=pv.id_cor LEFT JOIN tamanhos t ON t.id=pv.id_tamanho
      WHERE pv.id_empresa=? AND pv.id_produto=? ORDER BY c.nome,t.ordem,t.nome`, [empresaId, id])
    const [insumos] = await getDb().execute(`SELECT componente.id produtoId,componente.codigo,componente.nome,
      componente.unidade,fti.quantidade,fti.perda_percentual perdaPercentual,
      (fti.quantidade*(1+fti.perda_percentual/100)) quantidadeComPerda,COALESCE(cpe.custo_atual,0) valorUnitario
      FROM ficha_tecnica ft JOIN ficha_tecnica_item fti ON fti.id_ficha_tecnica=ft.id
      JOIN produtos componente ON componente.id=fti.id_produto_componente
      JOIN produto_empresa cpe ON cpe.id_produto=componente.id AND cpe.id_empresa=ft.id_empresa
      WHERE ft.id_empresa=? AND ft.id_produto=? AND ft.status='ATIVA'
        AND ft.versao=(SELECT MAX(ft2.versao) FROM ficha_tecnica ft2 WHERE ft2.id_empresa=ft.id_empresa AND ft2.id_produto=ft.id_produto AND ft2.status='ATIVA')
      ORDER BY componente.nome`, [empresaId, id])
    const [estoques] = await getDb().execute(`SELECT le.nome estoque,e.quantidade total,e.quantidade_reservada reservado,
      (e.quantidade-e.quantidade_reservada) disponivel FROM estoque e
      LEFT JOIN locais_estoque le ON le.id=e.id_local_estoque WHERE e.id_empresa=? AND e.id_produto=? ORDER BY le.nome`, [empresaId, id])
    return NextResponse.json({ ...produto, id: String(produto.id), empresaId: String(empresaId), variacoes, insumos, estoques })
  } catch (error) {
    console.error('Erro ao carregar detalhe do produto:', error)
    return NextResponse.json({ error: 'Não foi possível carregar o produto.' }, { status: 500 })
  }
}
