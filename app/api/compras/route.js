import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request) {
  try {
    const empresaId = new URL(request.url).searchParams.get('empresaId')
    if (!/^\d+$/.test(empresaId || '')) return NextResponse.json({ error: 'Empresa inválida.' }, { status: 400 })
    const [rows] = await getDb().execute(`SELECT c.id,c.codigo,c.origem,LOWER(c.status) status,DATE_FORMAT(c.data_emissao,'%Y-%m-%d') dataEmissao,
      le.nome estoque,f.id fornecedorId,COALESCE(f.nome_fantasia,f.razao_social) fornecedor,op.numero ordemProducao,
      COUNT(ci.id) itens,COALESCE(SUM(ci.valor_total),0) valorTotal
      FROM compras c JOIN locais_estoque le ON le.id=c.id_local_estoque JOIN fornecedores f ON f.id=c.id_fornecedor
      LEFT JOIN ordem_producao op ON op.id=c.id_ordem_producao LEFT JOIN compra_itens ci ON ci.id_compra=c.id
      WHERE c.id_empresa=? GROUP BY c.id,le.nome,f.id,f.nome_fantasia,f.razao_social,op.numero ORDER BY c.data_emissao DESC,c.id DESC`, [empresaId])
    return NextResponse.json(rows.map(row => ({ ...row, id:String(row.id) })))
  } catch (error) { console.error('Erro ao listar compras:',error); return NextResponse.json({ error:'Não foi possível carregar as compras.' }, { status:500 }) }
}

export async function POST(request) {
  const connection = await getDb().getConnection()
  try {
    const body=await request.json(); const empresaId=String(body.empresaId||'')
    if(!/^\d+$/.test(empresaId)||!/^\d+$/.test(String(body.estoqueId||''))||!/^\d+$/.test(String(body.fornecedorId||''))||!body.dataEmissao) return NextResponse.json({error:'Preencha estoque, fornecedor e data de emissão.'},{status:400})
    await connection.beginTransaction()
    const [[local]]=await connection.execute("SELECT id FROM locais_estoque WHERE id=? AND id_empresa=? AND status='ATIVO'",[body.estoqueId,empresaId])
    const [[supplier]]=await connection.execute("SELECT id FROM fornecedores WHERE id=? AND (id_empresa=? OR id_empresa IS NULL) AND status='ATIVO'",[body.fornecedorId,empresaId])
    const [[user]]=await connection.execute("SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status='ATIVO' ORDER BY (id_usuario=?) DESC LIMIT 1",[empresaId,body.usuarioId||0])
    if(!local||!supplier||!user) throw Object.assign(new Error('Estoque, fornecedor ou usuário inválido.'),{status:400})
    let codigo=String(body.codigo||'').trim()
    if(body.codigoAutomatico!==false){await connection.execute("INSERT INTO sequencias_automaticas (id_empresa,entidade,ultimo_numero) VALUES (?,'compras',LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE ultimo_numero=LAST_INSERT_ID(ultimo_numero+1)",[empresaId]);const[[seq]]=await connection.query('SELECT LAST_INSERT_ID() numero');codigo=`COMP-${String(seq.numero).padStart(6,'0')}`}
    if(!codigo) throw Object.assign(new Error('Informe o ID da compra.'),{status:400})
    const[result]=await connection.execute(`INSERT INTO compras (id_empresa,id_local_estoque,id_fornecedor,id_usuario,codigo,origem,status,data_emissao,observacao)
      VALUES (?,?,?,?,?,'MANUAL','RASCUNHO',?,?)`,[empresaId,local.id,supplier.id,user.id,codigo,body.dataEmissao,body.observacao||null])
    await connection.commit();return NextResponse.json({id:String(result.insertId),codigo},{status:201})
  }catch(error){await connection.rollback();return NextResponse.json({error:error.code==='ER_DUP_ENTRY'?'Este ID de compra já existe.':error.message},{status:error.status||500})}finally{connection.release()}
}
