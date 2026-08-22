// Mock data realista para uma empresa de camisaria

export const empresaAtual = {
  id: 'emp-1',
  razaoSocial: 'Camisaria Goiás Confecções LTDA',
  nomeFantasia: 'Goiás Camisaria',
  cnpj: '12.345.678/0001-90',
  email: 'contato@goiascamisaria.com.br',
  telefone: '(62) 3255-1000',
  endereco: 'Av. T-63, 1200 — Setor Bueno, Goiânia/GO',
  status: 'ativa',
  logo: null,
  corPrimaria: '152 60% 45%',
  corSecundaria: '160 20% 18%',
  corDestaque: '43 90% 60%',
  cadastradaEm: '2024-01-12',
}

export const usuarioAtual = {
  id: 'usr-1',
  nome: 'Ana Ribeiro',
  email: 'ana@goiascamisaria.com.br',
  setor: 'Administrativo',
  perfil: 'admin_empresa', // admin_geral | admin_empresa | usuario
  avatar: null,
}

export const empresas = [
  { id: 'emp-1', nomeFantasia: 'Goiás Camisaria', razaoSocial: 'Camisaria Goiás Confecções LTDA', cnpj: '12.345.678/0001-90', email: 'contato@goiascamisaria.com.br', usuarios: 14, status: 'ativa', cadastradaEm: '2024-01-12' },
  { id: 'emp-2', nomeFantasia: 'Cerrado Uniformes', razaoSocial: 'Cerrado Confecções ME', cnpj: '22.987.654/0001-11', email: 'contato@cerradouniformes.com', usuarios: 8, status: 'ativa', cadastradaEm: '2024-03-04' },
  { id: 'emp-3', nomeFantasia: 'Trilha Têxtil', razaoSocial: 'Trilha Têxtil LTDA', cnpj: '33.111.222/0001-55', email: 'financeiro@trilhatextil.com.br', usuarios: 21, status: 'ativa', cadastradaEm: '2024-05-18' },
  { id: 'emp-4', nomeFantasia: 'Bordado Fino', razaoSocial: 'Bordado Fino Confecções', cnpj: '44.555.666/0001-77', email: 'ola@bordadofino.com', usuarios: 3, status: 'inativa', cadastradaEm: '2023-11-02' },
  { id: 'emp-5', nomeFantasia: 'Polo Style', razaoSocial: 'Polo Style Indústria e Comércio', cnpj: '55.777.888/0001-99', email: 'contato@polostyle.com', usuarios: 11, status: 'ativa', cadastradaEm: '2025-02-27' },
]

export const setores = [
  { id: 's1', nome: 'Estoque', tipo: 'Armazenagem', descricao: 'Setor central de matérias-primas', status: 'ativo', usuarios: 3, itens: 128 },
  { id: 's2', nome: 'Corte', tipo: 'Produção', descricao: 'Corte de tecidos', status: 'ativo', usuarios: 4, itens: 42 },
  { id: 's3', nome: 'Costura', tipo: 'Produção', descricao: 'Máquinas de costura', status: 'ativo', usuarios: 6, itens: 88 },
  { id: 's4', nome: 'Acabamento', tipo: 'Produção', descricao: 'Bordado, revisão e passadoria', status: 'ativo', usuarios: 3, itens: 51 },
  { id: 's5', nome: 'Expedição', tipo: 'Logística', descricao: 'Separação e envio', status: 'ativo', usuarios: 2, itens: 210 },
  { id: 's6', nome: 'Loja', tipo: 'Vendas', descricao: 'Loja física do centro', status: 'ativo', usuarios: 3, itens: 76 },
  { id: 's7', nome: 'Compras', tipo: 'Administrativo', descricao: 'Compras e fornecedores', status: 'ativo', usuarios: 2, itens: 0 },
  { id: 's8', nome: 'Administrativo', tipo: 'Administrativo', descricao: 'Financeiro e RH', status: 'ativo', usuarios: 3, itens: 0 },
]

