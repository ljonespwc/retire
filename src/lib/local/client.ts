import { LOCAL_USER_EMAIL, LOCAL_USER_ID } from './config'
import type { LocalQueryRequest } from './db'

type QueryExecutor = (request: LocalQueryRequest) => Promise<any>

export function createLocalBrowserClient() {
  return createLocalClient(async (request) => {
    const response = await fetch('/api/local/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    return response.json()
  })
}

export function createLocalClient(execute: QueryExecutor) {
  return {
    __local: true,
    auth: {
      async getUser() {
        return { data: { user: localUser() }, error: null }
      },
      async getSession() {
        return { data: { session: { user: localUser() } }, error: null }
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        queueMicrotask(() => callback('SIGNED_IN', { user: localUser() }))
        return { data: { subscription: { unsubscribe() {} } } }
      },
      async signInAnonymously() {
        return { data: { user: localUser() }, error: null }
      },
      async updateUser() {
        return { data: { user: localUser() }, error: null }
      },
      async signInWithPassword() {
        return { data: { user: localUser() }, error: null }
      },
      async signUp() {
        return { data: { user: localUser() }, error: null }
      },
      async signOut() {
        return { error: null }
      },
    },
    storage: {
      from() {
        return {
          async upload() {
            return { data: null, error: { message: 'Local mode does not support Supabase Storage uploads.' } }
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: path } }
          },
        }
      },
    },
    from(table: string) {
      return new LocalQueryBuilder(table, execute)
    },
  }
}

class LocalQueryBuilder {
  private request: LocalQueryRequest

  constructor(table: string, private execute: QueryExecutor) {
    this.request = {
      table,
      action: 'select',
      filters: [],
      order: [],
    }
  }

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    if (!['insert', 'update', 'upsert', 'delete'].includes(this.request.action)) {
      this.request.action = 'select'
    }
    this.request.select = columns
    this.request.count = options?.count
    this.request.head = options?.head
    return this
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.request.action = 'insert'
    this.request.values = values
    return this
  }

  upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.request.action = 'upsert'
    this.request.values = values
    this.request.onConflict = options?.onConflict
    this.request.ignoreDuplicates = options?.ignoreDuplicates
    return this
  }

  update(values: Record<string, unknown>) {
    this.request.action = 'update'
    this.request.values = values
    return this
  }

  delete() {
    this.request.action = 'delete'
    return this
  }

  eq(column: string, value: unknown) {
    this.request.filters?.push({ column, operator: 'eq', value })
    return this
  }

  is(column: string, value: unknown) {
    this.request.filters?.push({ column, operator: 'is', value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.request.order?.push({ column, ascending: options?.ascending })
    return this
  }

  limit(limit: number) {
    this.request.limit = limit
    return this
  }

  range(from: number, to: number) {
    this.request.range = { from, to }
    return this
  }

  single() {
    this.request.single = true
    return this
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute(this.request).then(onfulfilled, onrejected)
  }
}

function localUser() {
  return {
    id: LOCAL_USER_ID,
    email: LOCAL_USER_EMAIL,
    is_anonymous: false,
  }
}
