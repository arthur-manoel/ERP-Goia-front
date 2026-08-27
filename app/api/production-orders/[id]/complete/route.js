import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const fail=(message,status=400)=>Object.assign(new Error(message),{status})
export async function POST(request,{params}){
 const db=await getDb().getConnection()
 try{
  const{id}=await params;const body=await request.json();const empresaId=String(body.empresaId||'')
  if(!/^\d+$/.test(empresaId)||!/^\d+$/.test(String(body.localEstoqueId||''))||!Array.isArray(body.itens))return NextResponse.json({error:'Informe o estoque e as quantidades produzidas.'},{status:400})
  await db.beginTransaction()
  const[[op]]=await db.execute('SELECT id,numero,status FROM ordem_producao WHERE id=? AND id_empresa=? FOR UPDATE',[id,empresaId])
  if(!op)throw fail('Ordem de produção não encontrada.',404)
  if(['CONCLUIDA','CANCELADA'].includes(op.status))throw fail('Esta ordem não permite novas conclusões.',409)
  const[[local]]=await db.execute("SELECT id FROM locais_estoque WHERE id=? AND id_empresa=? AND status='ATIVO'",[body.localEstoqueId,empresaId])
  const[[user]]=await db.execute("SELECT id_usuario id FROM usuario_empresa WHERE id_empresa=? AND status='ATIVO' ORDER BY (id_usuario=?) DESC LIMIT 1",[empresaId,body.usuarioId||0])
  if(!local||!user)throw fail('Estoque de destino ou usuário inválido.')
  const[items]=await db.execute('SELECT id,id_produto,quantidade,quantidade_produzida FROM ordem_producao_item WHERE id_ordem_producao=? FOR UPDATE',[id])
  const input=new Map(body.itens.map(x=>[String(x.itemId),Number(x.quantidade)]));const produced=[]
  const[[lastStep]]=await db.execute('SELECT id_setor FROM ordem_producao_fluxo_setor WHERE id_ordem_producao=? ORDER BY ordem DESC LIMIT 1',[id]);if(!lastStep)throw fail('A ordem ainda não possui fluxo de setores.',409)
  for(const item of items){const qty=input.get(String(item.id))||0;if(!Number.isInteger(qty))throw fail('Produto acabado só pode ser concluído em quantidades inteiras.');const[[arrived]]=await db.execute(`SELECT COALESCE(SUM(mi.quantidade),0) total FROM ordem_producao_movimentacao_item mi JOIN ordem_producao_movimentacao_setor m ON m.id=mi.id_movimentacao WHERE mi.id_ordem_producao_item=? AND m.id_setor_destino=? AND m.status='ENTREGUE'`,[item.id,lastStep.id_setor]);const eligible=Number(arrived.total)-Number(item.quantidade_produzida);if(qty<0||qty>eligible+0.000001)throw fail('Só é possível registrar peças que já foram entregues no último setor do fluxo.');if(qty>0)produced.push({item,qty})}
  if(!produced.length)throw fail('Informe ao menos uma quantidade produzida.')
  const rawNeeds=new Map()
  for(const row of produced){
   const[recipe]=await db.execute(`SELECT fti.id_produto_componente produtoId,fti.quantidade,COALESCE(pe.custo_atual,0) custo FROM ficha_tecnica ft JOIN ficha_tecnica_item fti ON fti.id_ficha_tecnica=ft.id JOIN produto_empresa pe ON pe.id_produto=fti.id_produto_componente AND pe.id_empresa=ft.id_empresa WHERE ft.id_empresa=? AND ft.id_produto=? AND ft.status='ATIVA' AND ft.versao=(SELECT MAX(x.versao) FROM ficha_tecnica x WHERE x.id_empresa=ft.id_empresa AND x.id_produto=ft.id_produto AND x.status='ATIVA')`,[empresaId,row.item.id_produto])
   if(!recipe.length)throw fail('Um produto acabado não possui ficha técnica ativa.')
   row.costPerPiece=recipe.reduce((s,x)=>s+Number(x.quantidade)*Number(x.custo),0)
   for(const component of recipe){const key=String(component.produtoId);rawNeeds.set(key,(rawNeeds.get(key)||0)+Number(component.quantidade)*row.qty)}
  }
  for(const[productId,needed]of rawNeeds){
   const[[pe]]=await db.execute('SELECT COALESCE(custo_atual,0) custo FROM produto_empresa WHERE id_empresa=? AND id_produto=? FOR UPDATE',[empresaId,productId]);const rawCost=Number(pe?.custo||0)
   const[balances]=await db.execute('SELECT id,id_local_estoque,quantidade,quantidade_reservada FROM estoque WHERE id_empresa=? AND id_produto=? AND quantidade>0 ORDER BY id_local_estoque,id FOR UPDATE',[empresaId,productId])
   const available=balances.reduce((s,x)=>s+Math.max(0,Number(x.quantidade)-Number(x.quantidade_reservada)),0)
   if(available+0.000001<needed)throw fail(`Matéria-prima insuficiente para concluir a produção. Necessário: ${needed}; disponível: ${available}.`,409)
   let rest=needed
   for(const balance of balances){if(rest<=0)break;const usable=Math.max(0,Number(balance.quantidade)-Number(balance.quantidade_reservada));const take=Math.min(rest,usable);if(take<=0)continue;await db.execute('UPDATE estoque SET quantidade=quantidade-?,data_atualizacao=NOW() WHERE id=?',[take,balance.id]);await db.execute(`INSERT INTO movimentacao_estoque (id_empresa,id_local_estoque,id_produto,tipo,quantidade,valor_total,origem_tipo,origem_id,id_usuario,observacao) VALUES (?,?,?,'SAIDA_PRODUCAO',?,?,'ORDEM_PRODUCAO',?,?,?)`,[empresaId,balance.id_local_estoque,productId,take,take*rawCost,id,user.id,`Consumo na OP ${op.numero}`]);rest-=take}
   await db.execute(`UPDATE necessidade_producao SET quantidade_consumida=LEAST(quantidade_necessaria,quantidade_consumida+?),status=CASE WHEN quantidade_consumida+?>=quantidade_necessaria THEN 'CONSUMIDA' ELSE 'PARCIAL' END WHERE id_ordem_producao=? AND id_produto=?`,[needed,needed,id,productId])
  }
  for(const row of produced){
   const[[stock]]=await db.execute('SELECT id FROM estoque WHERE id_empresa=? AND id_local_estoque=? AND id_produto=? FOR UPDATE',[empresaId,local.id,row.item.id_produto])
   if(stock)await db.execute('UPDATE estoque SET quantidade=quantidade+?,data_atualizacao=NOW() WHERE id=?',[row.qty,stock.id]);else await db.execute('INSERT INTO estoque (id_empresa,id_local_estoque,id_produto,quantidade,quantidade_reservada) VALUES (?,?,?,?,0)',[empresaId,local.id,row.item.id_produto,row.qty])
   await db.execute('UPDATE ordem_producao_item SET quantidade_produzida=quantidade_produzida+? WHERE id=?',[row.qty,row.item.id])
   await db.execute(`INSERT INTO movimentacao_estoque (id_empresa,id_local_estoque,id_produto,tipo,quantidade,valor_total,origem_tipo,origem_id,id_usuario,observacao) VALUES (?,?,?,'ENTRADA_PRODUCAO',?,?,'ORDEM_PRODUCAO',?,?,?)`,[empresaId,local.id,row.item.id_produto,row.qty,row.costPerPiece*row.qty,id,user.id,`Produção concluída na OP ${op.numero}`])
   await db.execute('UPDATE produto_empresa SET custo_atual=? WHERE id_empresa=? AND id_produto=?',[row.costPerPiece,empresaId,row.item.id_produto])
  }
  const[[remaining]]=await db.execute('SELECT COUNT(*) total FROM ordem_producao_item WHERE id_ordem_producao=? AND quantidade_produzida<quantidade',[id]);const done=Number(remaining.total)===0
  await db.execute('UPDATE ordem_producao SET status=?,data_conclusao=IF(?,NOW(),data_conclusao) WHERE id=?',[done?'CONCLUIDA':'EM_PRODUCAO',done?1:0,id])
  await db.commit();return NextResponse.json({message:done?'Ordem concluída e estoque atualizado.':'Produção parcial registrada e estoque atualizado.',concluida:done})
 }catch(error){await db.rollback();console.error('Erro ao concluir produção:',error);return NextResponse.json({error:error.message||'Não foi possível concluir a produção.'},{status:error.status||500})}finally{db.release()}
}
