import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  AGE_AMOUNTS_2025,
  BASIC_PERSONAL_AMOUNTS_2025,
  FEDERAL_BRACKETS_2025,
  LOCAL_USER,
  PROVINCIAL_BRACKETS_2025,
  RRIF_MINIMUMS,
  TFSA_LIMITS,
} from './seed-data'

type Filter = { column: string; operator: 'eq' | 'is'; value: unknown }
type Order = { column: string; ascending?: boolean }

export type LocalQueryRequest = {
  table: string
  action: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  select?: string
  values?: Record<string, unknown> | Record<string, unknown>[]
  filters?: Filter[]
  order?: Order[]
  limit?: number
  range?: { from: number; to: number }
  single?: boolean
  count?: 'exact'
  head?: boolean
  onConflict?: string
  ignoreDuplicates?: boolean
}

const DB_PATH = path.join(process.cwd(), 'data', 'retire.sqlite')
const JSON_COLUMNS = new Set(['data', 'inputs', 'results', 'preferences', 'state'])
const TABLES = new Set([
  'tax_years',
  'federal_tax_brackets',
  'provincial_tax_brackets',
  'government_benefits',
  'rrif_minimums',
  'tfsa_limits',
  'tax_credits',
  'users',
  'scenarios',
  'conversation_states',
  'articles',
  'article_likes',
  'contact_submissions',
  'calculator_feedback',
])

