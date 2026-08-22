CREATE TABLE IF NOT EXISTS tamanhos (
  id INT NOT NULL AUTO_INCREMENT,
  id_empresa INT NOT NULL,
  nome VARCHAR(50) NOT NULL,
  descricao VARCHAR(255),
  ordem INT NOT NULL DEFAULT 0,
  status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (id),
  CONSTRAINT fk_tamanhos_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_tamanho_empresa_nome (id_empresa,nome)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS locais_estoque (
  id INT NOT NULL AUTO_INCREMENT,
  id_empresa INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (id),
  CONSTRAINT fk_locais_estoque_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_local_estoque_empresa_nome (id_empresa,nome)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS permissoes_setor (
  id INT NOT NULL AUTO_INCREMENT,
  id_setor INT NOT NULL,
  recurso VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_permissoes_setor_setor FOREIGN KEY (id_setor) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_permissao_setor_recurso (id_setor,recurso)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

ALTER TABLE produto_empresa ADD COLUMN id_cor INT NULL AFTER id_produto;
ALTER TABLE produto_empresa ADD COLUMN id_tamanho INT NULL AFTER id_cor;
ALTER TABLE produto_empresa ADD CONSTRAINT fk_produto_empresa_cor FOREIGN KEY (id_cor) REFERENCES cores(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE produto_empresa ADD CONSTRAINT fk_produto_empresa_tamanho FOREIGN KEY (id_tamanho) REFERENCES tamanhos(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE estoque ADD COLUMN id_local_estoque INT NULL AFTER id_empresa;
ALTER TABLE movimentacao_estoque ADD COLUMN id_local_estoque INT NULL AFTER id_empresa;
ALTER TABLE reserva_estoque ADD COLUMN id_local_estoque INT NULL AFTER id_empresa;
ALTER TABLE kardex ADD COLUMN id_local_estoque INT NULL AFTER id_empresa;
ALTER TABLE requisicao_compra ADD COLUMN id_local_estoque INT NULL AFTER id_empresa;
ALTER TABLE nota_fiscal ADD COLUMN id_local_estoque INT NULL AFTER id_empresa;
ALTER TABLE ordem_producao ADD COLUMN id_local_estoque INT NULL AFTER id_empresa;

ALTER TABLE estoque MODIFY id_setor INT NULL;
ALTER TABLE movimentacao_estoque MODIFY id_setor INT NULL;
ALTER TABLE reserva_estoque MODIFY id_setor INT NULL;
ALTER TABLE kardex MODIFY id_setor INT NULL;
ALTER TABLE requisicao_compra MODIFY id_setor_solicitante INT NULL;
ALTER TABLE nota_fiscal MODIFY id_setor_destino INT NULL;
ALTER TABLE ordem_producao MODIFY id_setor INT NULL;

ALTER TABLE estoque ADD CONSTRAINT fk_estoque_local FOREIGN KEY (id_local_estoque) REFERENCES locais_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE movimentacao_estoque ADD CONSTRAINT fk_mov_estoque_local FOREIGN KEY (id_local_estoque) REFERENCES locais_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE reserva_estoque ADD CONSTRAINT fk_reserva_estoque_local FOREIGN KEY (id_local_estoque) REFERENCES locais_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE kardex ADD CONSTRAINT fk_kardex_local FOREIGN KEY (id_local_estoque) REFERENCES locais_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE requisicao_compra ADD CONSTRAINT fk_req_compra_local FOREIGN KEY (id_local_estoque) REFERENCES locais_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE nota_fiscal ADD CONSTRAINT fk_nota_fiscal_local FOREIGN KEY (id_local_estoque) REFERENCES locais_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ordem_producao ADD CONSTRAINT fk_ordem_producao_local FOREIGN KEY (id_local_estoque) REFERENCES locais_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT;