export const usuarios = [
  { id: 'u1', nome: 'Ana Ribeiro', email: 'ana@goiascamisaria.com.br', setor: 'Administrativo', perfil: 'admin_empresa', status: 'ativo', cadastradoEm: '2024-01-15', ultimoAcesso: '2025-06-08 09:22' },
  { id: 'u2', nome: 'Bruno Mendes', email: 'bruno@goiascamisaria.com.br', setor: 'Estoque', perfil: 'usuario', status: 'ativo', cadastradoEm: '2024-02-01', ultimoAcesso: '2025-06-08 08:41' },
  { id: 'u3', nome: 'Carla Souza', email: 'carla@goiascamisaria.com.br', setor: 'Corte', perfil: 'usuario', status: 'ativo', cadastradoEm: '2024-02-14', ultimoAcesso: '2025-06-07 17:03' },
  { id: 'u4', nome: 'Diego Alves', email: 'diego@goiascamisaria.com.br', setor: 'Costura', perfil: 'usuario', status: 'ativo', cadastradoEm: '2024-03-04', ultimoAcesso: '2025-06-08 07:59' },
  { id: 'u5', nome: 'Eduarda Lima', email: 'eduarda@goiascamisaria.com.br', setor: 'Expedição', perfil: 'usuario', status: 'ativo', cadastradoEm: '2024-04-19', ultimoAcesso: '2025-06-06 16:45' },
  { id: 'u6', nome: 'Felipe Nunes', email: 'felipe@goiascamisaria.com.br', setor: 'Loja', perfil: 'usuario', status: 'inativo', cadastradoEm: '2024-05-22', ultimoAcesso: '2025-04-20 12:10' },
  { id: 'u7', nome: 'Gabriela Torres', email: 'gabi@goiascamisaria.com.br', setor: 'Compras', perfil: 'usuario', status: 'ativo', cadastradoEm: '2024-06-01', ultimoAcesso: '2025-06-08 10:11' },
]

export const categorias = [
  { id: 'c1', nome: 'Tecidos', descricao: 'Malha, algodão, poliéster', status: 'ativo' },
  { id: 'c2', nome: 'Aviamentos', descricao: 'Linhas, botões, zíperes', status: 'ativo' },
  { id: 'c3', nome: 'Embalagens', descricao: 'Sacos e etiquetas', status: 'ativo' },
  { id: 'c4', nome: 'Camisas', descricao: 'Produtos acabados', status: 'ativo' },
  { id: 'c5', nome: 'Polos', descricao: 'Camisas polo', status: 'ativo' },
  { id: 'c6', nome: 'Uniformes', descricao: 'Uniformes corporativos', status: 'ativo' },
]

export const modelos = [
  { id: 'm1', nome: 'Básica Manga Curta', descricao: 'Corte reto', status: 'ativo' },
  { id: 'm2', nome: 'Polo Piquet', descricao: 'Gola polo com botões', status: 'ativo' },
  { id: 'm3', nome: 'Social Manga Longa', descricao: 'Punhos e colarinho', status: 'ativo' },
  { id: 'm4', nome: 'Uniforme Esportivo', descricao: 'Dry-fit', status: 'ativo' },
]

export const cores = [
  { id: 'co1', nome: 'Branco', hex: '#F8FAFC', status: 'ativo' },
  { id: 'co2', nome: 'Preto', hex: '#0F172A', status: 'ativo' },
  { id: 'co3', nome: 'Azul Marinho', hex: '#1E3A8A', status: 'ativo' },
  { id: 'co4', nome: 'Vermelho', hex: '#DC2626', status: 'ativo' },
  { id: 'co5', nome: 'Verde Musgo', hex: '#166534', status: 'ativo' },
  { id: 'co6', nome: 'Cinza Grafite', hex: '#374151', status: 'ativo' },
]

