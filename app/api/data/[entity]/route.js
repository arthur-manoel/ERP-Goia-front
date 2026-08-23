import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'

const QUERIES = {
  produtos: `SELECT p.id, p.nome, COALESCE(pe.codigo_interno,p.codigo) codigo, p.descricao, p.unidade,
    CASE WHEN p.permite_producao=1 OR p.permite_venda=1 THEN 'produto_acabado' ELSE 'materia_prima' END tipo,
    LOWER(pe.status) status, COALESCE(SUM(es.quantidade),0) estoqueTotal,COALESCE(pe.estoque_minimo,0) minimo,LOWER(pe.unidade_estoque_minimo) unidadeMinimo,
    COALESCE(pe.preco_venda,pe.custo_atual,0) valorUnitario, ca.nome categoria, ca.id categoriaId,
    co.nome cor, co.id corId, ta.nome tamanho, ta.id tamanhoId,
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id',pv.id,'corId',CAST(pv.id_cor AS CHAR),'cor',vc.nome,'tamanhoId',CAST(pv.id_tamanho AS CHAR),'tamanho',vt.nome)),JSON_ARRAY())
      FROM produto_variacoes pv LEFT JOIN cores vc ON vc.id=pv.id_cor LEFT JOIN tamanhos vt ON vt.id=pv.id_tamanho
      WHERE pv.id_empresa=pe.id_empresa AND pv.id_produto=p.id AND pv.status='ATIVO') variacoes
    FROM produto_empresa pe JOIN produtos p ON p.id=pe.id_produto
    LEFT JOIN estoque es ON es.id_empresa=pe.id_empresa AND es.id_produto=p.id
    LEFT JOIN categorias ca ON ca.id=p.id_categoria
    LEFT JOIN cores co ON co.id=pe.id_cor LEFT JOIN tamanhos ta ON ta.id=pe.id_tamanho
    WHERE pe.id_empresa=? AND pe.status='ATIVO' GROUP BY p.id,pe.id,ca.nome,ca.id,co.nome,co.id,ta.nome,ta.id ORDER BY p.nome`,
  categorias: `SELECT id,nome,descricao,LOWER(status) status FROM categorias WHERE id_empresa=? ORDER BY nome`,
  cores: `SELECT id,nome,codigo_hex hex,LOWER(status) status FROM cores WHERE id_empresa=? ORDER BY nome`,
  clientes: `SELECT id,nome_razao_social nome,cpf_cnpj documento,
    CASE WHEN LENGTH(REPLACE(REPLACE(REPLACE(cpf_cnpj,'.',''),'/',''),'-',''))=14 THEN 'PJ' ELSE 'PF' END tipo,
    email,telefone,cidade,LOWER(status) status FROM clientes WHERE id_empresa=? ORDER BY nome_razao_social`,
  fornecedores: `SELECT id,COALESCE(nome_fantasia,razao_social) nome,razao_social razaoSocial,cnpj,cidade,email contato,telefone,LOWER(status) status
    FROM fornecedores WHERE id_empresa=? ORDER BY COALESCE(nome_fantasia,razao_social)`,
  setores: `SELECT s.id,s.nome,s.tipo,s.descricao,LOWER(s.status) status,
    (SELECT COUNT(*) FROM usuario_empresa ue WHERE ue.id_empresa=s.id_empresa AND ue.id_setor=s.id) usuarios,
    (SELECT GROUP_CONCAT(ps.recurso ORDER BY ps.recurso) FROM permissoes_setor ps WHERE ps.id_setor=s.id) permissoesCsv
    FROM setores s WHERE s.id_empresa=? ORDER BY s.nome`,
  tamanhos: `SELECT id,nome,descricao,ordem,LOWER(status) status FROM tamanhos WHERE id_empresa=? ORDER BY ordem,nome`,
  locais_estoque: `SELECT le.id,le.nome,le.descricao,LOWER(le.status) status,
    (SELECT COUNT(*) FROM estoque e WHERE e.id_local_estoque=le.id) itens
    FROM locais_estoque le WHERE le.id_empresa=? ORDER BY le.nome`,
  usuarios: `SELECT u.id,u.nome,u.email,s.nome setor,s.id setorId,
    CASE WHEN LOWER(c.nome) LIKE '%admin%' THEN 'admin_empresa' ELSE 'usuario' END perfil,
    LOWER(ue.status) status,DATE(u.data_cadastro) cadastradoEm
    FROM usuario_empresa ue JOIN usuarios u ON u.id=ue.id_usuario JOIN cargos c ON c.id=ue.id_cargo
    LEFT JOIN setores s ON s.id=ue.id_setor WHERE ue.id_empresa=? ORDER BY u.nome`,
  requisicoes: `SELECT r.id,r.numero,le.nome estoque,u.nome solicitante,
    (SELECT COUNT(*) FROM item_requisicao_compra i WHERE i.id_requisicao_compra=r.id) itens,
    DATE(r.data_solicitacao) data,LOWER(r.status) status,r.observacao
    FROM requisicao_compra r LEFT JOIN locais_estoque le ON le.id=r.id_local_estoque JOIN usuarios u ON u.id=r.id_usuario_solicitante
    WHERE r.id_empresa=? ORDER BY r.data_solicitacao DESC`,
  pedidos: `SELECT p.id,p.numero,p.id_ordem_producao opId,COALESCE(f.nome_fantasia,f.razao_social) fornecedor,
    COUNT(i.id) itens,COALESCE(SUM(i.valor_total),0) valor,DATE(p.data_pedido) prazoEntrega,
    '' pagamento,LOWER(p.status) status,p.observacao,
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('produtoId',CAST(ip.id_produto AS CHAR),'quantidade',ip.quantidade,'valorUnitario',ip.valor_unitario)),JSON_ARRAY()) FROM item_pedido_compra ip WHERE ip.id_pedido_compra=p.id) produtos
    FROM pedido_compra p JOIN fornecedores f ON f.id=p.id_fornecedor LEFT JOIN item_pedido_compra i ON i.id_pedido_compra=p.id
    WHERE p.id_empresa=? GROUP BY p.id,f.nome_fantasia,f.razao_social ORDER BY p.data_pedido DESC`,
  notas: `SELECT n.id,n.numero,n.serie,n.chave_acesso chave,COALESCE(f.nome_fantasia,f.razao_social) fornecedor,
    DATE_FORMAT(n.data_emissao,'%Y-%m-%d') dataEmissao,le.nome estoqueDestino,pc.numero pedido,COUNT(i.id) itens,n.valor_total valorTotal,
    LOWER(n.status) status,n.entrada_processada entradaProcessada,n.observacao,
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id',inf.id,'productId',CAST(inf.id_produto AS CHAR),'produtoId',CAST(inf.id_produto AS CHAR),
      'nome',inf.descricao_produto,'codigo',inf.codigo_produto,'unidade',inf.unidade,'quantidade',inf.quantidade,
      'valorUnitario',inf.valor_unitario,'valor',CASE WHEN inf.tipo_valor='TOTAL' THEN inf.valor_total ELSE inf.valor_unitario END,
      'valorTotal',inf.valor_total,'tipoValor',LOWER(inf.tipo_valor),'corId',CAST(inf.id_cor AS CHAR),
      'tamanhoId',CAST(inf.id_tamanho AS CHAR),'novoProduto',FALSE)),JSON_ARRAY())
      FROM item_nota_fiscal inf WHERE inf.id_nota_fiscal=n.id) produtos
    FROM nota_fiscal n JOIN fornecedores f ON f.id=n.id_fornecedor LEFT JOIN locais_estoque le ON le.id=n.id_local_estoque
    LEFT JOIN pedido_compra pc ON pc.id=n.id_pedido_compra LEFT JOIN item_nota_fiscal i ON i.id_nota_fiscal=n.id WHERE n.id_empresa=?
    GROUP BY n.id,f.nome_fantasia,f.razao_social,le.nome,pc.numero ORDER BY n.data_emissao DESC`,
  ops: `SELECT o.id,o.numero,GROUP_CONCAT(DISTINCT p.nome ORDER BY p.nome SEPARATOR ', ') produto,s.nome setor,o.prioridade,
    o.quantidade_planejada planejada,COALESCE(SUM(oi.quantidade_produzida),0) produzida,
    ROUND(CASE WHEN o.quantidade_planejada>0 THEN COALESCE(SUM(oi.quantidade_produzida),0)*100/o.quantidade_planejada ELSE 0 END) progresso,
    DATE_FORMAT(o.data_inicio,'%Y-%m-%d') abertura,DATE_FORMAT(o.data_previsao,'%Y-%m-%d') prazo,LOWER(o.status) status
    FROM ordem_producao o LEFT JOIN ordem_producao_item oi ON oi.id_ordem_producao=o.id LEFT JOIN produtos p ON p.id=oi.id_produto
    LEFT JOIN setores s ON s.id=o.id_setor WHERE o.id_empresa=? GROUP BY o.id,s.nome ORDER BY o.data_inicio DESC`,
  vendas: `SELECT v.id,v.numero,c.nome_razao_social cliente,DATE(v.data_venda) data,
    COUNT(i.id) itens,v.valor_total valor,LOWER(v.status) status
    FROM venda v JOIN clientes c ON c.id=v.id_cliente LEFT JOIN item_venda i ON i.id_venda=v.id
    WHERE v.id_empresa=? GROUP BY v.id,c.nome_razao_social ORDER BY v.data_venda DESC`,
  estoque: `SELECT es.id,es.id_produto produtoId,es.id_local_estoque estoqueId,p.nome produto,COALESCE(pe.codigo_interno,p.codigo) codigo,le.nome estoque,
    es.quantidade total,es.quantidade_reservada reservado,(es.quantidade-es.quantidade_reservada) disponivel,
    COALESCE(pe.estoque_minimo,0) minimo,LOWER(pe.unidade_estoque_minimo) unidadeMinimo,COALESCE(pe.custo_atual,0) valorUnitario,COALESCE(es.quantidade*pe.custo_atual,0) valorTotal
    FROM estoque es JOIN produtos p ON p.id=es.id_produto LEFT JOIN locais_estoque le ON le.id=es.id_local_estoque
    LEFT JOIN produto_empresa pe ON pe.id_empresa=es.id_empresa AND pe.id_produto=es.id_produto
    WHERE es.id_empresa=? ORDER BY p.nome,le.nome`,
  kardex: `SELECT k.id,DATE_FORMAT(k.data_movimentacao,'%d/%m/%Y %H:%i') data,p.nome produto,le.nome estoque,
    LOWER(COALESCE(m.tipo,k.tipo_movimentacao)) tipo,
    CASE WHEN m.origem_tipo='NOTA_FISCAL' THEN CONCAT('NF-',COALESCE(n.numero,m.origem_id)) ELSE COALESCE(CONCAT(m.origem_tipo,'-',m.origem_id),CONCAT('MOV-',k.id_movimentacao),'—') END origem,
    CASE WHEN k.tipo_movimentacao='ENTRADA' THEN k.quantidade ELSE 0 END entrada,
    CASE WHEN k.tipo_movimentacao='SAIDA' THEN ABS(k.quantidade) ELSE 0 END saida,k.saldo_anterior saldoAnterior,k.saldo_atual saldo,
    COALESCE(u.nome,'Sistema') usuario,COALESCE(m.valor_total,0) valorTotal FROM kardex k JOIN produtos p ON p.id=k.id_produto LEFT JOIN locais_estoque le ON le.id=k.id_local_estoque
    LEFT JOIN movimentacao_estoque m ON m.id=k.id_movimentacao LEFT JOIN nota_fiscal n ON n.id=m.origem_id AND m.origem_tipo='NOTA_FISCAL'
    LEFT JOIN usuarios u ON u.id=m.id_usuario
    WHERE k.id_empresa=? ORDER BY k.data_movimentacao DESC`,
  auditoria: `SELECT a.id,DATE_FORMAT(a.data_evento,'%d/%m/%Y %H:%i') data,COALESCE(u.nome,'Sistema') usuario,
    COALESCE(s.nome,'—') setor,a.tabela modulo,a.acao,CONCAT(a.tabela,' #',a.id_registro) registro,COALESCE(a.ip,'—') ip,a.dados_novos detalhes
    FROM auditoria a LEFT JOIN usuarios u ON u.id=a.id_usuario
    LEFT JOIN usuario_empresa ue ON ue.id_usuario=u.id AND ue.id_empresa=a.id_empresa LEFT JOIN setores s ON s.id=ue.id_setor
    WHERE a.id_empresa=? ORDER BY a.data_evento DESC`,
}

