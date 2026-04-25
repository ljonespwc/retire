import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { isLocalMode } from '@/lib/local/config';
import { createLocalServerClient } from '@/lib/local/server-client';

/**
 * Creates a Supabase client for use in server components and API routes
 * This client reads and writes cookies to maintain authentication state
 */
export async function createClient(): Promise<ReturnType<typeof createServerClient<Database>>> {
  if (isLocalMode()) {
    return createLocalServerClient() as any;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
