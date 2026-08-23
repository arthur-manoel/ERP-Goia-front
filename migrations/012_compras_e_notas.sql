CREATE TABLE compras (
  id INT NOT NULL AUTO_INCREMENT,
  id_empresa INT NOT NULL,
  id_local_estoque INT NOT NULL,
  id_fornecedor INT NOT NULL,
  id_ordem_producao INT NULL,
  id_usuario INT NOT NULL,
  id_pedido_compra_legado INT NULL,
  codigo VARCHAR(50) NOT NULL,
  origem ENUM('MANUAL','ORDEM_PRODUCAO') NOT NULL DEFAULT 'MANUAL',
  status ENUM('RASCUNHO','EMITIDA','ENTREGUE','CANCELADA') NOT NULL DEFAULT 'RASCUNHO',
  data_emissao DATETIME NOT NULL,
  observacao VARCHAR(255) NULL,
  data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_compra_empresa_codigo (id_empresa,codigo),
  UNIQUE KEY uk_compra_pedido_legado (id_pedido_compra_legado),
  KEY idx_compra_empresa_status (id_empresa,status),
  CONSTRAINT fk_compra_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_compra_estoque FOREIGN KEY (id_local_estoque) REFERENCES locais_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_compra_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_compra_op FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_compra_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_compra_pedido_legado FOREIGN KEY (id_pedido_compra_legado) REFERENCES pedido_compra(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE compra_itens (
  id INT NOT NULL AUTO_INCREMENT,
  id_compra INT NOT NULL,
  id_produto INT NOT NULL,
  id_cor INT NULL,
  id_tamanho INT NULL,
  quantidade DECIMAL(15,3) NOT NULL,
  valor_unitario DECIMAL(15,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_compra_item_produto_variacao (id_compra,id_produto,id_cor,id_tamanho),
  CONSTRAINT fk_compra_item_compra FOREIGN KEY (id_compra) REFERENCES compras(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_compra_item_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_compra_item_cor FOREIGN KEY (id_cor) REFERENCES cores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_compra_item_tamanho FOREIGN KEY (id_tamanho) REFERENCES tamanhos(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

INSERT INTO compras (id_empresa,id_local_estoque,id_fornecedor,id_ordem_producao,id_usuario,id_pedido_compra_legado,codigo,origem,status,data_emissao,observacao)
SELECT pc.id_empresa,
  COALESCE(op.id_local_estoque,(SELECT le.id FROM locais_estoque le WHERE le.id_empresa=pc.id_empresa AND le.status='ATIVO' ORDER BY le.id LIMIT 1)),
  pc.id_fornecedor,pc.id_ordem_producao,pc.id_usuario,pc.id,pc.numero,
  IF(pc.id_ordem_producao IS NULL,'MANUAL','ORDEM_PRODUCAO'),
  CASE pc.status WHEN 'RECEBIDO' THEN 'ENTREGUE' WHEN 'CANCELADO' THEN 'CANCELADA' WHEN 'RASCUNHO' THEN 'RASCUNHO' ELSE 'EMITIDA' END,
  pc.data_pedido,pc.observacao
FROM pedido_compra pc LEFT JOIN ordem_producao op ON op.id=pc.id_ordem_producao
WHERE EXISTS (SELECT 1 FROM locais_estoque le WHERE le.id_empresa=pc.id_empresa AND le.status='ATIVO');

INSERT INTO compra_itens (id_compra,id_produto,quantidade,valor_unitario,valor_total)
SELECT c.id,i.id_produto,i.quantidade,i.valor_unitario,i.valor_total
FROM compras c JOIN item_pedido_compra i ON i.id_pedido_compra=c.id_pedido_compra_legado;

ALTER TABLE nota_fiscal ADD COLUMN id_compra INT NULL AFTER id_pedido_compra;
UPDATE nota_fiscal nf JOIN compras c ON c.id_pedido_compra_legado=nf.id_pedido_compra SET nf.id_compra=c.id;
ALTER TABLE nota_fiscal ADD CONSTRAINT fk_nota_fiscal_compra FOREIGN KEY (id_compra) REFERENCES compras(id) ON UPDATE CASCADE ON DELETE RESTRICT;