export const fornecedores = [
  { id: 'f1', nome: 'Malharia Central LTDA', cnpj: '10.111.222/0001-33', cidade: 'São Paulo/SP', contato: 'compras@malhariacentral.com', telefone: '(11) 4002-8922', status: 'ativo' },
  { id: 'f2', nome: 'Aviamentos Brasil', cnpj: '11.222.333/0001-44', cidade: 'Blumenau/SC', contato: 'vendas@aviamentosbr.com', telefone: '(47) 3222-1010', status: 'ativo' },
  { id: 'f3', nome: 'Bordados Premium', cnpj: '12.333.444/0001-55', cidade: 'Goiânia/GO', contato: 'ola@bordadospremium.com', telefone: '(62) 3111-4433', status: 'ativo' },
  { id: 'f4', nome: 'Embalagens Norte', cnpj: '13.444.555/0001-66', cidade: 'Anápolis/GO', contato: 'contato@embnorte.com', telefone: '(62) 3333-5566', status: 'inativo' },
]

export const clientes = [
  { id: 'cl1', nome: 'Prefeitura de Goiânia', tipo: 'PJ', documento: '02.345.678/0001-11', email: 'compras@goiania.go.gov.br', cidade: 'Goiânia/GO', status: 'ativo' },
  { id: 'cl2', nome: 'Colégio Delta', tipo: 'PJ', documento: '03.456.789/0001-22', email: 'financeiro@colegiodelta.com', cidade: 'Aparecida de Goiânia/GO', status: 'ativo' },
  { id: 'cl3', nome: 'Joana Martins', tipo: 'PF', documento: '123.456.789-00', email: 'joana@email.com', cidade: 'Goiânia/GO', status: 'ativo' },
  { id: 'cl4', nome: 'Time Cerrado FC', tipo: 'PJ', documento: '04.567.890/0001-33', email: 'diretoria@cerradofc.com', cidade: 'Goiânia/GO', status: 'ativo' },
  { id: 'cl5', nome: 'Marcos Andrade', tipo: 'PF', documento: '987.654.321-00', email: 'marcos@email.com', cidade: 'Trindade/GO', status: 'ativo' },
]

export const produtos = [
  { id: 'p1', codigo: 'MP-TEC-001', nome: 'Malha PV 67/33 Branca', tipo: 'materia_prima', categoria: 'Tecidos', modelo: '-', cor: 'Branco', unidade: 'metro', permiteCompra: true, permiteVenda: false, permiteProducao: false, controlaEstoque: true, status: 'ativo', estoqueTotal: 320, reservado: 45, minimo: 100, valorTotal: 6400, valorUnitario: 20.0 },
  { id: 'p2', codigo: 'MP-TEC-002', nome: 'Malha Piquet Azul Marinho', tipo: 'materia_prima', categoria: 'Tecidos', modelo: '-', cor: 'Azul Marinho', unidade: 'metro', permiteCompra: true, permiteVenda: false, permiteProducao: false, controlaEstoque: true, status: 'ativo', estoqueTotal: 180, reservado: 30, minimo: 80, valorTotal: 4680, valorUnitario: 26.0 },
  { id: 'p3', codigo: 'MP-AVI-001', nome: 'Linha Poliéster 120 Preta', tipo: 'materia_prima', categoria: 'Aviamentos', modelo: '-', cor: 'Preto', unidade: 'unidade', permiteCompra: true, permiteVenda: false, permiteProducao: false, controlaEstoque: true, status: 'ativo', estoqueTotal: 25, reservado: 5, minimo: 40, valorTotal: 375, valorUnitario: 15.0 },
  { id: 'p4', codigo: 'MP-AVI-002', nome: 'Botão Camisa Branco 12mm', tipo: 'materia_prima', categoria: 'Aviamentos', modelo: '-', cor: 'Branco', unidade: 'unidade', permiteCompra: true, permiteVenda: false, permiteProducao: false, controlaEstoque: true, status: 'ativo', estoqueTotal: 5200, reservado: 0, minimo: 1000, valorTotal: 520, valorUnitario: 0.1 },
  { id: 'p5', codigo: 'PA-CAM-001', nome: 'Camisa Polo Piquet Marinho', tipo: 'produto_acabado', categoria: 'Polos', modelo: 'Polo Piquet', cor: 'Azul Marinho', unidade: 'unidade', permiteCompra: false, permiteVenda: true, permiteProducao: true, controlaEstoque: true, status: 'ativo', estoqueTotal: 240, reservado: 60, minimo: 50, valorTotal: 14400, valorUnitario: 60.0 },
  { id: 'p6', codigo: 'PA-CAM-002', nome: 'Camisa Básica Branca M/C', tipo: 'produto_acabado', categoria: 'Camisas', modelo: 'Básica Manga Curta', cor: 'Branco', unidade: 'unidade', permiteCompra: false, permiteVenda: true, permiteProducao: true, controlaEstoque: true, status: 'ativo', estoqueTotal: 12, reservado: 0, minimo: 30, valorTotal: 420, valorUnitario: 35.0 },
  { id: 'p7', codigo: 'PA-UNI-001', nome: 'Uniforme Esportivo Vermelho', tipo: 'produto_acabado', categoria: 'Uniformes', modelo: 'Uniforme Esportivo', cor: 'Vermelho', unidade: 'unidade', permiteCompra: false, permiteVenda: true, permiteProducao: true, controlaEstoque: true, status: 'ativo', estoqueTotal: 0, reservado: 0, minimo: 20, valorTotal: 0, valorUnitario: 55.0 },
]

