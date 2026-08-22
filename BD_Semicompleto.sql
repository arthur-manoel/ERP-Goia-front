/* BANCO DE DADOS - SISTEMA DE CONFECÇÃO
   MySQL 8.4 LTS / Aiven for MySQL
   Sistema multiempresa: todo acesso operacional deve ser filtrado por id_empresa.
   Ordem de criação respeita dependências de FK.

   Segurança obrigatória: a conta usada pela aplicação não deve receber SELECT,
   INSERT, UPDATE ou DELETE diretos nas tabelas operacionais. Exponha apenas
   procedures controladas e consultas que sempre recebam/validem id_empresa.
   MySQL 8.4 não possui Row-Level Security nativo; sigilo absoluto no banco exige
   contas/esquemas separados por empresa, ou uma camada de aplicação confiável.
*/

SET NAMES utf8mb4;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

CREATE TABLE empresas (
    id INT NOT NULL AUTO_INCREMENT,
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj VARCHAR(18) NOT NULL,
    inscricao_estadual VARCHAR(30),
    email VARCHAR(150),
    telefone VARCHAR(30),
    endereco VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    status ENUM('ATIVA','INATIVA') NOT NULL DEFAULT 'ATIVA',
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_empresa_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE cargos (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    PRIMARY KEY (id),
    CONSTRAINT fk_cargos_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_cargo_empresa_nome (id_empresa, nome)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE refresh_tokens (
    id INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    data_criacao DATETIME NOT NULL,
    data_expiracao DATETIME NOT NULL,
    revogado TINYINT(1) NOT NULL DEFAULT 0,
    data_revogacao DATETIME,
    ip VARCHAR(45),
    user_agent VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_refresh_token_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uk_refresh_token (token),
    KEY idx_refresh_usuario (id_usuario),
    KEY idx_refresh_expiracao (data_expiracao)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE usuario_empresa (
    id INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_empresa INT NOT NULL,
    id_cargo INT NOT NULL,
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    data_vinculo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_usuario_empresa_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_usuario_empresa_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_usuario_empresa_cargo FOREIGN KEY (id_cargo) REFERENCES cargos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_usuario_empresa (id_usuario, id_empresa)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE clientes (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    nome_razao_social VARCHAR(150) NOT NULL,
    cpf_cnpj VARCHAR(20),
    email VARCHAR(150),
    telefone VARCHAR(30),
    endereco VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_clientes_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    KEY idx_cliente_empresa (id_empresa)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE fornecedores (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT,
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj VARCHAR(18),
    inscricao_estadual VARCHAR(30),
    email VARCHAR(150),
    telefone VARCHAR(30),
    endereco VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_fornecedores_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uk_fornecedor_empresa_cnpj (id_empresa, cnpj)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE empresa_fornecedor (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_fornecedor INT NOT NULL,
    prazo_pagamento INT,
    prazo_entrega INT,
    observacao VARCHAR(255),
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    PRIMARY KEY (id),
    CONSTRAINT fk_empresa_fornecedor_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_empresa_fornecedor_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_empresa_fornecedor (id_empresa, id_fornecedor)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE categorias (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    status ENUM('ATIVA','INATIVA') NOT NULL DEFAULT 'ATIVA',
    PRIMARY KEY (id),
    CONSTRAINT fk_categorias_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uk_categoria_empresa_nome (id_empresa, nome)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE modelos (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    PRIMARY KEY (id),
    CONSTRAINT fk_modelos_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uk_modelo_empresa_nome (id_empresa, nome)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE cores (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT,
    nome VARCHAR(100) NOT NULL,
    codigo_hex VARCHAR(7),
    status ENUM('ATIVA','INATIVA') NOT NULL DEFAULT 'ATIVA',
    PRIMARY KEY (id),
    CONSTRAINT fk_cores_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uk_cor_empresa_nome (id_empresa, nome)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE tipos_produto (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_tipo_produto_nome (nome)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE produtos (
    id INT NOT NULL AUTO_INCREMENT,
    id_tipo_produto INT NOT NULL,
    id_categoria INT,
    id_modelo INT,
    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    unidade VARCHAR(20) NOT NULL DEFAULT 'UN',
    controla_estoque TINYINT(1) NOT NULL DEFAULT 1,
    permite_venda TINYINT(1) NOT NULL DEFAULT 0,
    permite_compra TINYINT(1) NOT NULL DEFAULT 0,
    permite_producao TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_produtos_tipo FOREIGN KEY (id_tipo_produto) REFERENCES tipos_produto(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_produtos_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_produtos_modelo FOREIGN KEY (id_modelo) REFERENCES modelos(id) ON UPDATE CASCADE ON DELETE SET NULL,
    KEY idx_produto_codigo (codigo),
    KEY idx_produto_categoria (id_categoria),
    KEY idx_produto_modelo (id_modelo)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE produto_empresa (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_produto INT NOT NULL,
    codigo_interno VARCHAR(100),
    preco_venda DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    custo_atual DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    valor_estoque_atual DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    estoque_minimo DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    estoque_maximo DECIMAL(15,3),
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    PRIMARY KEY (id),
    CONSTRAINT fk_produto_empresa_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_produto_empresa_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_produto_empresa (id_empresa, id_produto),
    UNIQUE KEY uk_codigo_interno_empresa (id_empresa, codigo_interno)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE produto_fornecedor (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_produto INT NOT NULL,
    id_fornecedor INT NOT NULL,
    codigo_produto_fornecedor VARCHAR(100),
    preco_ultima_compra DECIMAL(15,2),
    prazo_entrega_dias INT,
    quantidade_minima DECIMAL(15,3),
    fornecedor_principal TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    PRIMARY KEY (id),
    CONSTRAINT fk_produto_fornecedor_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_produto_fornecedor_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_produto_fornecedor_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_produto_fornecedor (id_empresa, id_produto, id_fornecedor)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE setores (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('FABRICA','AVIAMENTO','ESTOQUE','LOJA','EXPEDICAO','OUTRO') NOT NULL DEFAULT 'OUTRO',
    descricao VARCHAR(255),
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    PRIMARY KEY (id),
    CONSTRAINT fk_setores_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uk_setor_empresa_nome (id_empresa, nome)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE estoque (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_setor INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    quantidade_reservada DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_estoque_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_estoque_setor FOREIGN KEY (id_setor) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_estoque_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_estoque_empresa_setor_produto (id_empresa, id_setor, id_produto)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

/* Requisição interna que antecede o pedido enviado ao fornecedor. */
CREATE TABLE requisicao_compra (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_setor_solicitante INT NOT NULL,
    id_usuario_solicitante INT NOT NULL,
    numero VARCHAR(50) NOT NULL,
    status ENUM('RASCUNHO','ABERTA','APROVADA','ATENDIDA','CANCELADA') NOT NULL DEFAULT 'RASCUNHO',
    data_solicitacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_req_compra_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_req_compra_setor FOREIGN KEY (id_setor_solicitante) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_req_compra_usuario FOREIGN KEY (id_usuario_solicitante) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_req_compra_empresa_numero (id_empresa, numero)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE item_requisicao_compra (
    id INT NOT NULL AUTO_INCREMENT,
    id_requisicao_compra INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    observacao VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_item_req_compra_requisicao FOREIGN KEY (id_requisicao_compra) REFERENCES requisicao_compra(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_item_req_compra_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_item_req_compra_produto (id_requisicao_compra, id_produto)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE pedido_compra (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_fornecedor INT NOT NULL,
    id_requisicao_compra INT,
    id_usuario INT NOT NULL,
    numero VARCHAR(50) NOT NULL,
    data_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('RASCUNHO','EMITIDO','PARCIAL','RECEBIDO','CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
    observacao VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_pedido_compra_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_compra_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_compra_requisicao FOREIGN KEY (id_requisicao_compra) REFERENCES requisicao_compra(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_pedido_compra_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_pedido_compra_empresa_numero (id_empresa, numero)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE item_pedido_compra (
    id INT NOT NULL AUTO_INCREMENT,
    id_pedido_compra INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    valor_unitario DECIMAL(15,2) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_item_pedido_compra_pedido FOREIGN KEY (id_pedido_compra) REFERENCES pedido_compra(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_item_pedido_compra_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE nota_fiscal (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_fornecedor INT NOT NULL,
    id_pedido_compra INT,
    id_setor_destino INT,
    numero VARCHAR(30) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    chave_acesso VARCHAR(44) NOT NULL,
    status ENUM('PENDENTE','RECEBIDA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    data_emissao DATETIME,
    data_recebimento DATETIME,
    valor_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    entrada_processada TINYINT(1) NOT NULL DEFAULT 0,
    data_processamento DATETIME,
    observacao VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_nota_fiscal_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nota_fiscal_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nota_fiscal_pedido FOREIGN KEY (id_pedido_compra) REFERENCES pedido_compra(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_nota_fiscal_setor_destino FOREIGN KEY (id_setor_destino) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_nf_chave_acesso (chave_acesso),
    UNIQUE KEY uk_nf_empresa_numero_serie (id_empresa, numero, serie)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE item_nota_fiscal (
    id INT NOT NULL AUTO_INCREMENT,
    id_nota_fiscal INT NOT NULL,
    numero_item INT NOT NULL,
    id_produto INT,
    codigo_produto VARCHAR(100),
    descricao_produto VARCHAR(255),
    quantidade DECIMAL(15,3) NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    valor_unitario DECIMAL(15,2) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    produto_cadastrado_automaticamente TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_item_nf_nota FOREIGN KEY (id_nota_fiscal) REFERENCES nota_fiscal(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_item_nf_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_item_nf (id_nota_fiscal, numero_item)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE ordem_producao (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_usuario INT NOT NULL,
    id_setor INT,
    numero VARCHAR(50) NOT NULL,
    status ENUM('PLANEJADA','AGUARDANDO_MATERIAL','LIBERADA','EM_PRODUCAO','PAUSADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'PLANEJADA',
    data_inicio DATETIME,
    data_previsao DATETIME,
    data_conclusao DATETIME,
    observacao VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_ordem_producao_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ordem_producao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ordem_producao_setor FOREIGN KEY (id_setor) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_ordem_producao_empresa_numero (id_empresa, numero)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE ordem_producao_item (
    id INT NOT NULL AUTO_INCREMENT,
    id_ordem_producao INT NOT NULL,
    id_produto INT NOT NULL,
    id_modelo INT,
    id_cor INT,
    tamanho VARCHAR(30) NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    quantidade_produzida DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    PRIMARY KEY (id),
    CONSTRAINT fk_op_item_ordem FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_op_item_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_op_item_modelo FOREIGN KEY (id_modelo) REFERENCES modelos(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_op_item_cor FOREIGN KEY (id_cor) REFERENCES cores(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE necessidade_producao (
    id INT NOT NULL AUTO_INCREMENT,
    id_ordem_producao INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade_necessaria DECIMAL(15,3) NOT NULL,
    quantidade_reservada DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    quantidade_consumida DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    status ENUM('PENDENTE','PARCIAL','RESERVADA','CONSUMIDA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    PRIMARY KEY (id),
    CONSTRAINT fk_necessidade_op FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_necessidade_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT
    ,UNIQUE KEY uk_necessidade_op_produto (id_ordem_producao, id_produto)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE consumo_producao (
    id INT NOT NULL AUTO_INCREMENT,
    id_ordem_producao INT NOT NULL,
    id_necessidade_producao INT NOT NULL,
    id_reserva_estoque INT NOT NULL,
    id_produto INT NOT NULL,
    id_setor INT NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    data_consumo DATETIME,
    id_usuario INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_consumo_op FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_consumo_necessidade FOREIGN KEY (id_necessidade_producao) REFERENCES necessidade_producao(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_consumo_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_consumo_setor FOREIGN KEY (id_setor) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_consumo_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE venda (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_cliente INT NOT NULL,
    id_usuario INT NOT NULL,
    numero VARCHAR(50) NOT NULL,
    status ENUM('RASCUNHO','CONFIRMADA','SEPARACAO','FATURADA','ENVIADA','ENTREGUE','CANCELADA') NOT NULL DEFAULT 'RASCUNHO',
    data_venda TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_entrega DATETIME,
    valor_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id),
    CONSTRAINT fk_venda_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_venda_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_venda_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_venda_empresa_numero (id_empresa, numero)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE item_venda (
    id INT NOT NULL AUTO_INCREMENT,
    id_venda INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    valor_unitario DECIMAL(15,2) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_item_venda_venda FOREIGN KEY (id_venda) REFERENCES venda(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_item_venda_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT
    ,UNIQUE KEY uk_item_venda_produto (id_venda, id_produto)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE reserva_estoque (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_setor INT NOT NULL,
    id_produto INT NOT NULL,
    tipo_origem ENUM('VENDA','ORDEM_PRODUCAO') NOT NULL,
    id_venda INT,
    id_ordem_producao INT,
    id_necessidade_producao INT,
    quantidade DECIMAL(15,3) NOT NULL,
    status ENUM('ATIVA','ATENDIDA','CANCELADA') NOT NULL DEFAULT 'ATIVA',
    id_usuario INT NOT NULL,
    data_reserva TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_finalizacao DATETIME,
    PRIMARY KEY (id),
    CONSTRAINT fk_reserva_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_setor FOREIGN KEY (id_setor) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_venda FOREIGN KEY (id_venda) REFERENCES venda(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_reserva_ordem FOREIGN KEY (id_ordem_producao) REFERENCES ordem_producao(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_reserva_necessidade FOREIGN KEY (id_necessidade_producao) REFERENCES necessidade_producao(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

ALTER TABLE consumo_producao
    ADD CONSTRAINT fk_consumo_reserva FOREIGN KEY (id_reserva_estoque)
    REFERENCES reserva_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE movimentacao_estoque (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_setor INT NOT NULL,
    id_produto INT NOT NULL,
    tipo ENUM('ENTRADA_NF','SAIDA_VENDA','ENTRADA_PRODUCAO','SAIDA_PRODUCAO','AJUSTE_ENTRADA','AJUSTE_SAIDA','TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SAIDA') NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    origem_tipo VARCHAR(50),
    origem_id INT,
    id_usuario INT NOT NULL,
    data_movimentacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_mov_estoque_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mov_estoque_setor FOREIGN KEY (id_setor) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mov_estoque_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mov_estoque_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE kardex (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_setor INT NOT NULL,
    id_produto INT NOT NULL,
    id_movimentacao INT NOT NULL,
    tipo_movimentacao ENUM('ENTRADA','SAIDA') NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    saldo_anterior DECIMAL(15,3) NOT NULL,
    saldo_atual DECIMAL(15,3) NOT NULL,
    data_movimentacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_kardex_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_kardex_setor FOREIGN KEY (id_setor) REFERENCES setores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_kardex_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_kardex_movimentacao FOREIGN KEY (id_movimentacao) REFERENCES movimentacao_estoque(id) ON UPDATE CASCADE ON DELETE RESTRICT
    ,UNIQUE KEY uk_kardex_movimentacao (id_movimentacao)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE auditoria (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT,
    id_usuario INT,
    tabela VARCHAR(100) NOT NULL,
    id_registro INT,
    acao ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
    dados_anteriores TEXT,
    dados_novos TEXT,
    ip VARCHAR(45),
    data_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_auditoria_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE ficha_tecnica (
    id INT NOT NULL AUTO_INCREMENT,
    id_empresa INT NOT NULL,
    id_produto INT NOT NULL,
    versao INT NOT NULL DEFAULT 1,
    status ENUM('RASCUNHO','ATIVA','INATIVA') NOT NULL DEFAULT 'RASCUNHO',
    data_vigencia DATE,
    PRIMARY KEY (id),
    CONSTRAINT fk_ficha_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ficha_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_ficha_produto_versao (id_empresa, id_produto, versao)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE ficha_tecnica_item (
    id INT NOT NULL AUTO_INCREMENT,
    id_ficha_tecnica INT NOT NULL,
    id_produto_componente INT NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    perda_percentual DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id),
    CONSTRAINT fk_ficha_item_ficha FOREIGN KEY (id_ficha_tecnica) REFERENCES ficha_tecnica(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ficha_item_componente FOREIGN KEY (id_produto_componente) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uk_ficha_item_componente (id_ficha_tecnica, id_produto_componente)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

/* =========================================================
   PROCEDURES + TRIGGERS CORRIGIDOS
   Compatível com MySQL 8.4 LTS / Aiven for MySQL

   Principais correções:
   - validação de empresa/setor/produto/usuário;
   - operações críticas atômicas;
   - prevenção de duplicidade;
   - reserva de produção atualiza necessidade;
   - consumo de produção baixa também a reserva;
   - conclusão de produção exige necessidades consumidas;
   - entrega de venda exige reservas compatíveis;
   - entrada/saída aceitam somente tipos válidos;
   - cadastro automático de produto vincula o produto à empresa;
   - triggers mantêm quantidade_reservada >= 0.
   ========================================================= */

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_entrada_estoque$$
CREATE PROCEDURE sp_entrada_estoque(
    IN p_id_empresa INT,
    IN p_id_setor INT,
    IN p_id_produto INT,
    IN p_quantidade DECIMAL(15,3),
    IN p_tipo VARCHAR(50),
    IN p_origem_id INT,
    IN p_id_usuario INT,
    IN p_observacao VARCHAR(255)
)
BEGIN
    DECLARE v_estoque_id INT DEFAULT NULL;
    DECLARE v_saldo_anterior DECIMAL(15,3) DEFAULT 0;
    DECLARE v_saldo_atual DECIMAL(15,3);
    DECLARE v_movimentacao_id INT;
    DECLARE v_dummy INT;

    IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade de entrada deve ser maior que zero';
    END IF;

    IF p_tipo IS NULL OR p_tipo NOT IN
       ('ENTRADA_NF','ENTRADA_PRODUCAO','AJUSTE_ENTRADA','TRANSFERENCIA_ENTRADA') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de entrada de estoque invalido';
    END IF;

    SELECT id INTO v_dummy
    FROM setores
    WHERE id = p_id_setor AND id_empresa = p_id_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Setor nao pertence a empresa ou esta inativo';
    END IF;

    SET v_dummy = NULL;
    SELECT pe.id INTO v_dummy
    FROM produto_empresa pe
    WHERE pe.id_empresa = p_id_empresa
      AND pe.id_produto = p_id_produto
      AND pe.status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto nao esta habilitado para esta empresa';
    END IF;

    SET v_dummy = NULL;
    SELECT ue.id INTO v_dummy
    FROM usuario_empresa ue
    WHERE ue.id_usuario = p_id_usuario
      AND ue.id_empresa = p_id_empresa
      AND ue.status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario nao esta vinculado a esta empresa';
    END IF;

    SELECT id, quantidade
    INTO v_estoque_id, v_saldo_anterior
    FROM estoque
    WHERE id_empresa = p_id_empresa
      AND id_setor = p_id_setor
      AND id_produto = p_id_produto
    FOR UPDATE;

    IF v_estoque_id IS NULL THEN
        SET v_saldo_atual = p_quantidade;
        INSERT INTO estoque
            (id_empresa,id_setor,id_produto,quantidade,quantidade_reservada)
        VALUES
            (p_id_empresa,p_id_setor,p_id_produto,p_quantidade,0);
    ELSE
        SET v_saldo_atual = v_saldo_anterior + p_quantidade;
        UPDATE estoque
        SET quantidade = v_saldo_atual
        WHERE id = v_estoque_id;
    END IF;

    INSERT INTO movimentacao_estoque
        (id_empresa,id_setor,id_produto,tipo,quantidade,
         origem_tipo,origem_id,id_usuario,observacao)
    VALUES
        (p_id_empresa,p_id_setor,p_id_produto,p_tipo,p_quantidade,
         p_tipo,p_origem_id,p_id_usuario,p_observacao);

    SET v_movimentacao_id = LAST_INSERT_ID();

END$$


DROP PROCEDURE IF EXISTS sp_saida_estoque$$
CREATE PROCEDURE sp_saida_estoque(
    IN p_id_empresa INT,
    IN p_id_setor INT,
    IN p_id_produto INT,
    IN p_quantidade DECIMAL(15,3),
    IN p_tipo VARCHAR(50),
    IN p_origem_id INT,
    IN p_id_usuario INT,
    IN p_observacao VARCHAR(255)
)
BEGIN
    DECLARE v_estoque_id INT DEFAULT NULL;
    DECLARE v_saldo_anterior DECIMAL(15,3) DEFAULT 0;
    DECLARE v_saldo_atual DECIMAL(15,3);
    DECLARE v_movimentacao_id INT;
    DECLARE v_dummy INT;

    IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade de saida deve ser maior que zero';
    END IF;

    IF p_tipo IS NULL OR p_tipo NOT IN
       ('SAIDA_VENDA','SAIDA_PRODUCAO','AJUSTE_SAIDA','TRANSFERENCIA_SAIDA') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de saida de estoque invalido';
    END IF;

    SELECT id INTO v_dummy
    FROM setores
    WHERE id = p_id_setor AND id_empresa = p_id_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Setor nao pertence a empresa ou esta inativo';
    END IF;

    SET v_dummy = NULL;
    SELECT pe.id INTO v_dummy
    FROM produto_empresa pe
    WHERE pe.id_empresa = p_id_empresa
      AND pe.id_produto = p_id_produto
      AND pe.status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto nao esta habilitado para esta empresa';
    END IF;

    SET v_dummy = NULL;
    SELECT ue.id INTO v_dummy
    FROM usuario_empresa ue
    WHERE ue.id_usuario = p_id_usuario
      AND ue.id_empresa = p_id_empresa
      AND ue.status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario nao esta vinculado a esta empresa';
    END IF;

    SELECT id, quantidade
    INTO v_estoque_id, v_saldo_anterior
    FROM estoque
    WHERE id_empresa = p_id_empresa
      AND id_setor = p_id_setor
      AND id_produto = p_id_produto
    FOR UPDATE;

    IF v_estoque_id IS NULL THEN
        SET v_saldo_atual = -p_quantidade;
        INSERT INTO estoque
            (id_empresa,id_setor,id_produto,quantidade,quantidade_reservada)
        VALUES
            (p_id_empresa,p_id_setor,p_id_produto,-p_quantidade,0);
    ELSE
        SET v_saldo_atual = v_saldo_anterior - p_quantidade;
        UPDATE estoque
        SET quantidade = v_saldo_atual
        WHERE id = v_estoque_id;
    END IF;

    /* Estoque negativo e permitido por regra de negocio. */

    INSERT INTO movimentacao_estoque
        (id_empresa,id_setor,id_produto,tipo,quantidade,
         origem_tipo,origem_id,id_usuario,observacao)
    VALUES
        (p_id_empresa,p_id_setor,p_id_produto,p_tipo,p_quantidade,
         p_tipo,p_origem_id,p_id_usuario,p_observacao);

    SET v_movimentacao_id = LAST_INSERT_ID();

END$$


DROP PROCEDURE IF EXISTS sp_processar_nota_fiscal$$
CREATE PROCEDURE sp_processar_nota_fiscal(
    IN p_id_nota_fiscal INT,
    IN p_id_setor INT,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_empresa INT DEFAULT NULL;
    DECLARE v_status VARCHAR(20);
    DECLARE v_processada TINYINT;
    DECLARE v_fim INT DEFAULT 0;
    DECLARE v_id_item INT;
    DECLARE v_produto INT;
    DECLARE v_quantidade DECIMAL(15,3);
    DECLARE v_dummy INT;

    DECLARE cur_itens CURSOR FOR
        SELECT id,id_produto,quantidade
        FROM item_nota_fiscal
        WHERE id_nota_fiscal = p_id_nota_fiscal
        ORDER BY numero_item;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_fim = 1;

    START TRANSACTION;

    SELECT id_empresa,status,entrada_processada
    INTO v_empresa,v_status,v_processada
    FROM nota_fiscal
    WHERE id = p_id_nota_fiscal
    FOR UPDATE;

    IF v_empresa IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nota fiscal nao encontrada';
    END IF;

    IF v_status NOT IN ('PENDENTE','RECEBIDA') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nota fiscal cancelada nao pode ser recebida';
    END IF;

    IF v_processada = 1 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Entrada da nota fiscal ja foi processada';
    END IF;

    SELECT id INTO v_dummy
    FROM setores
    WHERE id = p_id_setor AND id_empresa = v_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Setor invalido para a empresa da NF';
    END IF;

    SET v_dummy = NULL;
    SELECT id INTO v_dummy
    FROM usuario_empresa
    WHERE id_usuario = p_id_usuario AND id_empresa = v_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario nao pertence a empresa da NF';
    END IF;

    OPEN cur_itens;

    loop_itens: LOOP
        FETCH cur_itens INTO v_id_item,v_produto,v_quantidade;

        IF v_fim = 1 THEN
            LEAVE loop_itens;
        END IF;

        IF v_produto IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Existe item da NF sem produto cadastrado. Cadastre o produto antes de processar a entrada';
        END IF;

        IF v_quantidade <= 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Existe item da NF com quantidade invalida';
        END IF;

        CALL sp_entrada_estoque(
            v_empresa,p_id_setor,v_produto,v_quantidade,
            'ENTRADA_NF',p_id_nota_fiscal,p_id_usuario,
            'Entrada automatica atraves da nota fiscal'
        );
    END LOOP;

    CLOSE cur_itens;

    UPDATE nota_fiscal
    SET status = 'RECEBIDA',
        data_recebimento = COALESCE(data_recebimento,NOW()),
        entrada_processada = 1,
        data_processamento = NOW()
    WHERE id = p_id_nota_fiscal;

    COMMIT;
END$$


/* Nome explícito para o evento de chegada física da nota ao estoque. */
DROP PROCEDURE IF EXISTS sp_receber_nota_fiscal$$
CREATE PROCEDURE sp_receber_nota_fiscal(
    IN p_id_nota_fiscal INT,
    IN p_id_setor INT,
    IN p_id_usuario INT
)
BEGIN
    CALL sp_processar_nota_fiscal(p_id_nota_fiscal,p_id_setor,p_id_usuario);
END$$


DROP PROCEDURE IF EXISTS sp_reservar_estoque$$
CREATE PROCEDURE sp_reservar_estoque(
    IN p_id_empresa INT,
    IN p_id_setor INT,
    IN p_id_produto INT,
    IN p_quantidade DECIMAL(15,3),
    IN p_tipo_origem VARCHAR(30),
    IN p_id_venda INT,
    IN p_id_ordem_producao INT,
    IN p_id_necessidade INT,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_id_estoque INT DEFAULT NULL;
    DECLARE v_id_necessidade INT DEFAULT NULL;
    DECLARE v_empresa_origem INT DEFAULT NULL;
    DECLARE v_qtd_necessaria DECIMAL(15,3);
    DECLARE v_qtd_reservada DECIMAL(15,3);
    DECLARE v_qtd_consumida DECIMAL(15,3);
    DECLARE v_qtd_item_venda DECIMAL(15,3);
    DECLARE v_status VARCHAR(20);
    DECLARE v_dummy INT;

    START TRANSACTION;

    IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade de reserva invalida';
    END IF;

    IF p_tipo_origem NOT IN ('VENDA','ORDEM_PRODUCAO') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de origem da reserva invalido';
    END IF;

    SELECT id INTO v_dummy
    FROM setores
    WHERE id = p_id_setor AND id_empresa = p_id_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Setor nao pertence a empresa';
    END IF;

    SET v_dummy = NULL;
    SELECT pe.id INTO v_dummy
    FROM produto_empresa pe
    WHERE pe.id_empresa = p_id_empresa
      AND pe.id_produto = p_id_produto
      AND pe.status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto nao esta habilitado para a empresa';
    END IF;

    SET v_dummy = NULL;
    SELECT id INTO v_dummy
    FROM usuario_empresa
    WHERE id_usuario = p_id_usuario AND id_empresa = p_id_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario nao pertence a empresa';
    END IF;

    IF p_tipo_origem = 'VENDA' THEN
        IF p_id_venda IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venda e obrigatoria para reserva do tipo VENDA';
        END IF;

        SELECT id_empresa INTO v_empresa_origem
        FROM venda
        WHERE id = p_id_venda
        FOR UPDATE;

        IF v_empresa_origem IS NULL OR v_empresa_origem <> p_id_empresa THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venda nao pertence a empresa informada';
        END IF;

        IF EXISTS (
            SELECT 1 FROM venda
            WHERE id = p_id_venda AND status IN ('RASCUNHO','CANCELADA','ENTREGUE')
        ) THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venda nao esta em estado que permita reserva';
        END IF;

        SET v_qtd_item_venda = NULL;
        SELECT quantidade INTO v_qtd_item_venda
        FROM item_venda
        WHERE id_venda = p_id_venda AND id_produto = p_id_produto
        FOR UPDATE;

        IF v_qtd_item_venda IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto reservado nao pertence aos itens da venda';
        END IF;

        SELECT COALESCE(SUM(quantidade),0) INTO v_qtd_reservada
        FROM reserva_estoque
        WHERE id_venda = p_id_venda
          AND id_produto = p_id_produto
          AND tipo_origem = 'VENDA'
          AND status = 'ATIVA';

        IF v_qtd_reservada + p_quantidade > v_qtd_item_venda THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reserva excede a quantidade do item da venda';
        END IF;
    ELSE
        IF p_id_ordem_producao IS NULL OR p_id_necessidade IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ordem e necessidade sao obrigatorias para reserva de producao';
        END IF;

        SELECT id INTO v_dummy
        FROM ordem_producao
        WHERE id = p_id_ordem_producao
          AND id_empresa = p_id_empresa
          AND status NOT IN ('CONCLUIDA','CANCELADA')
        FOR UPDATE;

        IF v_dummy IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ordem de producao invalida';
        END IF;

        SELECT id,id_ordem_producao,id_produto,quantidade_necessaria,
               quantidade_reservada,quantidade_consumida,status
        INTO v_id_necessidade,v_dummy,v_empresa_origem,v_qtd_necessaria,
             v_qtd_reservada,v_qtd_consumida,v_status
        FROM necessidade_producao
        WHERE id = p_id_necessidade
        FOR UPDATE;

        IF v_id_necessidade IS NULL
           OR v_dummy <> p_id_ordem_producao
           OR v_empresa_origem <> p_id_produto THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Necessidade nao corresponde a ordem/produto informado';
        END IF;

        IF v_status = 'CANCELADA' OR v_qtd_consumida >= v_qtd_necessaria THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Necessidade nao pode mais receber reserva';
        END IF;

        IF v_qtd_reservada + p_quantidade > v_qtd_necessaria - v_qtd_consumida THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade reservada excede a necessidade restante';
        END IF;
    END IF;

    SELECT id INTO v_id_estoque
    FROM estoque
    WHERE id_empresa = p_id_empresa
      AND id_setor = p_id_setor
      AND id_produto = p_id_produto
    FOR UPDATE;

    IF v_id_estoque IS NULL THEN
        INSERT INTO estoque
            (id_empresa,id_setor,id_produto,quantidade,quantidade_reservada)
        VALUES
            (p_id_empresa,p_id_setor,p_id_produto,0,p_quantidade);
    ELSE
        UPDATE estoque
        SET quantidade_reservada = quantidade_reservada + p_quantidade
        WHERE id = v_id_estoque;
    END IF;

    INSERT INTO reserva_estoque
        (id_empresa,id_setor,id_produto,tipo_origem,id_venda,
         id_ordem_producao,id_necessidade_producao,quantidade,status,id_usuario)
    VALUES
        (p_id_empresa,p_id_setor,p_id_produto,p_tipo_origem,p_id_venda,
         p_id_ordem_producao,p_id_necessidade,p_quantidade,'ATIVA',p_id_usuario);

    IF p_tipo_origem = 'ORDEM_PRODUCAO' THEN
        UPDATE necessidade_producao
        SET quantidade_reservada = quantidade_reservada + p_quantidade,
            status = CASE
                WHEN quantidade_reservada + p_quantidade >= quantidade_necessaria
                     THEN 'RESERVADA'
                ELSE 'PARCIAL'
            END
        WHERE id = p_id_necessidade;

        /* A reserva pode existir antes do material chegar.
           A OP fica aguardando material até o estoque fisico ser suficiente. */
        UPDATE ordem_producao op
        SET status = CASE
            WHEN (
                SELECT COUNT(*)
                FROM necessidade_producao np
                WHERE np.id_ordem_producao = op.id
                  AND np.status <> 'CANCELADA'
                  AND np.quantidade_reservada < np.quantidade_necessaria
            ) > 0 THEN 'AGUARDANDO_MATERIAL'
            ELSE 'LIBERADA'
        END
        WHERE op.id = p_id_ordem_producao;
    END IF;

    COMMIT;
END$$


DROP PROCEDURE IF EXISTS sp_finalizar_reserva$$
CREATE PROCEDURE sp_finalizar_reserva(
    IN p_id_reserva INT,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_empresa INT DEFAULT NULL;
    DECLARE v_setor INT;
    DECLARE v_produto INT;
    DECLARE v_quantidade DECIMAL(15,3);
    DECLARE v_status VARCHAR(20);
    DECLARE v_tipo VARCHAR(30);
    DECLARE v_id_venda INT;
    DECLARE v_dummy INT;

    START TRANSACTION;

    SELECT id_empresa,id_setor,id_produto,quantidade,status,tipo_origem,id_venda
    INTO v_empresa,v_setor,v_produto,v_quantidade,v_status,v_tipo,v_id_venda
    FROM reserva_estoque
    WHERE id = p_id_reserva
    FOR UPDATE;

    IF v_empresa IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reserva nao encontrada';
    END IF;

    IF v_status <> 'ATIVA' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reserva nao esta ativa';
    END IF;

    IF v_tipo <> 'VENDA' OR v_id_venda IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Somente reservas de venda podem ser finalizadas por esta procedure';
    END IF;

    SET v_dummy = NULL;
    SELECT id INTO v_dummy
    FROM usuario_empresa
    WHERE id_usuario = p_id_usuario AND id_empresa = v_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario nao pertence a empresa da reserva';
    END IF;

    SELECT id INTO v_dummy
    FROM estoque
    WHERE id_empresa = v_empresa
      AND id_setor = v_setor
      AND id_produto = v_produto
    FOR UPDATE;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque da reserva nao encontrado';
    END IF;

    CALL sp_saida_estoque(
        v_empresa,v_setor,v_produto,v_quantidade,
        'SAIDA_VENDA',p_id_reserva,p_id_usuario,
        'Saida referente a reserva de venda'
    );

    UPDATE estoque
    SET quantidade_reservada = quantidade_reservada - v_quantidade
    WHERE id_empresa = v_empresa
      AND id_setor = v_setor
      AND id_produto = v_produto;

    UPDATE reserva_estoque
    SET status = 'ATENDIDA',
        data_finalizacao = NOW()
    WHERE id = p_id_reserva;

    COMMIT;
END$$


DROP PROCEDURE IF EXISTS sp_cancelar_reserva$$
CREATE PROCEDURE sp_cancelar_reserva(
    IN p_id_reserva INT
)
BEGIN
    DECLARE v_empresa INT DEFAULT NULL;
    DECLARE v_setor INT;
    DECLARE v_produto INT;
    DECLARE v_quantidade DECIMAL(15,3);
    DECLARE v_status VARCHAR(20);
    DECLARE v_tipo VARCHAR(30);
    DECLARE v_necessidade INT;

    START TRANSACTION;

    SELECT id_empresa,id_setor,id_produto,quantidade,status,tipo_origem,id_necessidade_producao
    INTO v_empresa,v_setor,v_produto,v_quantidade,v_status,v_tipo,v_necessidade
    FROM reserva_estoque
    WHERE id = p_id_reserva
    FOR UPDATE;

    IF v_empresa IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reserva nao encontrada';
    END IF;

    IF v_status <> 'ATIVA' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Somente reservas ativas podem ser canceladas';
    END IF;

    UPDATE estoque
    SET quantidade_reservada = quantidade_reservada - v_quantidade
    WHERE id_empresa = v_empresa
      AND id_setor = v_setor
      AND id_produto = v_produto;

    IF ROW_COUNT() = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque da reserva nao encontrado';
    END IF;

    IF v_tipo = 'ORDEM_PRODUCAO' AND v_necessidade IS NOT NULL THEN
        UPDATE necessidade_producao
        SET quantidade_reservada =
              CASE
                WHEN quantidade_reservada >= v_quantidade
                THEN quantidade_reservada - v_quantidade
                ELSE 0
              END,
            status =
              CASE
                WHEN quantidade_consumida >= quantidade_necessaria THEN 'CONSUMIDA'
                WHEN quantidade_reservada - v_quantidade <= 0 THEN 'PENDENTE'
                ELSE 'PARCIAL'
              END
        WHERE id = v_necessidade;
    END IF;

    UPDATE reserva_estoque
    SET status = 'CANCELADA',
        data_finalizacao = NOW()
    WHERE id = p_id_reserva;

    COMMIT;
END$$


DROP PROCEDURE IF EXISTS sp_consumir_producao$$
CREATE PROCEDURE sp_consumir_producao(
    IN p_id_consumo INT
)
BEGIN
    DECLARE v_empresa INT DEFAULT NULL;
    DECLARE v_setor INT;
    DECLARE v_produto INT;
    DECLARE v_quantidade DECIMAL(15,3);
    DECLARE v_op INT;
    DECLARE v_usuario INT;
    DECLARE v_necessidade INT;
    DECLARE v_reserva INT;
    DECLARE v_qtd_reserva_item DECIMAL(15,3);
    DECLARE v_status_reserva VARCHAR(20);
    DECLARE v_qtd_necessaria DECIMAL(15,3);
    DECLARE v_qtd_consumida DECIMAL(15,3);
    DECLARE v_qtd_reservada DECIMAL(15,3);
    DECLARE v_status VARCHAR(20);
    DECLARE v_data DATETIME;

    START TRANSACTION;

    SELECT op.id_empresa,cp.id_setor,cp.id_produto,cp.quantidade,
           cp.id_ordem_producao,cp.id_usuario,cp.id_necessidade_producao,cp.id_reserva_estoque,
           cp.data_consumo
    INTO v_empresa,v_setor,v_produto,v_quantidade,
         v_op,v_usuario,v_necessidade,v_reserva,v_data
    FROM consumo_producao cp
    INNER JOIN ordem_producao op ON op.id = cp.id_ordem_producao
    WHERE cp.id = p_id_consumo
    FOR UPDATE;

    IF v_empresa IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Consumo de producao nao encontrado';
    END IF;

    IF v_data IS NOT NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este consumo de producao ja foi processado';
    END IF;

    IF v_quantidade IS NULL OR v_quantidade <= 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade de consumo invalida';
    END IF;

    SELECT quantidade_necessaria,quantidade_consumida,quantidade_reservada,status
    INTO v_qtd_necessaria,v_qtd_consumida,v_qtd_reservada,v_status
    FROM necessidade_producao
    WHERE id = v_necessidade
      AND id_ordem_producao = v_op
      AND id_produto = v_produto
    FOR UPDATE;

    IF v_qtd_necessaria IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Necessidade de producao nao corresponde ao consumo';
    END IF;

    IF v_status = 'CANCELADA' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Necessidade de producao cancelada';
    END IF;

    IF v_qtd_consumida + v_quantidade > v_qtd_necessaria THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Consumo excede a necessidade de producao';
    END IF;

    SELECT quantidade,status
    INTO v_qtd_reserva_item,v_status_reserva
    FROM reserva_estoque
    WHERE id = v_reserva
      AND tipo_origem = 'ORDEM_PRODUCAO'
      AND id_ordem_producao = v_op
      AND id_necessidade_producao = v_necessidade
      AND id_produto = v_produto
    FOR UPDATE;

    IF v_status_reserva <> 'ATIVA' OR v_qtd_reserva_item <> v_quantidade THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Consumo deve corresponder a uma reserva ativa da mesma necessidade';
    END IF;

    CALL sp_saida_estoque(
        v_empresa,v_setor,v_produto,v_quantidade,
        'SAIDA_PRODUCAO',v_op,v_usuario,
        'Consumo de materia-prima na producao'
    );

    /* Consumo efetivo libera a parte correspondente da reserva de producao. */
    UPDATE estoque
    SET quantidade_reservada =
        CASE
            WHEN quantidade_reservada >= v_quantidade
            THEN quantidade_reservada - v_quantidade
            ELSE 0
        END
    WHERE id_empresa = v_empresa
      AND id_setor = v_setor
      AND id_produto = v_produto;

    UPDATE necessidade_producao
    SET quantidade_consumida = quantidade_consumida + v_quantidade,
        quantidade_reservada =
            CASE
                WHEN quantidade_reservada >= v_quantidade
                THEN quantidade_reservada - v_quantidade
                ELSE 0
            END,
        status =
            CASE
                WHEN quantidade_consumida + v_quantidade >= quantidade_necessaria
                    THEN 'CONSUMIDA'
                WHEN quantidade_reservada - v_quantidade > 0
                    THEN 'RESERVADA'
                ELSE 'PARCIAL'
            END
    WHERE id = v_necessidade;

    UPDATE reserva_estoque
    SET status = 'ATENDIDA',
        data_finalizacao = NOW()
    WHERE id = v_reserva;

    UPDATE consumo_producao
    SET data_consumo = NOW()
    WHERE id = p_id_consumo;

    /* Se todas as necessidades estiverem reservadas/consumidas, libera a OP.
       Se ainda houver necessidade material, mantém AGUARDANDO_MATERIAL. */
    UPDATE ordem_producao op
    SET status =
        CASE
            WHEN (
                SELECT COUNT(*)
                FROM necessidade_producao np
                WHERE np.id_ordem_producao = op.id
                  AND np.status <> 'CANCELADA'
                  AND np.quantidade_consumida < np.quantidade_necessaria
                  AND np.quantidade_reservada < (np.quantidade_necessaria - np.quantidade_consumida)
            ) = 0
            THEN 'EM_PRODUCAO'
            ELSE 'AGUARDANDO_MATERIAL'
        END
    WHERE op.id = v_op
      AND op.status NOT IN ('CONCLUIDA','CANCELADA');

    COMMIT;
END$$


DROP PROCEDURE IF EXISTS sp_concluir_producao$$
CREATE PROCEDURE sp_concluir_producao(
    IN p_id_ordem_producao INT,
    IN p_id_setor INT,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_empresa INT DEFAULT NULL;
    DECLARE v_status VARCHAR(30);
    DECLARE v_fim INT DEFAULT 0;
    DECLARE v_produto INT;
    DECLARE v_quantidade DECIMAL(15,3);
    DECLARE v_pendencias INT DEFAULT 0;
    DECLARE v_dummy INT;

    DECLARE cur_produtos CURSOR FOR
        SELECT id_produto,quantidade_produzida
        FROM ordem_producao_item
        WHERE id_ordem_producao = p_id_ordem_producao
        ORDER BY id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_fim = 1;

    START TRANSACTION;

    SELECT id_empresa,status
    INTO v_empresa,v_status
    FROM ordem_producao
    WHERE id = p_id_ordem_producao
    FOR UPDATE;

    IF v_empresa IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ordem de producao nao encontrada';
    END IF;

    IF v_status IN ('CONCLUIDA','CANCELADA') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ordem de producao nao pode ser concluida neste estado';
    END IF;

    SELECT COUNT(*) INTO v_pendencias
    FROM necessidade_producao
    WHERE id_ordem_producao = p_id_ordem_producao
      AND status <> 'CANCELADA'
      AND quantidade_consumida < quantidade_necessaria;

    IF v_pendencias > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nao e possivel concluir a OP: existem materias-primas nao consumidas';
    END IF;

    SELECT COUNT(*) INTO v_pendencias
    FROM ordem_producao_item
    WHERE id_ordem_producao = p_id_ordem_producao
      AND (quantidade <= 0 OR quantidade_produzida <= 0);

    IF v_pendencias > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nao e possivel concluir a OP: existem itens sem quantidade produzida';
    END IF;

    SELECT id INTO v_dummy
    FROM setores
    WHERE id = p_id_setor AND id_empresa = v_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Setor de producao invalido';
    END IF;

    SET v_dummy = NULL;
    SELECT id INTO v_dummy
    FROM usuario_empresa
    WHERE id_usuario = p_id_usuario AND id_empresa = v_empresa AND status = 'ATIVO'
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario nao pertence a empresa';
    END IF;

    OPEN cur_produtos;

    loop_produtos: LOOP
        FETCH cur_produtos INTO v_produto,v_quantidade;

        IF v_fim = 1 THEN
            LEAVE loop_produtos;
        END IF;

        CALL sp_entrada_estoque(
            v_empresa,p_id_setor,v_produto,v_quantidade,
            'ENTRADA_PRODUCAO',p_id_ordem_producao,p_id_usuario,
            'Entrada de produto acabado proveniente da producao'
        );
    END LOOP;

    CLOSE cur_produtos;

    UPDATE ordem_producao
    SET status = 'CONCLUIDA',
        data_conclusao = NOW()
        data_conclusao = NOW()
    WHERE id = p_id_ordem_producao;

    COMMIT;
END$$


DROP PROCEDURE IF EXISTS sp_entregar_venda$$
CREATE PROCEDURE sp_entregar_venda(
    IN p_id_venda INT,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_empresa INT DEFAULT NULL;
    DECLARE v_status VARCHAR(30);
    DECLARE v_fim INT DEFAULT 0;
    DECLARE v_id_reserva INT;
    DECLARE v_id_produto INT;
    DECLARE v_qtd_item DECIMAL(15,3);
    DECLARE v_qtd_reservada DECIMAL(15,3);
    DECLARE v_setor_reserva INT;
    DECLARE v_produto_reserva INT;
    DECLARE v_qtd_reserva DECIMAL(15,3);
    DECLARE v_usuario_empresa INT DEFAULT NULL;

    DECLARE cur_itens CURSOR FOR
        SELECT id_produto,quantidade
        FROM item_venda
        WHERE id_venda = p_id_venda
        ORDER BY id;

    DECLARE cur_reservas CURSOR FOR
        SELECT id
        FROM reserva_estoque
        WHERE id_venda = p_id_venda
          AND status = 'ATIVA'
        ORDER BY id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_fim = 1;

    START TRANSACTION;

    SELECT id_empresa,status
    INTO v_empresa,v_status
    FROM venda
    WHERE id = p_id_venda
    FOR UPDATE;

    IF v_empresa IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venda nao encontrada';
    END IF;

    IF v_status = 'ENTREGUE' OR v_status = 'CANCELADA' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venda nao pode ser entregue neste estado';
    END IF;

    IF v_status = 'RASCUNHO' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venda ainda esta em rascunho';
    END IF;

    SELECT id INTO v_usuario_empresa
    FROM usuario_empresa
    WHERE id_usuario = p_id_usuario AND id_empresa = v_empresa AND status = 'ATIVO'
    LIMIT 1;
    IF v_usuario_empresa IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario nao pertence a empresa da venda';
    END IF;

    SET v_fim = 0;
    OPEN cur_itens;

    loop_itens: LOOP
        FETCH cur_itens INTO v_id_produto,v_qtd_item;

        IF v_fim = 1 THEN
            LEAVE loop_itens;
        END IF;

        SELECT COALESCE(SUM(re.quantidade),0)
        INTO v_qtd_reservada
        FROM reserva_estoque re
        WHERE re.id_venda = p_id_venda
          AND re.id_produto = v_id_produto
          AND re.tipo_origem = 'VENDA'
          AND re.status = 'ATIVA';

        IF v_qtd_reservada <> v_qtd_item THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venda nao possui reservas exatamente iguais aos itens';
        END IF;
    END LOOP;

    CLOSE cur_itens;

    SELECT COUNT(*) INTO v_qtd_reservada
    FROM reserva_estoque re
    LEFT JOIN item_venda iv ON iv.id_venda = re.id_venda AND iv.id_produto = re.id_produto
    WHERE re.id_venda = p_id_venda AND re.status = 'ATIVA' AND iv.id IS NULL;
    IF v_qtd_reservada > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venda possui reserva de produto que nao pertence aos itens';
    END IF;

    SET v_fim = 0;
    OPEN cur_reservas;

    loop_reservas: LOOP
        FETCH cur_reservas INTO v_id_reserva;

        IF v_fim = 1 THEN
            LEAVE loop_reservas;
        END IF;

        SELECT id_setor,id_produto,quantidade
        INTO v_setor_reserva,v_produto_reserva,v_qtd_reserva
        FROM reserva_estoque
        WHERE id = v_id_reserva
        FOR UPDATE;

        CALL sp_saida_estoque(
            v_empresa,v_setor_reserva,v_produto_reserva,v_qtd_reserva,
            'SAIDA_VENDA',v_id_reserva,p_id_usuario,
            'Saida referente a reserva de venda'
        );

        UPDATE estoque
        SET quantidade_reservada = quantidade_reservada - v_qtd_reserva
        WHERE id_empresa = v_empresa AND id_setor = v_setor_reserva AND id_produto = v_produto_reserva;

        UPDATE reserva_estoque
        SET status = 'ATENDIDA', data_finalizacao = NOW()
        WHERE id = v_id_reserva;
    END LOOP;

    CLOSE cur_reservas;

    UPDATE venda
    SET status = 'ENTREGUE',
        data_entrega = NOW()
    WHERE id = p_id_venda;

    COMMIT;
END$$


DROP PROCEDURE IF EXISTS sp_consultar_disponibilidade$$
CREATE PROCEDURE sp_consultar_disponibilidade(
    IN p_id_empresa INT,
    IN p_id_setor INT,
    IN p_id_produto INT
)
BEGIN
    SELECT
        p_id_produto AS id_produto,
        COALESCE(e.quantidade,0.000) AS estoque_fisico,
        COALESCE(e.quantidade_reservada,0.000) AS quantidade_reservada,
        COALESCE(e.quantidade,0.000) - COALESCE(e.quantidade_reservada,0.000) AS disponivel
    FROM (SELECT 1 AS x) AS base
    LEFT JOIN estoque e
      ON e.id_empresa = p_id_empresa
     AND e.id_setor = p_id_setor
     AND e.id_produto = p_id_produto;
END$$


/* Explode uma ficha técnica ativa e cria as necessidades da ordem de produção. */
DROP PROCEDURE IF EXISTS sp_gerar_necessidades_op$$
CREATE PROCEDURE sp_gerar_necessidades_op(
    IN p_id_ordem_producao INT,
    IN p_id_ficha_tecnica INT
)
BEGIN
    DECLARE v_empresa INT DEFAULT NULL;
    DECLARE v_produto INT DEFAULT NULL;
    DECLARE v_ficha_empresa INT DEFAULT NULL;
    DECLARE v_status VARCHAR(20);
    DECLARE v_status_op VARCHAR(30);
    DECLARE v_itens_op INT DEFAULT 0;

    START TRANSACTION;

    SELECT id_empresa,status INTO v_empresa,v_status_op
    FROM ordem_producao WHERE id = p_id_ordem_producao FOR UPDATE;
    SELECT id_empresa,id_produto,status INTO v_ficha_empresa,v_produto,v_status
    FROM ficha_tecnica WHERE id = p_id_ficha_tecnica FOR UPDATE;

    IF v_empresa IS NULL OR v_ficha_empresa <> v_empresa OR v_status <> 'ATIVA' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ficha tecnica ativa nao pertence a empresa da ordem';
    END IF;

    IF v_status_op <> 'PLANEJADA' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Necessidades so podem ser geradas para uma OP planejada';
    END IF;

    SELECT COUNT(*) INTO v_itens_op
    FROM ordem_producao_item
    WHERE id_ordem_producao = p_id_ordem_producao
      AND id_produto = v_produto;

    IF v_itens_op = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A ordem nao possui item para o produto da ficha tecnica';
    END IF;

    INSERT INTO necessidade_producao
        (id_ordem_producao,id_produto,quantidade_necessaria,quantidade_reservada,quantidade_consumida,status)
    SELECT p_id_ordem_producao,fti.id_produto_componente,
           SUM(opi.quantidade * fti.quantidade * (1 + fti.perda_percentual / 100)),
           0,0,'PENDENTE'
    FROM ordem_producao_item opi
    INNER JOIN ficha_tecnica_item fti ON fti.id_ficha_tecnica = p_id_ficha_tecnica
    WHERE opi.id_ordem_producao = p_id_ordem_producao
      AND opi.id_produto = v_produto
    GROUP BY fti.id_produto_componente
    ON DUPLICATE KEY UPDATE
        quantidade_necessaria = VALUES(quantidade_necessaria),
        quantidade_reservada = 0,
        quantidade_consumida = 0,
        status = 'PENDENTE';

    UPDATE ordem_producao
    SET status = 'AGUARDANDO_MATERIAL'
    WHERE id = p_id_ordem_producao AND status = 'PLANEJADA';

    COMMIT;
END$$


DROP PROCEDURE IF EXISTS sp_cadastrar_produto_nf$$
CREATE PROCEDURE sp_cadastrar_produto_nf(
    IN p_id_item_nf INT,
    IN p_id_tipo_produto INT,
    IN p_id_categoria INT
)
BEGIN
    DECLARE v_codigo VARCHAR(100) DEFAULT NULL;
    DECLARE v_descricao VARCHAR(255);
    DECLARE v_unidade VARCHAR(20);
    DECLARE v_produto INT DEFAULT NULL;
    DECLARE v_empresa INT DEFAULT NULL;
    DECLARE v_dummy INT;

    START TRANSACTION;

    SELECT nf.id_empresa,inf.codigo_produto,inf.descricao_produto,inf.unidade
    INTO v_empresa,v_codigo,v_descricao,v_unidade
    FROM item_nota_fiscal inf
    INNER JOIN nota_fiscal nf ON nf.id = inf.id_nota_fiscal
    WHERE inf.id = p_id_item_nf
    FOR UPDATE;

    IF v_empresa IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item da nota fiscal nao encontrado';
    END IF;

    IF v_codigo IS NULL OR v_codigo = '' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Codigo do produto da NF nao informado';
    END IF;

    IF p_id_tipo_produto IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de produto e obrigatorio';
    END IF;

    SET v_dummy = NULL;
    SELECT id INTO v_dummy
    FROM tipos_produto
    WHERE id = p_id_tipo_produto
    LIMIT 1;

    IF v_dummy IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de produto inexistente';
    END IF;

    IF p_id_categoria IS NOT NULL THEN
        SET v_dummy = NULL;
        SELECT id INTO v_dummy
        FROM categorias
        WHERE id = p_id_categoria
        LIMIT 1;

        IF v_dummy IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoria inexistente';
        END IF;
    END IF;

    SELECT p.id INTO v_produto
    FROM produtos p
    INNER JOIN produto_empresa pe ON pe.id_produto = p.id
    WHERE p.codigo = v_codigo
      AND pe.id_empresa = v_empresa
      AND pe.status = 'ATIVO'
    LIMIT 1
    FOR UPDATE;

    IF v_produto IS NULL THEN
        INSERT INTO produtos
            (id_tipo_produto,id_categoria,nome,codigo,descricao,unidade,
             controla_estoque,permite_venda,permite_compra,status)
        VALUES
            (p_id_tipo_produto,p_id_categoria,
             COALESCE(NULLIF(v_descricao,''),v_codigo),
             v_codigo,v_descricao,v_unidade,
             1,0,1,'ATIVO');

        SET v_produto = LAST_INSERT_ID();
    END IF;

    /* Mesmo que o produto ja exista globalmente, precisa estar
       habilitado para a empresa da NF. */
    SET v_dummy = NULL;
    SELECT id INTO v_dummy
    FROM produto_empresa
    WHERE id_empresa = v_empresa
      AND id_produto = v_produto
    LIMIT 1;

    IF v_dummy IS NULL THEN
        INSERT INTO produto_empresa
            (id_empresa,id_produto,codigo_interno,status)
        VALUES
            (v_empresa,v_produto,v_codigo,'ATIVO');
    END IF;

    UPDATE item_nota_fiscal
    SET produto_cadastrado_automaticamente =
            CASE
                WHEN id_produto IS NULL THEN 1
                ELSE produto_cadastrado_automaticamente
            END,
        id_produto = v_produto
    WHERE id = p_id_item_nf;

    COMMIT;
END$$


/* =========================================================
   TRIGGERS CORRIGIDOS
   ========================================================= */

DROP TRIGGER IF EXISTS trg_estoque_reserva_insert$$
CREATE TRIGGER trg_estoque_reserva_insert
BEFORE INSERT ON estoque
FOR EACH ROW
BEGIN
    IF NEW.quantidade_reservada IS NULL OR NEW.quantidade_reservada < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantidade reservada nao pode ser negativa';
    END IF;

    IF NEW.quantidade IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantidade de estoque nao pode ser nula';
    END IF;
END$$


DROP TRIGGER IF EXISTS trg_estoque_reserva_update$$
CREATE TRIGGER trg_estoque_reserva_update
BEFORE UPDATE ON estoque
FOR EACH ROW
BEGIN
    IF NEW.quantidade_reservada IS NULL OR NEW.quantidade_reservada < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantidade reservada nao pode ser negativa';
    END IF;

    IF NEW.quantidade IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantidade de estoque nao pode ser nula';
    END IF;
END$$

/* Impede que um usuário receba cargo pertencente a outra empresa. */
DROP TRIGGER IF EXISTS trg_usuario_empresa_empresa_insert$$
CREATE TRIGGER trg_usuario_empresa_empresa_insert
BEFORE INSERT ON usuario_empresa
FOR EACH ROW
BEGIN
    DECLARE v_qtd INT DEFAULT 0;
    SELECT COUNT(*) INTO v_qtd
    FROM cargos
    WHERE id = NEW.id_cargo AND id_empresa = NEW.id_empresa AND status = 'ATIVO';
    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cargo invalido para a empresa do usuario';
    END IF;
END$$

/* Venda só pode usar cliente e usuário vinculados à mesma empresa. */
DROP TRIGGER IF EXISTS trg_venda_empresa_insert$$
CREATE TRIGGER trg_venda_empresa_insert
BEFORE INSERT ON venda
FOR EACH ROW
BEGIN
    DECLARE v_cliente INT DEFAULT 0;
    DECLARE v_usuario INT DEFAULT 0;
    SELECT COUNT(*) INTO v_cliente FROM clientes
    WHERE id = NEW.id_cliente AND id_empresa = NEW.id_empresa AND status = 'ATIVO';
    SELECT COUNT(*) INTO v_usuario FROM usuario_empresa
    WHERE id_usuario = NEW.id_usuario AND id_empresa = NEW.id_empresa AND status = 'ATIVO';
    IF v_cliente = 0 OR v_usuario = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cliente ou usuario nao pertence a empresa da venda';
    END IF;
END$$

/* Pedido e NF só podem referenciar fornecedor já homologado para a empresa. */
DROP TRIGGER IF EXISTS trg_pedido_compra_empresa_insert$$
CREATE TRIGGER trg_pedido_compra_empresa_insert
BEFORE INSERT ON pedido_compra
FOR EACH ROW
BEGIN
    DECLARE v_fornecedor INT DEFAULT 0;
    DECLARE v_usuario INT DEFAULT 0;
    DECLARE v_requisicao INT DEFAULT 0;
    SELECT COUNT(*) INTO v_fornecedor FROM empresa_fornecedor
    WHERE id_empresa = NEW.id_empresa AND id_fornecedor = NEW.id_fornecedor AND status = 'ATIVO';
    SELECT COUNT(*) INTO v_usuario FROM usuario_empresa
    WHERE id_usuario = NEW.id_usuario AND id_empresa = NEW.id_empresa AND status = 'ATIVO';
    IF NEW.id_requisicao_compra IS NULL THEN
        SET v_requisicao = 1;
    ELSE
        SELECT COUNT(*) INTO v_requisicao FROM requisicao_compra
        WHERE id = NEW.id_requisicao_compra AND id_empresa = NEW.id_empresa;
    END IF;
    IF v_fornecedor = 0 OR v_usuario = 0 OR v_requisicao = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fornecedor, requisicao ou usuario invalido para a empresa do pedido';
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_nf_empresa_insert$$
CREATE TRIGGER trg_nf_empresa_insert
BEFORE INSERT ON nota_fiscal
FOR EACH ROW
BEGIN
    DECLARE v_fornecedor INT DEFAULT 0;
    DECLARE v_pedido INT DEFAULT 0;
    SELECT COUNT(*) INTO v_fornecedor FROM empresa_fornecedor
    WHERE id_empresa = NEW.id_empresa AND id_fornecedor = NEW.id_fornecedor AND status = 'ATIVO';
    IF NEW.id_pedido_compra IS NOT NULL THEN
        SELECT COUNT(*) INTO v_pedido FROM pedido_compra
        WHERE id = NEW.id_pedido_compra AND id_empresa = NEW.id_empresa
          AND id_fornecedor = NEW.id_fornecedor;
    ELSE
        SET v_pedido = 1;
    END IF;
    IF v_fornecedor = 0 OR v_pedido = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fornecedor ou pedido de compra nao pertence a empresa da NF';
    END IF;
END$$

/* Uma reserva possui uma única origem, compatível com a empresa e o produto. */
DROP TRIGGER IF EXISTS trg_reserva_origem_insert$$
CREATE TRIGGER trg_reserva_origem_insert
BEFORE INSERT ON reserva_estoque
FOR EACH ROW
BEGIN
    DECLARE v_qtd INT DEFAULT 0;
    IF NEW.quantidade <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantidade da reserva deve ser positiva';
    END IF;
    IF NEW.tipo_origem = 'VENDA' THEN
        IF NEW.id_venda IS NULL OR NEW.id_ordem_producao IS NOT NULL OR NEW.id_necessidade_producao IS NOT NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reserva de venda possui origem invalida';
        END IF;
        SELECT COUNT(*) INTO v_qtd FROM venda
        WHERE id = NEW.id_venda AND id_empresa = NEW.id_empresa;
    ELSE
        IF NEW.id_venda IS NOT NULL OR NEW.id_ordem_producao IS NULL OR NEW.id_necessidade_producao IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reserva de producao possui origem invalida';
        END IF;
        SELECT COUNT(*) INTO v_qtd FROM necessidade_producao np
        INNER JOIN ordem_producao op ON op.id = np.id_ordem_producao
        WHERE np.id = NEW.id_necessidade_producao
          AND np.id_ordem_producao = NEW.id_ordem_producao
          AND np.id_produto = NEW.id_produto
          AND op.id_empresa = NEW.id_empresa;
    END IF;
    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Origem da reserva nao pertence a empresa ou produto informado';
    END IF;
END$$

/* Kardex e auditoria são produzidos automaticamente para toda movimentação. */
DROP TRIGGER IF EXISTS trg_movimentacao_kardex_auditoria$$
CREATE TRIGGER trg_movimentacao_kardex_auditoria
AFTER INSERT ON movimentacao_estoque
FOR EACH ROW
BEGIN
    DECLARE v_saldo_atual DECIMAL(15,3);
    DECLARE v_saldo_anterior DECIMAL(15,3);
    DECLARE v_direcao VARCHAR(10);
    SELECT quantidade INTO v_saldo_atual FROM estoque
    WHERE id_empresa = NEW.id_empresa AND id_setor = NEW.id_setor AND id_produto = NEW.id_produto;
    IF NEW.tipo IN ('ENTRADA_NF','ENTRADA_PRODUCAO','AJUSTE_ENTRADA','TRANSFERENCIA_ENTRADA') THEN
        SET v_direcao = 'ENTRADA';
        SET v_saldo_anterior = v_saldo_atual - NEW.quantidade;
    ELSE
        SET v_direcao = 'SAIDA';
        SET v_saldo_anterior = v_saldo_atual + NEW.quantidade;
    END IF;
    INSERT INTO kardex
        (id_empresa,id_setor,id_produto,id_movimentacao,tipo_movimentacao,quantidade,saldo_anterior,saldo_atual)
    VALUES
        (NEW.id_empresa,NEW.id_setor,NEW.id_produto,NEW.id,v_direcao,NEW.quantidade,v_saldo_anterior,v_saldo_atual);
    INSERT INTO auditoria (id_empresa,id_usuario,tabela,id_registro,acao,dados_novos)
    VALUES
        (NEW.id_empresa,NEW.id_usuario,'movimentacao_estoque',NEW.id,'INSERT',
         CONCAT('tipo=',NEW.tipo,'; produto=',NEW.id_produto,'; quantidade=',NEW.quantidade));
END$$

DELIMITER ;

/* =========================================================
   FIM
   ========================================================= */