export async function GET(request, { params }) {
  try {
    const { entity } = await params
    const empresaId = new URL(request.url).searchParams.get('empresaId')
    if (!empresaId || !/^\d+$/.test(empresaId)) return NextResponse.json({ error: 'Empresa inválida.' }, { status: 400 })
    const sql = QUERIES[entity]
    if (!sql) return NextResponse.json({ error: 'Entidade não suportada.' }, { status: 404 })
    const [rows] = await getDb().execute(sql, [empresaId])
    return NextResponse.json(rows.map(row => ({ ...row, id: String(row.id), empresaId: String(empresaId), ...(entity === 'setores' ? { permissoes: row.permissoesCsv ? row.permissoesCsv.split(',') : [] } : {}), ...(['notas','pedidos'].includes(entity) ? { produtos: typeof row.produtos === 'string' ? JSON.parse(row.produtos) : (row.produtos || []) } : {}), ...(entity === 'produtos' ? { variacoes: typeof row.variacoes === 'string' ? JSON.parse(row.variacoes) : (row.variacoes || []) } : {}) })))
  } catch (error) {
    console.error('Erro ao carregar dados MySQL:', error)
    return NextResponse.json({ error: 'Não foi possível carregar os dados.' }, { status: 500 })
  }
}

const upper = (value, fallback = 'ATIVO') => String(value || fallback).toUpperCase()
const firstId = async (connection, sql, params) => (await connection.execute(sql, params))[0][0]?.id || null
const PREFIXOS = { produtos: 'PROD', requisicoes: 'RC', pedidos: 'PC', notas: 'NF', ops: 'OP', vendas: 'V' }
async function automaticCode(connection, entity, empresaId) {
  await connection.execute(`INSERT INTO sequencias_automaticas (id_empresa,entidade,ultimo_numero) VALUES (?,?,LAST_INSERT_ID(1))
    ON DUPLICATE KEY UPDATE ultimo_numero=LAST_INSERT_ID(ultimo_numero+1)`, [empresaId, entity])
  const [[row]] = await connection.query('SELECT LAST_INSERT_ID() numero')
  return `${PREFIXOS[entity] || entity.toUpperCase()}-${String(row.numero).padStart(6, '0')}`
}