export const estoquePorSetor = [
  { produtoId: 'p1', setor: 'Estoque', total: 220, reservado: 45, disponivel: 175, minimo: 100, valorUnit: 20.0, valorTotal: 4400, atualizadoEm: '2025-06-07 15:22' },
  { produtoId: 'p1', setor: 'Corte', total: 100, reservado: 0, disponivel: 100, minimo: 30, valorUnit: 20.0, valorTotal: 2000, atualizadoEm: '2025-06-07 15:22' },
  { produtoId: 'p2', setor: 'Estoque', total: 180, reservado: 30, disponivel: 150, minimo: 80, valorUnit: 26.0, valorTotal: 4680, atualizadoEm: '2025-06-06 09:15' },
  { produtoId: 'p3', setor: 'Estoque', total: 25, reservado: 5, disponivel: 20, minimo: 40, valorUnit: 15.0, valorTotal: 375, atualizadoEm: '2025-06-05 14:00' },
  { produtoId: 'p4', setor: 'Estoque', total: 5200, reservado: 0, disponivel: 5200, minimo: 1000, valorUnit: 0.1, valorTotal: 520, atualizadoEm: '2025-06-01 10:00' },
  { produtoId: 'p5', setor: 'Expedição', total: 240, reservado: 60, disponivel: 180, minimo: 50, valorUnit: 60.0, valorTotal: 14400, atualizadoEm: '2025-06-08 07:30' },
  { produtoId: 'p6', setor: 'Expedição', total: 12, reservado: 0, disponivel: 12, minimo: 30, valorUnit: 35.0, valorTotal: 420, atualizadoEm: '2025-06-08 08:00' },
  { produtoId: 'p7', setor: 'Expedição', total: 0, reservado: 0, disponivel: 0, minimo: 20, valorUnit: 55.0, valorTotal: 0, atualizadoEm: '2025-06-04 11:45' },
]

