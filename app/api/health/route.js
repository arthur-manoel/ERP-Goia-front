import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    await getDb().query('SELECT 1')
    return NextResponse.json({ database: 'connected' })
  } catch (error) {
    console.error('Falha no health check:', error)
    return NextResponse.json({ database: 'disconnected' }, { status: 503 })
  }
}

