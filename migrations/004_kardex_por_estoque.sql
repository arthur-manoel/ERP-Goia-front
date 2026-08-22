DROP TRIGGER IF EXISTS trg_movimentacao_kardex_auditoria;
DELIMITER $$
CREATE TRIGGER trg_movimentacao_kardex_auditoria
AFTER INSERT ON movimentacao_estoque
FOR EACH ROW
BEGIN
  DECLARE v_saldo_atual DECIMAL(15,3) DEFAULT 0;
  DECLARE v_saldo_anterior DECIMAL(15,3) DEFAULT 0;
  DECLARE v_direcao VARCHAR(10);
  SELECT COALESCE(quantidade,0) INTO v_saldo_atual FROM estoque
   WHERE id_empresa=NEW.id_empresa AND id_produto=NEW.id_produto
     AND ((NEW.id_local_estoque IS NOT NULL AND id_local_estoque=NEW.id_local_estoque)
       OR (NEW.id_local_estoque IS NULL AND id_setor=NEW.id_setor)) LIMIT 1;
  IF NEW.tipo IN ('ENTRADA_NF','ENTRADA_PRODUCAO','AJUSTE_ENTRADA','TRANSFERENCIA_ENTRADA') THEN
    SET v_direcao='ENTRADA'; SET v_saldo_anterior=v_saldo_atual-NEW.quantidade;
  ELSE
    SET v_direcao='SAIDA'; SET v_saldo_anterior=v_saldo_atual+NEW.quantidade;
  END IF;
  INSERT INTO kardex (id_empresa,id_local_estoque,id_setor,id_produto,id_movimentacao,tipo_movimentacao,quantidade,saldo_anterior,saldo_atual)
  VALUES (NEW.id_empresa,NEW.id_local_estoque,NEW.id_setor,NEW.id_produto,NEW.id,v_direcao,NEW.quantidade,v_saldo_anterior,v_saldo_atual);
  INSERT INTO auditoria (id_empresa,id_usuario,tabela,id_registro,acao,dados_novos)
  VALUES (NEW.id_empresa,NEW.id_usuario,'movimentacao_estoque',NEW.id,'INSERT',CONCAT('tipo=',NEW.tipo,'; produto=',NEW.id_produto,'; quantidade=',NEW.quantidade));
END$$
DELIMITER ;
