import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { isLocalMode } from '@/lib/local/config';
import { createLocalBrowserClient } from '@/lib/local/client';

/**
 * Creates a Supabase client for use in browser/client components
 * This client automatically handles cookie management for authentication
 */
export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  if (isLocalMode()) {
    return createLocalBrowserClient() as any;
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
