UPDATE produto_empresa pe
JOIN (
  SELECT nf.id_empresa, inf.id_produto,
    CASE WHEN SUM(inf.quantidade) > 0 THEN SUM(inf.valor_total) / SUM(inf.quantidade) ELSE 0 END custo_medio
  FROM nota_fiscal nf
  JOIN item_nota_fiscal inf ON inf.id_nota_fiscal = nf.id
  WHERE nf.entrada_processada = 1 AND inf.id_produto IS NOT NULL
  GROUP BY nf.id_empresa, inf.id_produto
) custos ON custos.id_empresa = pe.id_empresa AND custos.id_produto = pe.id_produto
SET pe.custo_atual = custos.custo_medio;
