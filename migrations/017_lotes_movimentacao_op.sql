CREATE TABLE ordem_producao_movimentacao_item (
  id INT NOT NULL AUTO_INCREMENT,
  id_movimentacao INT NOT NULL,
  id_ordem_producao_item INT NOT NULL,
  quantidade DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_op_mov_item (id_movimentacao,id_ordem_producao_item),
  KEY idx_op_mov_item_op (id_ordem_producao_item),
  CONSTRAINT fk_op_mov_item_mov FOREIGN KEY (id_movimentacao) REFERENCES ordem_producao_movimentacao_setor(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_op_mov_item_item FOREIGN KEY (id_ordem_producao_item) REFERENCES ordem_producao_item(id) ON DELETE CASCADE ON UPDATE CASCADE
);
