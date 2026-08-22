-- Sequências exclusivas dos cadastros automáticos. Códigos manuais não alteram o contador.
CREATE TABLE sequencias_automaticas (
  id_empresa INT NOT NULL,
  entidade VARCHAR(60) NOT NULL,
  ultimo_numero BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id_empresa, entidade),
  CONSTRAINT fk_sequencia_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Variações são opcionais: uma matéria-prima pode ter somente cor, somente tamanho ou nenhum deles.
ALTER TABLE produto_variacoes
  MODIFY id_cor INT NULL,
  MODIFY id_tamanho INT NULL;

-- Modelo deixou de fazer parte do domínio. As FKs devem sair antes da tabela.
ALTER TABLE item_nota_fiscal DROP FOREIGN KEY fk_item_nf_modelo, DROP COLUMN id_modelo;
ALTER TABLE ordem_producao_item DROP FOREIGN KEY fk_op_item_modelo, DROP COLUMN id_modelo;
ALTER TABLE produtos DROP FOREIGN KEY fk_produtos_modelo, DROP INDEX idx_produto_modelo, DROP COLUMN id_modelo;
DROP TABLE modelos;

-- Remove a permissão antiga de empresas já cadastradas.
DELETE FROM permissoes_setor WHERE recurso = 'modelos';
