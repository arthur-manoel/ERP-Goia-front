CREATE TABLE ordem_producao_fluxo_setor (
  id INT NOT NULL AUTO_INCREMENT,
  id_ordem_producao INT NOT NULL,
  id_setor INT NOT NULL,
  ordem INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_op_fluxo_ordem (id_ordem_producao, ordem),
  UNIQUE KEY uk_op_fluxo_setor (id_ordem_producao, id_setor),
  CONSTRAINT fk_op_fluxo_ordem FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_op_fluxo_setor FOREIGN KEY (id_setor) REFERENCES setores(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE ordem_producao_movimentacao_setor
  ADD COLUMN quantidade DECIMAL(15,2) NULL AFTER id_setor_destino;

INSERT INTO ordem_producao_fluxo_setor (id_ordem_producao,id_setor,ordem)
SELECT o.id,o.id_setor,1 FROM ordem_producao o
WHERE o.id_setor IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ordem_producao_fluxo_setor f WHERE f.id_ordem_producao=o.id);