async function createEntity(connection, entity, body, empresaId) {
  let result
  if (entity === 'categorias') {
    const status = String(body.status).toLowerCase().startsWith('inativ') ? 'INATIVA' : 'ATIVA'
    ;[result] = await connection.execute(`INSERT INTO ${entity} (id_empresa,nome,descricao,status) VALUES (?,?,?,?)`, [empresaId, body.nome, body.descricao || null, status])
  } else if (entity === 'cores') {
    const status = String(body.status).toLowerCase().startsWith('inativ') ? 'INATIVA' : 'ATIVA'
    ;[result] = await connection.execute('INSERT INTO cores (id_empresa,nome,codigo_hex,status) VALUES (?,?,?,?)', [empresaId, body.nome, body.hex || null, status])
  } else if (entity === 'clientes') {
    ;[result] = await connection.execute('INSERT INTO clientes (id_empresa,nome_razao_social,cpf_cnpj,email,cidade,status) VALUES (?,?,?,?,?,?)', [empresaId, body.nome, body.documento || null, body.email || null, body.cidade || null, upper(body.status)])
  } else if (entity === 'fornecedores') {
    ;[result] = await connection.execute('INSERT INTO fornecedores (id_empresa,razao_social,nome_fantasia,cnpj,email,telefone,cidade,status) VALUES (?,?,?,?,?,?,?,?)', [empresaId, body.nome, body.nome, body.cnpj || null, body.contato || null, body.telefone || null, body.cidade || null, upper(body.status)])
  } else if (entity === 'setores') {
    const typeMap = { armazenagem: 'ESTOQUE', produção: 'FABRICA', logistica: 'EXPEDICAO', logística: 'EXPEDICAO', vendas: 'LOJA', administrativo: 'OUTRO' }
    ;[result] = await connection.execute('INSERT INTO setores (id_empresa,nome,tipo,descricao,status) VALUES (?,?,?,?,?)', [empresaId, body.nome, typeMap[String(body.tipo || '').toLowerCase()] || 'OUTRO', body.descricao || null, upper(body.status)])
    for (const recurso of (body.permissoes || [])) await connection.execute('INSERT INTO permissoes_setor (id_setor,recurso) VALUES (?,?)', [result.insertId, recurso])
  } else if (entity === 'tamanhos') {
    ;[result] = await connection.execute('INSERT INTO tamanhos (id_empresa,nome,descricao,ordem,status) VALUES (?,?,?,?,?)', [empresaId, body.nome, body.descricao || null, Number(body.ordem || 0), upper(body.status)])
  } else if (entity === 'locais_estoque') {
    ;[result] = await connection.execute('INSERT INTO locais_estoque (id_empresa,nome,descricao,status) VALUES (?,?,?,?)', [empresaId, body.nome, body.descricao || null, upper(body.status)])
  } else if (entity === 'usuarios') {
    const email = body.email.trim().toLowerCase()
    let userId = await firstId(connection, 'SELECT id FROM usuarios WHERE LOWER(email)=?', [email])
    if (!userId) {
      const hash = await bcrypt.hash(body.senha, 12)
      const [created] = await connection.execute('INSERT INTO usuarios (nome,email,senha,nivel_acesso,status) VALUES (?,?,?,?,?)', [body.nome, email, hash, body.perfil === 'admin_empresa' ? 'ADMIN' : 'USUARIO', upper(body.status)])
      userId = created.insertId
    }
    let cargoId = await firstId(connection, 'SELECT id FROM cargos WHERE id_empresa=? AND LOWER(nome)=LOWER(?)', [empresaId, body.perfil === 'admin_empresa' ? 'Administrador da empresa' : 'Usuário'])
    if (!cargoId) {
      const [cargo] = await connection.execute('INSERT INTO cargos (id_empresa,nome,status) VALUES (?,?,?)', [empresaId, body.perfil === 'admin_empresa' ? 'Administrador da empresa' : 'Usuário', 'ATIVO'])
      cargoId = cargo.insertId
    }
    const setorId = body.setorId || await firstId(connection, 'SELECT id FROM setores WHERE id_empresa=? AND nome=?', [empresaId, body.setor])
    ;[result] = await connection.execute('INSERT INTO usuario_empresa (id_usuario,id_empresa,id_cargo,id_setor,nivel_acesso,status) VALUES (?,?,?,?,?,?)', [userId, empresaId, cargoId, setorId, body.perfil === 'admin_empresa' ? 'EMPRESA' : 'USUARIO', upper(body.status)])
  } else if (entity === 'produtos') {
    if (body.codigoAutomatico !== false) body.codigo = await automaticCode(connection, entity, empresaId)
    if (!body.codigo?.trim()) throw Object.assign(new Error('Informe o código do produto.'), { status: 400 })
    let tipoId = await firstId(connection, 'SELECT id FROM tipos_produto WHERE nome=? LIMIT 1', [body.tipo === 'produto_acabado' ? 'Produto acabado' : 'Matéria-prima'])
    if (!tipoId) { const [tipo] = await connection.execute('INSERT INTO tipos_produto (nome) VALUES (?)', [body.tipo === 'produto_acabado' ? 'Produto acabado' : 'Matéria-prima']); tipoId = tipo.insertId }
    const categoryId = body.tipo === 'produto_acabado' ? (body.categoriaId || null) : null
    const [product] = await connection.execute(`INSERT INTO produtos (id_tipo_produto,id_categoria,nome,codigo,descricao,unidade,controla_estoque,permite_venda,permite_compra,permite_producao,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [tipoId, categoryId, body.nome, body.codigo, body.descricao || null, body.unidade || 'UN', 1, body.tipo === 'produto_acabado' ? 1 : 0, body.tipo === 'materia_prima' ? 1 : 0, body.tipo === 'produto_acabado' ? 1 : 0, upper(body.status)])
    const corIds = Array.isArray(body.corIds) ? body.corIds : (body.corId ? [body.corId] : [])
    const tamanhoIds = Array.isArray(body.tamanhoIds) ? body.tamanhoIds : (body.tamanhoId ? [body.tamanhoId] : [])
    ;[result] = await connection.execute('INSERT INTO produto_empresa (id_empresa,id_produto,id_cor,id_tamanho,codigo_interno,estoque_minimo,unidade_estoque_minimo,status) VALUES (?,?,?,?,?,?,?,?)', [empresaId, product.insertId, corIds[0] || null, tamanhoIds[0] || null, body.codigo, Number(body.minimo || 0), upper(body.unidadeMinimo || 'UNIDADE'), upper(body.status)])
    for (const corId of (corIds.length ? corIds : [null])) for (const tamanhoId of (tamanhoIds.length ? tamanhoIds : [null])) if (corId || tamanhoId) await connection.execute('INSERT INTO produto_variacoes (id_empresa,id_produto,id_cor,id_tamanho,status) VALUES (?,?,?,?,?)', [empresaId, product.insertId, corId, tamanhoId, upper(body.status)])
    if (body.tipo === 'produto_acabado') {
      if (!Array.isArray(body.insumos) || !body.insumos.length) throw Object.assign(new Error('Informe ao menos uma matéria-prima para confeccionar o produto.'), { status: 400 })
      const [ficha] = await connection.execute('INSERT INTO ficha_tecnica (id_empresa,id_produto,versao,status) VALUES (?,?,1,\'ATIVA\')', [empresaId, product.insertId])
      for (const insumo of body.insumos) {
        if (!insumo.produtoId || !(Number(insumo.quantidade) > 0)) throw Object.assign(new Error('Preencha todas as matérias-primas e quantidades.'), { status: 400 })
        const [component] = await connection.execute(`INSERT INTO ficha_tecnica_item
          (id_ficha_tecnica,id_produto_componente,quantidade,perda_percentual)
          SELECT ?,p.id,?,0 FROM produtos p
          JOIN produto_empresa pe ON pe.id_produto=p.id
          WHERE p.id=? AND pe.id_empresa=? AND p.permite_compra=1`, [ficha.insertId, Number(insumo.quantidade), insumo.produtoId, empresaId])
        if (!component.affectedRows) throw Object.assign(new Error('Uma das matérias-primas selecionadas é inválida.'), { status: 400 })
      }
    }
  } else if (entity === 'requisicoes') {
    if (body.numeroAutomatico !== false) body.numero = await automaticCode(connection, entity, empresaId)
    const localId = await firstId(connection, 'SELECT id FROM locais_estoque WHERE id_empresa=? AND nome=?', [empresaId, body.estoque])
    const usuarioId = await firstId(connection, 'SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status=\'ATIVO\' LIMIT 1', [empresaId])
    ;[result] = await connection.execute('INSERT INTO requisicao_compra (id_empresa,id_local_estoque,id_usuario_solicitante,numero,status,data_solicitacao,observacao) VALUES (?,?,?,?,?,?,?)', [empresaId, localId, usuarioId, body.numero, upper(body.status, 'PENDENTE'), body.data || new Date(), body.observacao || null])
  } else if (entity === 'pedidos') {
    if (body.numeroAutomatico !== false) body.numero = await automaticCode(connection, entity, empresaId)
    const fornecedorId = await firstId(connection, 'SELECT id FROM fornecedores WHERE id_empresa=? AND (nome_fantasia=? OR razao_social=?)', [empresaId, body.fornecedor, body.fornecedor])
    const usuarioId = await firstId(connection, 'SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status=\'ATIVO\' LIMIT 1', [empresaId])
    ;[result] = await connection.execute('INSERT INTO pedido_compra (id_empresa,id_fornecedor,id_usuario,numero,data_pedido,status,observacao) VALUES (?,?,?,?,?,?,?)', [empresaId, fornecedorId, usuarioId, body.numero, new Date(), upper(body.status, 'CONFIRMADO'), body.observacao || null])
  } else if (entity === 'notas') {
    if (body.numeroAutomatico !== false) body.numero = await automaticCode(connection, entity, empresaId)
    const itens = Array.isArray(body.itensNota) ? body.itensNota : (Array.isArray(body.produtos) ? body.produtos : [])
    if (!itens.length) throw Object.assign(new Error('Adicione pelo menos um produto à nota fiscal.'), { status: 400 })
    if (!body.chave?.trim()) throw Object.assign(new Error('Informe a chave de acesso.'), { status: 400 })
    const fornecedorId = body.fornecedorId || await firstId(connection, 'SELECT id FROM fornecedores WHERE id_empresa=? AND (nome_fantasia=? OR razao_social=?)', [empresaId, body.fornecedor, body.fornecedor])
    const localId = body.estoqueDestinoId || await firstId(connection, 'SELECT id FROM locais_estoque WHERE id_empresa=? AND nome=?', [empresaId, body.estoqueDestino])
    if (!fornecedorId || !localId) throw Object.assign(new Error('Fornecedor ou estoque de destino inválido.'), { status: 400 })
    const pedidoId = body.pedidoId && body.pedidoId !== 'nenhum'
      ? await firstId(connection, 'SELECT id FROM pedido_compra WHERE id=? AND id_empresa=? AND id_fornecedor=?', [body.pedidoId, empresaId, fornecedorId])
      : null
    if (body.pedidoId && body.pedidoId !== 'nenhum' && !pedidoId) throw Object.assign(new Error('O pedido de compra não pertence a este fornecedor.'), { status: 400 })

    const itensValidados = []
    for (const [index, item] of itens.entries()) {
      const [rows] = await connection.execute(`SELECT p.id,p.nome,p.codigo,p.unidade,pe.id_cor corId,pe.id_tamanho tamanhoId,
        CASE WHEN p.permite_producao=1 OR p.permite_venda=1 THEN 1 ELSE 0 END acabado
        FROM produtos p JOIN produto_empresa pe ON pe.id_produto=p.id WHERE p.id=? AND pe.id_empresa=? AND pe.status='ATIVO' LIMIT 1`, [item.produtoId, empresaId])
      const produto = rows[0]
      if (!produto) throw Object.assign(new Error(`Produto inválido no item ${index + 1}.`), { status: 400 })
      if (produto.acabado) throw Object.assign(new Error('Notas fiscais aceitam somente produtos do tipo matéria-prima.'), { status: 400 })
      for (const atributo of ['corId', 'tamanhoId']) {
        if (item[atributo] && String(item[atributo]) !== String(produto[atributo] || '')) throw Object.assign(new Error(`A variação escolhida no item ${index + 1} não pertence ao produto.`), { status: 400 })
      }
      const quantidade = Number(item.quantidade)
      const valorInformado = Number(item.valor)
      const tipoValor = ['unitario', 'metro', 'total'].includes(item.tipoValor) ? item.tipoValor : 'unitario'
      if (!(quantidade > 0) || !(valorInformado >= 0)) throw Object.assign(new Error(`Quantidade ou valor inválido no item ${index + 1}.`), { status: 400 })
      const valorUnitario = tipoValor === 'total' ? valorInformado / quantidade : valorInformado
      const valorTotal = tipoValor === 'total' ? valorInformado : quantidade * valorInformado
      itensValidados.push({ produto, quantidade, valorUnitario, valorTotal, tipoValor })
    }
    const totalNota = itensValidados.reduce((total, item) => total + item.valorTotal, 0)
    await connection.execute(`INSERT INTO empresa_fornecedor (id_empresa,id_fornecedor,status)
      SELECT ?,?,'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM empresa_fornecedor WHERE id_empresa=? AND id_fornecedor=?)`, [empresaId, fornecedorId, empresaId, fornecedorId])
    ;[result] = await connection.execute('INSERT INTO nota_fiscal (id_empresa,id_local_estoque,id_fornecedor,id_pedido_compra,numero,serie,chave_acesso,status,data_emissao,valor_total,observacao) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [empresaId, localId, fornecedorId, pedidoId, body.numero, body.serie || '1', body.chave.trim(), upper(body.status, 'PENDENTE'), body.dataEmissao || new Date(), totalNota, body.observacao || null])
    for (const [index, item] of itensValidados.entries()) {
      await connection.execute(`INSERT INTO item_nota_fiscal
        (id_nota_fiscal,numero_item,id_produto,codigo_produto,descricao_produto,quantidade,unidade,valor_unitario,valor_total,produto_cadastrado_automaticamente,id_cor,id_tamanho,tipo_valor)
        VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?)`, [result.insertId, index + 1, item.produto.id, item.produto.codigo, item.produto.nome, item.quantidade, item.produto.unidade, item.valorUnitario, item.valorTotal, item.produto.corId, item.produto.tamanhoId, item.tipoValor.toUpperCase()])
    }
  } else if (entity === 'ops') {
    if (body.numeroAutomatico !== false) body.numero = await automaticCode(connection, entity, empresaId)
    const usuarioId = await firstId(connection, 'SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status=\'ATIVO\' LIMIT 1', [empresaId])
    const localId = await firstId(connection, 'SELECT id FROM locais_estoque WHERE id_empresa=? AND nome=?', [empresaId, body.estoque])
    const [op] = await connection.execute('INSERT INTO ordem_producao (id_empresa,id_local_estoque,id_usuario,numero,status,data_inicio,data_previsao) VALUES (?,?,?,?,?,?,?)', [empresaId, localId, usuarioId, body.numero, upper(body.status, 'ABERTA'), body.abertura || new Date(), body.prazo || null])
    const productId = await firstId(connection, 'SELECT p.id FROM produtos p JOIN produto_empresa pe ON pe.id_produto=p.id WHERE pe.id_empresa=? AND p.nome=?', [empresaId, body.produto])
    const colorId = body.cor ? await firstId(connection, 'SELECT id FROM cores WHERE id_empresa=? AND nome=?', [empresaId, body.cor]) : null
    ;[result] = await connection.execute('INSERT INTO ordem_producao_item (id_ordem_producao,id_produto,id_cor,quantidade,quantidade_produzida) VALUES (?,?,?,?,0)', [op.insertId, productId, colorId, Number(body.planejada || 1)])
    result.insertId = op.insertId
  } else if (entity === 'vendas') {
    if (body.numeroAutomatico !== false) body.numero = await automaticCode(connection, entity, empresaId)
    const clienteId = await firstId(connection, 'SELECT id FROM clientes WHERE id_empresa=? AND nome_razao_social=?', [empresaId, body.cliente])
    const usuarioId = await firstId(connection, 'SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status=\'ATIVO\' LIMIT 1', [empresaId])
    ;[result] = await connection.execute('INSERT INTO venda (id_empresa,id_cliente,id_usuario,numero,status,data_venda,valor_total) VALUES (?,?,?,?,?,?,?)', [empresaId, clienteId, usuarioId, body.numero, upper(body.status, 'CONFIRMADA'), body.data || new Date(), Number(body.valor || 0)])
  } else throw Object.assign(new Error('Entidade sem cadastro implementado.'), { status: 400 })
  return result.insertId
}

export async function POST(request, { params }) {
  const connection = await getDb().getConnection()
  try {
    const { entity } = await params
    const body = await request.json()
    const empresaId = String(body.empresaId || '')
    if (!/^\d+$/.test(empresaId)) return NextResponse.json({ error: 'Empresa inválida.' }, { status: 400 })
    await connection.beginTransaction()
    const id = await createEntity(connection, entity, body, empresaId)
    await connection.commit()
    return NextResponse.json({ ...body, id: String(id), empresaId }, { status: 201 })
  } catch (error) {
    await connection.rollback(); console.error('Erro ao cadastrar no MySQL:', error)
    return NextResponse.json({ error: error.code === 'ER_DUP_ENTRY' ? 'Este registro já existe.' : (error.message || 'Não foi possível salvar.') }, { status: error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500) })
  } finally { connection.release() }
}

const DELETE_MAP = { categorias: 'categorias', cores: 'cores', tamanhos: 'tamanhos', locais_estoque: 'locais_estoque', clientes: 'clientes', fornecedores: 'fornecedores', setores: 'setores', requisicoes: 'requisicao_compra', pedidos: 'pedido_compra', notas: 'nota_fiscal', ops: 'ordem_producao', vendas: 'venda' }
export async function DELETE(request, { params }) {
  const connection = await getDb().getConnection()
  try {
    const { entity } = await params; const url = new URL(request.url)
    const id = url.searchParams.get('id'); const empresaId = url.searchParams.get('empresaId')
    if (!/^\d+$/.test(id || '') || !/^\d+$/.test(empresaId || '')) return NextResponse.json({ error: 'Registro inválido.' }, { status: 400 })
    await connection.beginTransaction()
    if (entity === 'produtos') {
      const productId = await firstId(connection, 'SELECT id_produto id FROM produto_empresa WHERE id_produto=? AND id_empresa=?', [id, empresaId])
      if (!productId) throw Object.assign(new Error('Produto não encontrado.'), { status: 404 })
      await connection.execute("UPDATE produto_empresa SET status='INATIVO' WHERE id_produto=? AND id_empresa=?", [id, empresaId])
    } else if (entity === 'usuarios') {
      await connection.execute('DELETE FROM usuario_empresa WHERE id_usuario=? AND id_empresa=?', [id, empresaId])
    } else {
      const table = DELETE_MAP[entity]; if (!table) throw Object.assign(new Error('Entidade sem exclusão implementada.'), { status: 400 })
      await connection.execute(`DELETE FROM ${table} WHERE id=? AND id_empresa=?`, [id, empresaId])
    }
    await connection.commit(); return new NextResponse(null, { status: 204 })
  } catch (error) {
    await connection.rollback(); console.error('Erro ao excluir do MySQL:', error)
    return NextResponse.json({ error: 'Existem registros vinculados que impedem esta exclusão.' }, { status: error.status || 409 })
  } finally { connection.release() }
}

export async function PUT(request, { params }) {
  const connection = await getDb().getConnection()
  try {
    const { entity } = await params; const body = await request.json()
    if (entity === 'produtos') {
      await connection.beginTransaction()
      const corIds = Array.isArray(body.corIds) ? body.corIds : []
      const tamanhoIds = Array.isArray(body.tamanhoIds) ? body.tamanhoIds : []
      const acabado = body.tipo === 'produto_acabado'
      await connection.execute(`UPDATE produtos SET id_categoria=?,nome=?,codigo=?,descricao=?,unidade=?,permite_venda=?,permite_compra=?,permite_producao=?,status=? WHERE id=?`, [acabado ? body.categoriaId || null : null, body.nome, body.codigo, body.descricao || null, body.unidade || 'UN', acabado ? 1 : 0, acabado ? 0 : 1, acabado ? 1 : 0, upper(body.status), body.id])
      await connection.execute(`UPDATE produto_empresa SET id_cor=?,id_tamanho=?,codigo_interno=?,estoque_minimo=?,unidade_estoque_minimo=?,status=? WHERE id_empresa=? AND id_produto=?`, [corIds[0] || null, tamanhoIds[0] || null, body.codigo, Number(body.minimo || 0), upper(body.unidadeMinimo || 'UNIDADE'), upper(body.status), body.empresaId, body.id])
      await connection.execute('DELETE FROM produto_variacoes WHERE id_empresa=? AND id_produto=?', [body.empresaId, body.id])
      for (const corId of (corIds.length ? corIds : [null])) for (const tamanhoId of (tamanhoIds.length ? tamanhoIds : [null])) if (corId || tamanhoId) await connection.execute('INSERT INTO produto_variacoes (id_empresa,id_produto,id_cor,id_tamanho,status) VALUES (?,?,?,?,\'ATIVO\')', [body.empresaId, body.id, corId, tamanhoId])
      await connection.commit()
    } else if (entity === 'categorias') {
      await connection.beginTransaction(); await connection.execute('UPDATE categorias SET nome=?,descricao=?,status=? WHERE id=? AND id_empresa=?',[body.nome,body.descricao||null,upper(body.status),body.id,body.empresaId]); await connection.commit()
    } else if (entity === 'cores') {
      await connection.beginTransaction(); await connection.execute('UPDATE cores SET nome=?,codigo_hex=?,status=? WHERE id=? AND id_empresa=?',[body.nome,body.hex||null,upper(body.status),body.id,body.empresaId]); await connection.commit()
    } else if (entity === 'tamanhos') {
      await connection.beginTransaction(); await connection.execute('UPDATE tamanhos SET nome=?,descricao=?,ordem=?,status=? WHERE id=? AND id_empresa=?',[body.nome,body.descricao||null,Number(body.ordem||0),upper(body.status),body.id,body.empresaId]); await connection.commit()
    } else if (entity === 'fornecedores') {
      await connection.beginTransaction(); await connection.execute('UPDATE fornecedores SET razao_social=?,nome_fantasia=?,cnpj=?,cidade=?,email=?,telefone=?,status=? WHERE id=? AND id_empresa=?',[body.razaoSocial||body.nome,body.nome,body.cnpj||null,body.cidade||null,body.contato||null,body.telefone||null,upper(body.status),body.id,body.empresaId]); await connection.commit()
    } else if (entity === 'setores') {
      await connection.beginTransaction(); await connection.execute('UPDATE setores SET nome=?,tipo=?,descricao=?,status=? WHERE id=? AND id_empresa=?',[body.nome,body.tipo,body.descricao||null,upper(body.status),body.id,body.empresaId]); await connection.execute('DELETE FROM permissoes_setor WHERE id_setor=?',[body.id]); for(const recurso of (body.permissoes||[])) await connection.execute('INSERT INTO permissoes_setor (id_setor,recurso) VALUES (?,?)',[body.id,recurso]); await connection.commit()
    } else if (entity === 'usuarios') {
      await connection.beginTransaction(); const cargoId=await firstId(connection,"SELECT id FROM cargos WHERE id_empresa=? AND LOWER(nome) LIKE ? ORDER BY id LIMIT 1",[body.empresaId,body.perfil==='admin_empresa'?'%admin%':'%usu%']); if(!cargoId)throw Object.assign(new Error('Cargo compatível não encontrado.'),{status:400}); await connection.execute('UPDATE usuarios SET nome=?,email=? WHERE id=?',[body.nome,body.email,body.id]); await connection.execute('UPDATE usuario_empresa SET id_setor=?,id_cargo=?,nivel_acesso=?,status=? WHERE id_usuario=? AND id_empresa=?',[body.setorId||null,cargoId,body.perfil==='admin_empresa'?'EMPRESA':'USUARIO',upper(body.status),body.id,body.empresaId]); if(body.senha?.trim())await connection.execute('UPDATE usuarios SET senha_hash=? WHERE id=?',[await bcrypt.hash(body.senha,10),body.id]); await connection.commit()
    } else if (entity === 'notas') {
      await connection.beginTransaction()
      const localId = body.estoqueDestino ? await firstId(connection, 'SELECT id FROM locais_estoque WHERE id_empresa=? AND nome=?', [body.empresaId, body.estoqueDestino]) : null
      const fornecedorId = body.fornecedor ? await firstId(connection, 'SELECT id FROM fornecedores WHERE id_empresa=? AND (nome_fantasia=? OR razao_social=?)', [body.empresaId, body.fornecedor, body.fornecedor]) : null
      if (!localId || !fornecedorId) throw Object.assign(new Error('Fornecedor ou estoque inválido.'), { status: 400 })
      const itens = Array.isArray(body.produtos) ? body.produtos : []
      if (!itens.length) throw Object.assign(new Error('A nota fiscal precisa ter pelo menos uma matéria-prima.'), { status: 400 })
      const validados = []
      for (const [index, item] of itens.entries()) {
        const [rows] = await connection.execute(`SELECT p.id,p.nome,p.codigo,p.unidade,pe.id_cor corId,pe.id_tamanho tamanhoId,
          CASE WHEN p.permite_producao=1 OR p.permite_venda=1 THEN 1 ELSE 0 END acabado
          FROM produtos p JOIN produto_empresa pe ON pe.id_produto=p.id WHERE p.id=? AND pe.id_empresa=? AND pe.status='ATIVO' LIMIT 1`, [item.productId || item.produtoId, body.empresaId])
        const produto = rows[0]
        if (!produto || produto.acabado) throw Object.assign(new Error(`O item ${index + 1} não é uma matéria-prima válida.`), { status: 400 })
        const quantidade = Number(item.quantidade)
        const tipoValor = String(item.tipoValor || 'unitario').toLowerCase()
        const valorInformado = Number(item.valor ?? item.valorUnitario)
        if (!(quantidade > 0) || !(valorInformado >= 0) || !['unitario','metro','total'].includes(tipoValor)) throw Object.assign(new Error(`Quantidade ou valor inválido no item ${index + 1}.`), { status: 400 })
        validados.push({ produto, quantidade, tipoValor, valorUnitario: tipoValor === 'total' ? valorInformado / quantidade : valorInformado, valorTotal: tipoValor === 'total' ? valorInformado : valorInformado * quantidade })
      }
      const valorTotal = validados.reduce((s, item) => s + item.valorTotal, 0)
      await connection.execute('UPDATE nota_fiscal SET id_local_estoque=?,id_fornecedor=?,numero=?,serie=?,chave_acesso=?,status=?,data_emissao=?,valor_total=?,observacao=? WHERE id=? AND id_empresa=?', [localId, fornecedorId, body.numero, body.serie, body.chave, upper(body.status,'PENDENTE'), body.dataEmissao || new Date(), valorTotal, body.observacao || null, body.id, body.empresaId])
      await connection.execute('DELETE FROM item_nota_fiscal WHERE id_nota_fiscal=?', [body.id])
      for (const [index, item] of validados.entries()) await connection.execute(`INSERT INTO item_nota_fiscal
        (id_nota_fiscal,numero_item,id_produto,codigo_produto,descricao_produto,quantidade,unidade,valor_unitario,valor_total,produto_cadastrado_automaticamente,id_cor,id_tamanho,tipo_valor)
        VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?)`, [body.id, index + 1, item.produto.id, item.produto.codigo, item.produto.nome, item.quantidade, item.produto.unidade, item.valorUnitario, item.valorTotal, item.produto.corId, item.produto.tamanhoId, item.tipoValor.toUpperCase()])
      await connection.commit()
    } else throw Object.assign(new Error('Alteração não implementada para esta entidade.'), { status: 400 })
    return NextResponse.json(body)
  } catch (error) { await connection.rollback(); console.error('Erro ao atualizar no MySQL:', error); return NextResponse.json({ error: error.message }, { status: error.status || 500 }) }
  finally { connection.release() }
}
