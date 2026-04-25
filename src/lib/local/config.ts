export const LOCAL_USER_ID = 'local-user'
export const LOCAL_USER_EMAIL = 'local@retire.local'

export function isLocalMode(): boolean {
  return process.env.NEXT_PUBLIC_DATA_MODE !== 'supabase'
}
