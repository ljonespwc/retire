import { createLocalClient } from './client'
import { runLocalQuery } from './db'

export function createLocalServerClient() {
  return createLocalClient(async (request) => runLocalQuery(request))
}
