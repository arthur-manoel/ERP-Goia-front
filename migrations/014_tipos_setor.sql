ALTER TABLE setores MODIFY COLUMN tipo VARCHAR(80) NOT NULL DEFAULT 'Outro';
CREATE TABLE tipos_setor (id INT NOT NULL AUTO_INCREMENT,id_empresa INT NOT NULL,nome VARCHAR(80) NOT NULL,status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',PRIMARY KEY(id),UNIQUE KEY uk_tipo_setor_empresa_nome(id_empresa,nome),CONSTRAINT fk_tipo_setor_empresa FOREIGN KEY(id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
INSERT IGNORE INTO tipos_setor (id_empresa,nome,status) SELECT DISTINCT id_empresa,tipo,'ATIVO' FROM setores WHERE tipo IS NOT NULL AND tipo<>'';
INSERT IGNORE INTO tipos_setor (id_empresa,nome,status) SELECT id,'Produção','ATIVO' FROM empresas;
INSERT IGNORE INTO tipos_setor (id_empresa,nome,status) SELECT id,'Armazenagem','ATIVO' FROM empresas;
INSERT IGNORE INTO tipos_setor (id_empresa,nome,status) SELECT id,'Logística','ATIVO' FROM empresas;
INSERT IGNORE INTO tipos_setor (id_empresa,nome,status) SELECT id,'Administrativo','ATIVO' FROM empresas;
