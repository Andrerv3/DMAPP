// backend/src/config/db.js
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let _db = null

export function getDB() {
  if (_db) return _db
  const dbPath = process.env.DB_PATH ?? './data/game.db'
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  return _db
}

export function initDB() {
  const db = getDB()
  const schema = readFileSync(join(__dirname, '../db/schema.sql'), 'utf8')
  db.exec(schema)
  return db
}
