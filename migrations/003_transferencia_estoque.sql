ALTER TABLE estoque ADD UNIQUE KEY uk_estoque_empresa_local_produto (id_empresa,id_local_estoque,id_produto);