export const notasFiscais = [
  { id: 'nf1', numero: '00012345', serie: '1', fornecedor: 'Malharia Central LTDA', chave: '3524061011122200013355001000123451234567890', dataEmissao: '2025-06-01', dataRecebimento: '2025-06-03', setorDestino: 'Estoque', pedido: 'PC-2025-0087', status: 'recebida', valorTotal: 8600, itens: 3 },
  { id: 'nf2', numero: '00012346', serie: '1', fornecedor: 'Aviamentos Brasil', chave: '3524061112223300013355001000123461234567890', dataEmissao: '2025-06-05', dataRecebimento: null, setorDestino: 'Estoque', pedido: 'PC-2025-0091', status: 'pendente', valorTotal: 1240, itens: 2 },
  { id: 'nf3', numero: '00012347', serie: '1', fornecedor: 'Bordados Premium', chave: '3524061233334400013355001000123471234567890', dataEmissao: '2025-06-06', dataRecebimento: null, setorDestino: 'Acabamento', pedido: 'PC-2025-0092', status: 'pendente', valorTotal: 3200, itens: 4 },
  { id: 'nf4', numero: '00012340', serie: '1', fornecedor: 'Embalagens Norte', chave: '3524051344445500013355001000123401234567890', dataEmissao: '2025-05-28', dataRecebimento: '2025-05-30', setorDestino: 'Expedição', pedido: 'PC-2025-0080', status: 'recebida', valorTotal: 950, itens: 2 },
  { id: 'nf5', numero: '00012348', serie: '1', fornecedor: 'Malharia Central LTDA', chave: '', dataEmissao: '2025-05-15', dataRecebimento: null, setorDestino: 'Estoque', pedido: '-', status: 'cancelada', valorTotal: 0, itens: 0 },
]

export const ordensProducao = [
  { id: 'op1', numero: 'OP-2025-0142', produto: 'Camisa Polo Piquet Marinho', setor: 'Costura', planejada: 200, produzida: 200, abertura: '2025-05-20', prazo: '2025-06-05', prioridade: 'normal', status: 'concluida' },
  { id: 'op2', numero: 'OP-2025-0143', produto: 'Camisa Básica Branca M/C', setor: 'Costura', planejada: 300, produzida: 210, abertura: '2025-05-28', prazo: '2025-06-12', prioridade: 'alta', status: 'em_producao' },
  { id: 'op3', numero: 'OP-2025-0144', produto: 'Uniforme Esportivo Vermelho', setor: 'Corte', planejada: 100, produzida: 0, abertura: '2025-06-01', prazo: '2025-06-20', prioridade: 'alta', status: 'aguardando_material' },
  { id: 'op4', numero: 'OP-2025-0145', produto: 'Camisa Polo Piquet Marinho', setor: 'Corte', planejada: 150, produzida: 0, abertura: '2025-06-06', prazo: '2025-06-25', prioridade: 'normal', status: 'aberta' },
  { id: 'op5', numero: 'OP-2025-0146', produto: 'Camisa Básica Branca M/C', setor: 'Costura', planejada: 50, produzida: 0, abertura: '2025-06-08', prazo: '2025-06-15', prioridade: 'normal', status: 'rascunho' },
]

export const fichaTecnicaExemplo = [
  { materia: 'Malha Piquet Azul Marinho', unidade: 'metro', porUnidade: 0.9, necessarioTotal: 180, disponivel: 150, situacao: 'insuficiente' },
  { materia: 'Linha Poliéster 120 Preta', unidade: 'unidade', porUnidade: 0.05, necessarioTotal: 10, disponivel: 20, situacao: 'ok' },
  { materia: 'Botão Camisa Branco 12mm', unidade: 'unidade', porUnidade: 3, necessarioTotal: 600, disponivel: 5200, situacao: 'ok' },
]

export const vendas = [
  { id: 'v1', numero: 'V-2025-0301', cliente: 'Prefeitura de Goiânia', data: '2025-06-01', itens: 200, valor: 24000, status: 'entregue' },
  { id: 'v2', numero: 'V-2025-0302', cliente: 'Colégio Delta', data: '2025-06-03', itens: 120, valor: 8400, status: 'em_separacao' },
  { id: 'v3', numero: 'V-2025-0303', cliente: 'Time Cerrado FC', data: '2025-06-05', itens: 60, valor: 5400, status: 'confirmada' },
  { id: 'v4', numero: 'V-2025-0304', cliente: 'Joana Martins', data: '2025-06-06', itens: 2, valor: 130, status: 'entregue' },
  { id: 'v5', numero: 'V-2025-0305', cliente: 'Marcos Andrade', data: '2025-06-07', itens: 5, valor: 375, status: 'rascunho' },
]

