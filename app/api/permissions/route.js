import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request) {
  try {
    const url = new URL(request.url); const empresaId = url.searchParams.get('empresaId'); const userId = url.searchParams.get('userId')
    if (!/^\d+$/.test(empresaId || '') || !/^\d+$/.test(userId || '')) return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    const [links] = await getDb().execute('SELECT id,id_setor FROM usuario_empresa WHERE id_empresa=? AND id_usuario=? LIMIT 1', [empresaId, userId])
    const link = links[0]; if (!link) return NextResponse.json({ error: 'Vínculo não encontrado.' }, { status: 404 })
    const [sectorRows] = link.id_setor ? await getDb().execute('SELECT recurso FROM permissoes_setor WHERE id_setor=? ORDER BY recurso', [link.id_setor]) : [[]]
    const [userRows] = await getDb().execute('SELECT recurso FROM permissoes_usuario WHERE id_usuario_empresa=? AND pode_ler=1 ORDER BY recurso', [link.id])
    const setor = sectorRows.map(row => row.recurso); const individual = userRows.map(row => row.recurso)
    return NextResponse.json({ setor, individual: userRows.length ? individual : setor })
  } catch (error) { console.error(error); return NextResponse.json({ error: 'Não foi possível carregar permissões.' }, { status: 500 }) }
}

export async function PUT(request) {
  const connection = await getDb().getConnection()
  try {
    const { empresaId, userId, permissoes = [] } = await request.json()
    const [links] = await connection.execute('SELECT id,id_setor FROM usuario_empresa WHERE id_empresa=? AND id_usuario=? LIMIT 1', [empresaId, userId])
    const link = links[0]; if (!link) return NextResponse.json({ error: 'Vínculo não encontrado.' }, { status: 404 })
    const [allowedRows] = link.id_setor ? await connection.execute('SELECT recurso FROM permissoes_setor WHERE id_setor=?', [link.id_setor]) : [[]]
    const allowed = new Set(allowedRows.map(row => row.recurso)); const effective = permissoes.filter(p => allowed.has(p))
    await connection.beginTransaction()
    await connection.execute('DELETE FROM permissoes_usuario WHERE id_usuario_empresa=?', [link.id])
    for (const recurso of effective) await connection.execute('INSERT INTO permissoes_usuario (id_usuario_empresa,recurso,pode_ler,pode_criar,pode_editar,pode_excluir) VALUES (?,?,1,1,1,1)', [link.id, recurso])
    await connection.commit(); return NextResponse.json({ permissoes: effective })
  } catch (error) { await connection.rollback(); console.error(error); return NextResponse.json({ error: 'Não foi possível salvar permissões.' }, { status: 500 }) }
  finally { connection.release() }
}
