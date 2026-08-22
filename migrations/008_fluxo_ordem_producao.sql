CREATE TABLE produto_variacoes (
  id INT NOT NULL AUTO_INCREMENT,
  id_empresa INT NOT NULL,
  id_produto INT NOT NULL,
  id_cor INT NOT NULL,
  id_tamanho INT NOT NULL,
  status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (id),
  CONSTRAINT fk_produto_variacao_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_produto_variacao_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_produto_variacao_cor FOREIGN KEY (id_cor) REFERENCES cores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_produto_variacao_tamanho FOREIGN KEY (id_tamanho) REFERENCES tamanhos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_produto_variacao (id_empresa,id_produto,id_cor,id_tamanho)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

INSERT IGNORE INTO produto_variacoes (id_empresa,id_produto,id_cor,id_tamanho,status)
SELECT id_empresa,id_produto,id_cor,id_tamanho,status FROM produto_empresa
WHERE id_cor IS NOT NULL AND id_tamanho IS NOT NULL;

ALTER TABLE ordem_producao
  ADD COLUMN prioridade ENUM('BAIXA','NORMAL','ALTA','URGENTE') NOT NULL DEFAULT 'NORMAL' AFTER numero,
  ADD COLUMN quantidade_planejada DECIMAL(15,3) NOT NULL DEFAULT 0 AFTER prioridade;

ALTER TABLE ordem_producao_item
  ADD COLUMN id_tamanho INT NULL AFTER id_cor,
  ADD CONSTRAINT fk_op_item_tamanho FOREIGN KEY (id_tamanho) REFERENCES tamanhos(id) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE ordem_producao_consumo_planejado (
  id INT NOT NULL AUTO_INCREMENT,
  id_ordem_producao INT NOT NULL,
  id_ordem_producao_item INT NOT NULL,
  id_materia_prima INT NOT NULL,
  quantidade_por_peca DECIMAL(15,3) NOT NULL,
  quantidade_necessaria DECIMAL(15,3) NOT NULL,
  quantidade_disponivel DECIMAL(15,3) NOT NULL DEFAULT 0,
  quantidade_faltante DECIMAL(15,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_op_consumo_ordem FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_op_consumo_item FOREIGN KEY (id_ordem_producao_item) REFERENCES ordem_producao_item(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_op_consumo_materia FOREIGN KEY (id_materia_prima) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_op_consumo_item_materia (id_ordem_producao_item,id_materia_prima)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