export const kardex = [
  { id: 'k1', data: '2025-06-08 09:22', produto: 'Camisa Polo Piquet Marinho', setor: 'Expedição', tipo: 'saida_venda', origem: 'V-2025-0301', entrada: 0, saida: 200, saldo: 40, valorUnit: 60, valorTotal: 12000, usuario: 'Eduarda Lima' },
  { id: 'k2', data: '2025-06-07 15:22', produto: 'Malha PV 67/33 Branca', setor: 'Estoque', tipo: 'entrada_nf', origem: 'NF-00012345', entrada: 200, saida: 0, saldo: 220, valorUnit: 20, valorTotal: 4400, usuario: 'Bruno Mendes' },
  { id: 'k3', data: '2025-06-07 10:11', produto: 'Camisa Polo Piquet Marinho', setor: 'Expedição', tipo: 'entrada_producao', origem: 'OP-2025-0142', entrada: 200, saida: 0, saldo: 240, valorUnit: 60, valorTotal: 14400, usuario: 'Diego Alves' },
  { id: 'k4', data: '2025-06-06 14:00', produto: 'Malha Piquet Azul Marinho', setor: 'Costura', tipo: 'saida_consumo', origem: 'OP-2025-0142', entrada: 0, saida: 180, saldo: 0, valorUnit: 26, valorTotal: 4680, usuario: 'Diego Alves' },
  { id: 'k5', data: '2025-06-05 09:00', produto: 'Malha Piquet Azul Marinho', setor: 'Estoque', tipo: 'reserva', origem: 'OP-2025-0142', entrada: 0, saida: 30, saldo: 180, valorUnit: 26, valorTotal: 780, usuario: 'Ana Ribeiro' },
  { id: 'k6', data: '2025-06-04 11:45', produto: 'Uniforme Esportivo Vermelho', setor: 'Expedição', tipo: 'ajuste_saida', origem: 'Ajuste manual', entrada: 0, saida: 10, saldo: 0, valorUnit: 55, valorTotal: 550, usuario: 'Ana Ribeiro' },
]

export const auditoria = [
  { id: 'a1', data: '2025-06-08 09:22', usuario: 'Eduarda Lima', setor: 'Expedição', modulo: 'Vendas', acao: 'Venda confirmada como entregue', registro: 'V-2025-0301', ip: '10.0.0.14' },
  { id: 'a2', data: '2025-06-08 08:41', usuario: 'Bruno Mendes', setor: 'Estoque', modulo: 'Notas Fiscais', acao: 'Nota fiscal recebida', registro: 'NF-00012345', ip: '10.0.0.9' },
  { id: 'a3', data: '2025-06-07 17:10', usuario: 'Ana Ribeiro', setor: 'Administrativo', modulo: 'Produtos', acao: 'Produto alterado', registro: 'MP-TEC-002', ip: '10.0.0.2' },
  { id: 'a4', data: '2025-06-07 10:11', usuario: 'Diego Alves', setor: 'Costura', modulo: 'Ordens de Produção', acao: 'OP concluída', registro: 'OP-2025-0142', ip: '10.0.0.22' },
  { id: 'a5', data: '2025-06-06 09:15', usuario: 'Ana Ribeiro', setor: 'Administrativo', modulo: 'Empresa', acao: 'Tema da empresa alterado', registro: 'emp-1', ip: '10.0.0.2' },
  { id: 'a6', data: '2025-06-05 14:32', usuario: 'Gabriela Torres', setor: 'Compras', modulo: 'Pedidos de Compra', acao: 'Pedido criado', registro: 'PC-2025-0092', ip: '10.0.0.31' },
]

export const requisicoes = [
  { id: 'r1', numero: 'RC-2025-0055', setor: 'Costura', solicitante: 'Diego Alves', itens: 2, data: '2025-06-06', status: 'aprovada' },
  { id: 'r2', numero: 'RC-2025-0056', setor: 'Acabamento', solicitante: 'Carla Souza', itens: 1, data: '2025-06-07', status: 'pendente' },
  { id: 'r3', numero: 'RC-2025-0057', setor: 'Corte', solicitante: 'Carla Souza', itens: 3, data: '2025-06-08', status: 'em_analise' },
]

