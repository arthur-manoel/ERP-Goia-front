-- Produtos acabados são sempre contabilizados por unidade.
UPDATE produtos
SET unidade = 'unidade'
WHERE permite_producao = 1 OR permite_venda = 1;

-- A quantidade mínima deve usar a mesma unidade cadastrada no produto.
UPDATE produto_empresa pe
JOIN produtos p ON p.id = pe.id_produto
SET pe.unidade_estoque_minimo = p.unidade;
