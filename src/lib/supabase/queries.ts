import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ScenarioRow, ScenarioRowInsert, ScenarioRowUpdate } from '@/types/database';
import { generateShareToken } from '@/lib/utils/share-token';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Save a new scenario to the database
 * @param client - Supabase client instance
 * @param scenario - Scenario data to insert
 * @returns The created scenario or error
 */
export async function saveScenario(
  client: TypedSupabaseClient,
  scenario: Omit<ScenarioRowInsert, 'user_id'>
) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await client
    .from('scenarios')
    .insert({
      ...scenario,
      user_id: user.id,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Get all scenarios for the current user
 * @param client - Supabase client instance
 * @param options - Query options (limit, offset, orderBy)
 * @returns Array of scenarios or error
 */
export async function getScenarios(
  client: TypedSupabaseClient,
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'updated_at' | 'name';
    ascending?: boolean;
  }
) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  let query = client.from('scenarios').select('*').eq('user_id', user.id);

  // Apply ordering
  const orderBy = options?.orderBy || 'updated_at';
  const ascending = options?.ascending ?? false;
  query = query.order(orderBy, { ascending });

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  return { data, error };
}

/**
 * Get a single scenario by ID
 * @param client - Supabase client instance
 * @param scenarioId - Scenario ID
 * @returns Scenario data or error
 */
export async function getScenario(client: TypedSupabaseClient, scenarioId: string) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await client
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .eq('user_id', user.id)
    .single();

  return { data, error };
}

/**
 * Update an existing scenario
 * @param client - Supabase client instance
 * @param scenarioId - Scenario ID to update
 * @param updates - Partial scenario data to update
 * @returns Updated scenario or error
 */
export async function updateScenario(
  client: TypedSupabaseClient,
  scenarioId: string,
  updates: Omit<ScenarioRowUpdate, 'id' | 'user_id'>
) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await client
    .from('scenarios')
    .update(updates)
    .eq('id', scenarioId)
    .eq('user_id', user.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a scenario
 * @param client - Supabase client instance
 * @param scenarioId - Scenario ID to delete
 * @returns Success status or error
 */
export async function deleteScenario(client: TypedSupabaseClient, scenarioId: string) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { error } = await client
    .from('scenarios')
    .delete()
    .eq('id', scenarioId)
    .eq('user_id', user.id);

  return { data: error === null, error };
}

/**
 * Count total scenarios for the current user
 * @param client - Supabase client instance
 * @returns Count of scenarios or error
 */
export async function countScenarios(client: TypedSupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { count, error } = await client
    .from('scenarios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return { data: count, error };
}

/**
 * Enable sharing for a scenario (generate share token)
 * @param client - Supabase client instance
 * @param scenarioId - Scenario ID to enable sharing for
 * @returns Updated scenario with share_token or error
 */
export async function enableScenarioSharing(
  client: TypedSupabaseClient,
  scenarioId: string
) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  // First verify user owns this scenario
  const { data: existing, error: fetchError } = await client
    .from('scenarios')
    .select('id, share_token')
    .eq('id', scenarioId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return { data: null, error: fetchError || new Error('Scenario not found') };
  }

  // If already has a token, just enable sharing (don't regenerate token)
  if (existing.share_token) {
    const { data, error } = await client
      .from('scenarios')
      .update({ is_shared: true })
      .eq('id', scenarioId)
      .eq('user_id', user.id)
      .select()
      .single();

    return { data, error };
  }

  // Generate new token and enable sharing
  const shareToken = generateShareToken();
  const { data, error } = await client
    .from('scenarios')
    .update({
      share_token: shareToken,
      is_shared: true,
      shared_at: new Date().toISOString(),
    })
    .eq('id', scenarioId)
    .eq('user_id', user.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Disable sharing for a scenario
 * @param client - Supabase client instance
 * @param scenarioId - Scenario ID to disable sharing for
 * @returns Updated scenario or error
 */
export async function disableScenarioSharing(
  client: TypedSupabaseClient,
  scenarioId: string
) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await client
    .from('scenarios')
    .update({ is_shared: false })
    .eq('id', scenarioId)
    .eq('user_id', user.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Get a shared scenario by token (public access, no auth required)
 * @param client - Supabase client instance
 * @param token - Share token
 * @returns Scenario data or error
 */
export async function getSharedScenario(
  client: TypedSupabaseClient,
  token: string
) {
  const { data, error } = await client
    .from('scenarios')
    .select('*')
    .eq('share_token', token)
    .eq('is_shared', true)
    .single();

  return { data, error };
}