export const pedidosCompra = [
  { id: 'pc1', numero: 'PC-2025-0087', fornecedor: 'Malharia Central LTDA', requisicao: 'RC-2025-0050', itens: 3, valor: 8600, prazoEntrega: '2025-06-03', pagamento: '30 dias', status: 'entregue' },
  { id: 'pc2', numero: 'PC-2025-0091', fornecedor: 'Aviamentos Brasil', requisicao: 'RC-2025-0053', itens: 2, valor: 1240, prazoEntrega: '2025-06-10', pagamento: '15 dias', status: 'em_transito' },
  { id: 'pc3', numero: 'PC-2025-0092', fornecedor: 'Bordados Premium', requisicao: 'RC-2025-0055', itens: 4, valor: 3200, prazoEntrega: '2025-06-12', pagamento: '30 dias', status: 'confirmado' },
]

export const faturamentoMensal = [
  { mes: 'Jan', ano: 32100, atual: 28400 },
  { mes: 'Fev', ano: 36200, atual: 31900 },
  { mes: 'Mar', ano: 41800, atual: 39500 },
  { mes: 'Abr', ano: 39400, atual: 44700 },
  { mes: 'Mai', ano: 45800, atual: 51200 },
  { mes: 'Jun', ano: 47100, atual: 56300 },
]

export const produtosMaisVendidos = [
  { produto: 'Camisa Polo Piquet Marinho', qtd: 420, valor: 25200 },
  { produto: 'Camisa Básica Branca M/C', qtd: 310, valor: 10850 },
  { produto: 'Uniforme Esportivo Vermelho', qtd: 180, valor: 9900 },
  { produto: 'Camisa Social Manga Longa', qtd: 90, valor: 8100 },
  { produto: 'Camiseta Bordada Time', qtd: 60, valor: 4200 },
]

export const distribuicaoEstoque = [
  { setor: 'Estoque', valor: 9975 },
  { setor: 'Corte', valor: 2000 },
  { setor: 'Costura', valor: 1200 },
  { setor: 'Acabamento', valor: 800 },
  { setor: 'Expedição', valor: 14820 },
]

export const permissoesDisponiveis = [
  { chave: 'produtos', nome: 'Produtos', descricao: 'Cadastro e edição de produtos.' },
  { chave: 'estoque', nome: 'Estoque', descricao: 'Consulta e ajustes de estoque.' },
  { chave: 'notas_fiscais', nome: 'Notas Fiscais', descricao: 'Emitir, receber e cancelar NFs de entrada.' },
  { chave: 'ordens_producao', nome: 'Ordens de Produção', descricao: 'Criar, executar e concluir OPs.' },
  { chave: 'categorias', nome: 'Categorias', descricao: 'Gerenciar categorias de produtos.' },
  { chave: 'modelos', nome: 'Modelos', descricao: 'Gerenciar modelos de peças.' },
  { chave: 'cores', nome: 'Cores', descricao: 'Gerenciar cores.' },
  { chave: 'clientes', nome: 'Clientes', descricao: 'Cadastro de clientes.' },
  { chave: 'fornecedores', nome: 'Fornecedores', descricao: 'Cadastro de fornecedores.' },
  { chave: 'vendas', nome: 'Vendas', descricao: 'Registrar e acompanhar vendas.' },
  { chave: 'kardex', nome: 'Kardex', descricao: 'Consulta detalhada de movimentações.' },
  { chave: 'auditoria', nome: 'Auditoria', descricao: 'Consulta ao log de auditoria.' },
]

export const formatBRL = (v) => {
  const valor = Number(v)
  return (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export const formatDate = (s) => {
  if (!s) return '—'
  const [d] = String(s).split(' ')
  const [y, m, day] = d.split('-')
  if (!y || !m || !day) return s
  return `${day}/${m}/${y}`
}
