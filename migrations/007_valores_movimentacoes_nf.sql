UPDATE movimentacao_estoque mov
JOIN (
  SELECT movimentos.id_movimentacao, itens.valor_total
  FROM (
    SELECT id id_movimentacao, origem_id id_nota_fiscal,
      ROW_NUMBER() OVER (PARTITION BY origem_id ORDER BY id) numero_item
    FROM movimentacao_estoque
    WHERE tipo = 'ENTRADA_NF' AND origem_tipo = 'NOTA_FISCAL'
  ) movimentos
  JOIN (
    SELECT id_nota_fiscal, numero_item, valor_total
    FROM item_nota_fiscal
  ) itens ON itens.id_nota_fiscal = movimentos.id_nota_fiscal
    AND itens.numero_item = movimentos.numero_item
) valores ON valores.id_movimentacao = mov.id
SET mov.valor_total = valores.valor_total;
