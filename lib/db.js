import mysql from 'mysql2/promise'
import fs from 'node:fs'

const globalForDb = globalThis

export function getDb() {
  if (!globalForDb.__goiaMysqlPool) {
    const caFile = process.env.DB_SSL_CA_FILE
    globalForDb.__goiaMysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 4,
      charset: 'utf8mb4',
      ssl: caFile ? { ca: fs.readFileSync(caFile), rejectUnauthorized: true } : undefined,
    })
  }
  return globalForDb.__goiaMysqlPool
}
