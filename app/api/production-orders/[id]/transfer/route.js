import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
const fail=(message,status=400)=>Object.assign(new Error(message),{status})
const activeUser=async(db,empresaId,usuarioId)=>(await db.execute("SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status='ATIVO' ORDER BY (id_usuario=?) DESC LIMIT 1",[empresaId,usuarioId||0]))[0][0]?.id

export async function POST(request,{params}){
 const db=await getDb().getConnection()
 try{
  const{id}=await params,body=await request.json();await db.beginTransaction()
  const[[op]]=await db.execute('SELECT id FROM ordem_producao WHERE id=? AND id_empresa=? FOR UPDATE',[id,body.empresaId]);if(!op)throw fail('Ordem inválida.',404)
  const origemId=String(body.setorOrigemId||'');const[[step]]=await db.execute('SELECT ordem FROM ordem_producao_fluxo_setor WHERE id_ordem_producao=? AND id_setor=?',[id,origemId]);if(!step)throw fail('Selecione um setor válido do fluxo.')
  const[[next]]=await db.execute('SELECT id_setor id FROM ordem_producao_fluxo_setor WHERE id_ordem_producao=? AND ordem=?',[id,Number(step.ordem)+1]);if(!next)throw fail('Este é o último setor do fluxo; envie as peças concluídas para o estoque.')
  const[[pending]]=await db.execute("SELECT id FROM ordem_producao_movimentacao_setor WHERE id_ordem_producao=? AND id_setor_origem=? AND status='EM_TRANSITO' LIMIT 1",[id,origemId]);if(pending)throw fail('Este setor já possui um lote a caminho. Confirme sua chegada antes de enviar outro.',409)
  const[items]=await db.execute('SELECT id,quantidade FROM ordem_producao_item WHERE id_ordem_producao=? FOR UPDATE',[id]);const requested=new Map((body.itens||[]).map(x=>[String(x.itemId),Number(x.quantidade||0)])),send=[]
  for(const item of items){const[[moves]]=await db.execute(`SELECT COALESCE(SUM(CASE WHEN m.id_setor_destino=? AND m.status='ENTREGUE' THEN mi.quantidade ELSE 0 END),0) recebido,COALESCE(SUM(CASE WHEN m.id_setor_origem=? THEN mi.quantidade ELSE 0 END),0) enviado FROM ordem_producao_movimentacao_item mi JOIN ordem_producao_movimentacao_setor m ON m.id=mi.id_movimentacao WHERE m.id_ordem_producao=? AND mi.id_ordem_producao_item=?`,[origemId,origemId,id,item.id]);const entrada=Number(step.ordem)===1?Number(item.quantidade):Number(moves.recebido),disponivel=entrada-Number(moves.enviado),qty=body.enviarTodos?disponivel:(requested.get(String(item.id))||0);if(!Number.isInteger(qty))throw fail('Produtos acabados devem ser movimentados em quantidades inteiras.');if(qty<0||qty>disponivel+0.000001)throw fail('Uma quantidade enviada é maior que o saldo disponível no setor.');if(qty>0)send.push({id:item.id,qty})}
  if(!send.length)throw fail('Informe ao menos uma variação e uma quantidade.');const total=send.reduce((sum,x)=>sum+x.qty,0),user=await activeUser(db,body.empresaId,body.usuarioId)
  const[result]=await db.execute("INSERT INTO ordem_producao_movimentacao_setor(id_ordem_producao,id_setor_origem,id_setor_destino,quantidade,id_usuario_envio,status,observacao)VALUES(?,?,?,?,?,'EM_TRANSITO',?)",[id,origemId,next.id,total,user,body.observacao||null]);for(const item of send)await db.execute('INSERT INTO ordem_producao_movimentacao_item(id_movimentacao,id_ordem_producao_item,quantidade)VALUES(?,?,?)',[result.insertId,item.id,item.qty])
  await db.execute("UPDATE ordem_producao SET status='EM_PRODUCAO' WHERE id=? AND status IN ('LIBERADA','PLANEJADA','ABERTA')",[id])
  await db.commit();return NextResponse.json({message:`Lote com ${total} peça(s) enviado para o próximo setor.`})
 }catch(error){await db.rollback();return NextResponse.json({error:error.message},{status:error.status||500})}finally{db.release()}
}

export async function PATCH(request,{params}){
 const db=await getDb().getConnection()
 try{const{id}=await params,body=await request.json();await db.beginTransaction();const[[movimento]]=await db.execute(`SELECT m.id,m.id_setor_destino FROM ordem_producao_movimentacao_setor m JOIN ordem_producao o ON o.id=m.id_ordem_producao WHERE m.id=? AND m.id_ordem_producao=? AND o.id_empresa=? AND m.status='EM_TRANSITO' FOR UPDATE`,[body.movimentoId,id,body.empresaId]);if(!movimento)throw fail('O lote informado não está mais a caminho.',404);const user=await activeUser(db,body.empresaId,body.usuarioId);await db.execute("UPDATE ordem_producao_movimentacao_setor SET status='ENTREGUE',id_usuario_recebimento=?,data_recebimento=NOW() WHERE id=?",[user,movimento.id]);await db.execute('UPDATE ordem_producao SET id_setor=? WHERE id=?',[movimento.id_setor_destino,id]);await db.commit();return NextResponse.json({message:'Lote recebido no setor de destino.'})}catch(error){await db.rollback();return NextResponse.json({error:error.message},{status:error.status||500})}finally{db.release()}
}