let db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (db) return db

  mkdirSync(path.dirname(DB_PATH), { recursive: true })
  db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  seed(db)
  return db
}

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS tax_years (
      year INTEGER PRIMARY KEY,
      is_active INTEGER NOT NULL DEFAULT 1,
      effective_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS federal_tax_brackets (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      bracket_index INTEGER NOT NULL,
      income_limit REAL,
      rate REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS provincial_tax_brackets (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      province_code TEXT NOT NULL,
      bracket_index INTEGER NOT NULL,
      income_limit REAL,
      rate REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS government_benefits (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      benefit_type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(year, benefit_type)
    );

    CREATE TABLE IF NOT EXISTS rrif_minimums (
      age INTEGER PRIMARY KEY,
      percentage REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tfsa_limits (
      year INTEGER PRIMARY KEY,
      annual_limit INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tax_credits (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      credit_type TEXT NOT NULL,
      province_code TEXT,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(year, credit_type, province_code)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'basic',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      preferences TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      inputs TEXT NOT NULL DEFAULT '{}',
      results TEXT,
      source TEXT,
      conversation_id TEXT,
      share_token TEXT UNIQUE,
      is_shared INTEGER NOT NULL DEFAULT 0,
      shared_at TEXT,
      baseline_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_states (
      conversation_id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      user_id TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      featured_image_url TEXT,
      cta_text TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      publish_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      author_id TEXT,
      reading_time_minutes INTEGER
    );

    CREATE TABLE IF NOT EXISTS article_likes (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL UNIQUE,
      like_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_submissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calculator_feedback (
      id TEXT PRIMARY KEY,
      rating INTEGER NOT NULL,
      got_answers INTEGER NOT NULL,
      what_didnt_work TEXT,
      feature_requests TEXT,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_scenarios_user_updated ON scenarios(user_id, updated_at);
    CREATE INDEX IF NOT EXISTS idx_scenarios_baseline ON scenarios(baseline_id);
    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_status_publish_date ON articles(status, publish_date);
  `)
}

function seed(database: DatabaseSync) {
  const row = database.prepare('SELECT COUNT(*) as count FROM tax_years').get() as { count: number }
  if (row.count > 0) return

  const insertTaxYear = database.prepare('INSERT INTO tax_years (year, is_active, effective_date) VALUES (?, ?, ?)')
  insertTaxYear.run(2025, 1, '2025-01-01')

  const insertFederal = database.prepare(`
    INSERT INTO federal_tax_brackets (id, year, bracket_index, income_limit, rate)
    VALUES (?, 2025, ?, ?, ?)
  `)
  FEDERAL_BRACKETS_2025.forEach((bracket, index) => {
    insertFederal.run(crypto.randomUUID(), index, bracket.limit, bracket.rate)
  })

  const insertProvincial = database.prepare(`
    INSERT INTO provincial_tax_brackets (id, year, province_code, bracket_index, income_limit, rate)
    VALUES (?, 2025, ?, ?, ?, ?)
  `)
  Object.entries(PROVINCIAL_BRACKETS_2025).forEach(([province, brackets]) => {
    brackets.forEach((bracket, index) => {
      insertProvincial.run(crypto.randomUUID(), province, index, bracket.limit, bracket.rate)
    })
  })

  const insertBenefit = database.prepare(`
    INSERT INTO government_benefits (id, year, benefit_type, data)
    VALUES (?, 2025, ?, ?)
  `)
  insertBenefit.run(crypto.randomUUID(), 'CPP', JSON.stringify({ max_monthly_retirement_at_65: 1433, year: 2025 }))
  insertBenefit.run(crypto.randomUUID(), 'OAS', JSON.stringify({
    max_monthly_65_to_74: 727.67,
    max_monthly_75_plus: 800.44,
    recovery_tax_threshold: 90997,
    year: 2025,
  }))

  const insertRRIF = database.prepare('INSERT INTO rrif_minimums (age, percentage) VALUES (?, ?)')
  Object.entries(RRIF_MINIMUMS).forEach(([age, percentage]) => {
    insertRRIF.run(Number(age), percentage)
  })

  const insertTFSA = database.prepare('INSERT INTO tfsa_limits (year, annual_limit) VALUES (?, ?)')
  Object.entries(TFSA_LIMITS).forEach(([year, limit]) => {
    insertTFSA.run(Number(year), limit)
  })

  const insertCredit = database.prepare(`
    INSERT INTO tax_credits (id, year, credit_type, province_code, data)
    VALUES (?, 2025, ?, ?, ?)
  `)
  insertCredit.run(crypto.randomUUID(), 'BASIC_PERSONAL_AMOUNT', null, JSON.stringify({ amount: 16129 }))
  insertCredit.run(crypto.randomUUID(), 'AGE_AMOUNT', null, JSON.stringify(AGE_AMOUNTS_2025.FEDERAL))
  Object.entries(BASIC_PERSONAL_AMOUNTS_2025).forEach(([province, amount]) => {
    insertCredit.run(crypto.randomUUID(), 'BASIC_PERSONAL_AMOUNT', province, JSON.stringify({ amount }))
  })
  Object.entries(AGE_AMOUNTS_2025).forEach(([province, data]) => {
    if (province === 'FEDERAL') return
    insertCredit.run(crypto.randomUUID(), 'AGE_AMOUNT', province, JSON.stringify(data))
  })

  database.prepare(`
    INSERT INTO users (id, email, tier, preferences)
    VALUES (?, ?, ?, ?)
  `).run(LOCAL_USER.id, LOCAL_USER.email, LOCAL_USER.tier, JSON.stringify(LOCAL_USER.preferences))
}

export function runLocalQuery(request: LocalQueryRequest) {
  if (!TABLES.has(request.table)) {
    return { data: null, error: { message: `Unknown local table: ${request.table}` } }
  }

  try {
    if (request.action === 'select') return selectRows(request)
    if (request.action === 'insert') return insertRows(request)
    if (request.action === 'upsert') return upsertRows(request)
    if (request.action === 'update') return updateRows(request)
    if (request.action === 'delete') return deleteRows(request)
    return { data: null, error: { message: 'Unsupported local query action' } }
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Local query failed' } }
  }
}

function selectRows(request: LocalQueryRequest) {
  const database = getDb()
  const where = buildWhere(request.filters || [])
  const order = (request.order || []).map((item) => `${quoteIdentifier(item.column)} ${item.ascending === false ? 'DESC' : 'ASC'}`).join(', ')
  const limit = request.limit ? ` LIMIT ${request.limit}` : request.range ? ` LIMIT ${request.range.to - request.range.from + 1} OFFSET ${request.range.from}` : ''
  const sql = `SELECT ${selectColumns(request.select)} FROM ${quoteIdentifier(request.table)}${where.sql}${order ? ` ORDER BY ${order}` : ''}${limit}`

  if (request.count === 'exact' && request.head) {
    const countRow = database.prepare(`SELECT COUNT(*) as count FROM ${quoteIdentifier(request.table)}${where.sql}`).get(...where.values) as { count: number }
    return { data: null, error: null, count: countRow.count }
  }

  const rows = database.prepare(sql).all(...where.values).map((row) => parseRow(row as Record<string, unknown>))
  return { data: request.single ? rows[0] || null : rows, error: rows.length || !request.single ? null : { message: 'No rows found' } }
}

function insertRows(request: LocalQueryRequest) {
  const rows = normalizeRows(request.values)
  const inserted = rows.map((row) => {
    const now = new Date().toISOString()
    const withDefaults = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...row,
    }
    insertObject(request.table, withDefaults)
    return getById(request.table, String(withDefaults.id)) || withDefaults
  })

  return { data: request.single ? inserted[0] : inserted, error: null }
}

function upsertRows(request: LocalQueryRequest) {
  const rows = normalizeRows(request.values)
  const inserted = rows.map((row) => {
    const conflictColumn = request.onConflict || 'id'
    const existing = row[conflictColumn] ? selectOneByColumn(request.table, conflictColumn, row[conflictColumn]) : null
    if (existing) {
      if (!request.ignoreDuplicates) updateObject(request.table, row, [{ column: conflictColumn, operator: 'eq', value: row[conflictColumn] }])
      return existing
    }

    const now = new Date().toISOString()
    const withDefaults = { id: crypto.randomUUID(), created_at: now, updated_at: now, ...row }
    insertObject(request.table, withDefaults)
    return getById(request.table, String(withDefaults.id)) || withDefaults
  })
  return { data: request.single ? inserted[0] : inserted, error: null }
}

function updateRows(request: LocalQueryRequest) {
  updateObject(request.table, { ...(request.values as Record<string, unknown>), updated_at: new Date().toISOString() }, request.filters || [])
  const selected = selectRows({ ...request, action: 'select' })
  return selected
}

function deleteRows(request: LocalQueryRequest) {
  const database = getDb()
  const where = buildWhere(request.filters || [])
  database.prepare(`DELETE FROM ${quoteIdentifier(request.table)}${where.sql}`).run(...where.values)
  return { data: true, error: null }
}

function insertObject(table: string, row: Record<string, unknown>) {
  const database = getDb()
  const entries = Object.entries(row).filter(([, value]) => value !== undefined)
  const columns = entries.map(([key]) => quoteIdentifier(key)).join(', ')
  const placeholders = entries.map(() => '?').join(', ')
  const values = entries.map(([key, value]) => serializeValue(key, value))
  database.prepare(`INSERT INTO ${quoteIdentifier(table)} (${columns}) VALUES (${placeholders})`).run(...values)
}

function updateObject(table: string, updates: Record<string, unknown>, filters: Filter[]) {
  const database = getDb()
  const entries = Object.entries(updates).filter(([key, value]) => value !== undefined && key !== 'id')
  if (entries.length === 0) return
  const setSql = entries.map(([key]) => `${quoteIdentifier(key)} = ?`).join(', ')
  const setValues = entries.map(([key, value]) => serializeValue(key, value))
  const where = buildWhere(filters)
  database.prepare(`UPDATE ${quoteIdentifier(table)} SET ${setSql}${where.sql}`).run(...setValues, ...where.values)
}

function selectOneByColumn(table: string, column: string, value: unknown) {
  const database = getDb()
  const row = database.prepare(`SELECT * FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(column)} = ? LIMIT 1`).get(serializeValue(column, value))
  return row ? parseRow(row as Record<string, unknown>) : null
}

function getById(table: string, id: string) {
  return selectOneByColumn(table, 'id', id)
}

function buildWhere(filters: Filter[]) {
  if (filters.length === 0) return { sql: '', values: [] as unknown[] }
  const parts: string[] = []
  const values: unknown[] = []

  filters.forEach((filter) => {
    if (filter.operator === 'is' && filter.value === null) {
      parts.push(`${quoteIdentifier(filter.column)} IS NULL`)
      return
    }
    parts.push(`${quoteIdentifier(filter.column)} = ?`)
    values.push(serializeValue(filter.column, filter.value))
  })

  return { sql: ` WHERE ${parts.join(' AND ')}`, values }
}

function normalizeRows(values: LocalQueryRequest['values']) {
  if (!values) return [{}]
  return Array.isArray(values) ? values : [values]
}

function selectColumns(select?: string) {
  if (!select || select === '*') return '*'
  return select.split(',').map((part) => quoteIdentifier(part.trim())).join(', ')
}

function quoteIdentifier(identifier: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`)
  }
  return `"${identifier}"`
}

function serializeValue(column: string, value: unknown) {
  if (JSON_COLUMNS.has(column) && value !== null && value !== undefined && typeof value !== 'string') {
    return JSON.stringify(value)
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  return value
}

function parseRow(row: Record<string, unknown>) {
  const parsed: Record<string, unknown> = {}
  Object.entries(row).forEach(([key, value]) => {
    if (JSON_COLUMNS.has(key) && typeof value === 'string') {
      try {
        parsed[key] = JSON.parse(value)
      } catch {
        parsed[key] = value
      }
      return
    }
    if (key === 'is_active' || key === 'is_shared' || key === 'got_answers') {
      parsed[key] = Boolean(value)
      return
    }
    parsed[key] = value
  })
  return parsed
}
