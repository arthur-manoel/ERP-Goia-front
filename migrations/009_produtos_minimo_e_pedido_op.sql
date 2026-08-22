ALTER TABLE produto_empresa
  ADD COLUMN unidade_estoque_minimo VARCHAR(20) NOT NULL DEFAULT 'UNIDADE' AFTER estoque_minimo;

ALTER TABLE pedido_compra
  ADD COLUMN id_ordem_producao INT NULL AFTER id_requisicao_compra,
  ADD CONSTRAINT fk_pedido_compra_op FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON UPDATE CASCADE ON DELETE SET NULL;
