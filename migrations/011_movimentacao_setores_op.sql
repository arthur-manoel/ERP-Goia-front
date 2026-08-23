CREATE TABLE ordem_producao_movimentacao_setor (
  id INT NOT NULL AUTO_INCREMENT,
  id_ordem_producao INT NOT NULL,
  id_setor_origem INT NULL,
  id_setor_destino INT NOT NULL,
  id_usuario_envio INT NULL,
  id_usuario_recebimento INT NULL,
  status ENUM('EM_TRANSITO','ENTREGUE') NOT NULL DEFAULT 'ENTREGUE',
  data_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_recebimento DATETIME NULL,
  observacao VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_op_movimentacao_ordem (id_ordem_producao,data_envio),
  CONSTRAINT fk_op_movimentacao_ordem FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON DELETE CASCADE,
  CONSTRAINT fk_op_movimentacao_origem FOREIGN KEY (id_setor_origem) REFERENCES setores(id) ON DELETE SET NULL,
  CONSTRAINT fk_op_movimentacao_destino FOREIGN KEY (id_setor_destino) REFERENCES setores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_op_movimentacao_usuario_envio FOREIGN KEY (id_usuario_envio) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_op_movimentacao_usuario_recebimento FOREIGN KEY (id_usuario_recebimento) REFERENCES usuarios(id) ON DELETE SET NULL
);

INSERT INTO ordem_producao_movimentacao_setor
  (id_ordem_producao,id_setor_origem,id_setor_destino,id_usuario_envio,id_usuario_recebimento,status,data_envio,data_recebimento,observacao)
SELECT o.id,NULL,o.id_setor,o.id_usuario,o.id_usuario,'ENTREGUE',COALESCE(o.data_inicio,NOW()),COALESCE(o.data_inicio,NOW()),'Setor inicial da ordem'
FROM ordem_producao o
WHERE o.id_setor IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ordem_producao_movimentacao_setor m WHERE m.id_ordem_producao=o.id);
