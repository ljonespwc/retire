/**
 * Tax data query functions for Canadian federal and provincial tax information
 * Retrieves data from Supabase database with in-memory caching
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { Province, TaxBracket } from '@/types/constants';

type TypedSupabaseClient = SupabaseClient<Database>;

// In-memory cache with 24-hour TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get all available tax years
 */
export async function getTaxYears(client: TypedSupabaseClient) {
  const cacheKey = getCacheKey('tax_years');
  const cached = getFromCache<number[]>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('tax_years')
    .select('year')
    .eq('is_active', true)
    .order('year', { ascending: false });

  if (error) return { data: null, error };

  const years = data.map((row: any) => row.year);
  setCache(cacheKey, years);

  return { data: years, error: null };
}

/**
 * Get federal tax brackets for a specific year
 */
export async function getFederalTaxBrackets(
  client: TypedSupabaseClient,
  year: number = 2025
): Promise<{ data: TaxBracket[] | null; error: any }> {
  const cacheKey = getCacheKey('federal_brackets', year);
  const cached = getFromCache<TaxBracket[]>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('federal_tax_brackets')
    .select('income_limit, rate')
    .eq('year', year)
    .order('bracket_index');

  if (error) return { data: null, error };

  const brackets: TaxBracket[] = data.map((row: any) => ({
    limit: row.income_limit,
    rate: parseFloat(row.rate),
  }));

  setCache(cacheKey, brackets);
  return { data: brackets, error: null };
}

/**
 * Get provincial tax brackets for a specific year and province
 */
export async function getProvincialTaxBrackets(
  client: TypedSupabaseClient,
  province: Province,
  year: number = 2025
): Promise<{ data: TaxBracket[] | null; error: any }> {
  const cacheKey = getCacheKey('provincial_brackets', year, province);
  const cached = getFromCache<TaxBracket[]>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('provincial_tax_brackets')
    .select('income_limit, rate')
    .eq('year', year)
    .eq('province_code', province)
    .order('bracket_index');

  if (error) return { data: null, error };

  const brackets: TaxBracket[] = data.map((row: any) => ({
    limit: row.income_limit,
    rate: parseFloat(row.rate),
  }));

  setCache(cacheKey, brackets);
  return { data: brackets, error: null };
}

/**
 * Get all provincial tax brackets for a specific year
 */
export async function getAllProvincialTaxBrackets(
  client: TypedSupabaseClient,
  year: number = 2025
): Promise<{ data: Record<Province, TaxBracket[]> | null; error: any }> {
  const cacheKey = getCacheKey('all_provincial_brackets', year);
  const cached = getFromCache<Record<Province, TaxBracket[]>>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('provincial_tax_brackets')
    .select('province_code, income_limit, rate, bracket_index')
    .eq('year', year)
    .order('province_code')
    .order('bracket_index');

  if (error) return { data: null, error };

  // Group by province
  const bracketsMap: Record<string, TaxBracket[]> = {};
  data.forEach((row: any) => {
    if (!bracketsMap[row.province_code]) {
      bracketsMap[row.province_code] = [];
    }
    bracketsMap[row.province_code].push({
      limit: row.income_limit,
      rate: parseFloat(row.rate),
    });
  });

  setCache(cacheKey, bracketsMap);
  return { data: bracketsMap as Record<Province, TaxBracket[]>, error: null };
}

/**
 * Get CPP amounts for a specific year
 */
export async function getCPPAmounts(
  client: TypedSupabaseClient,
  year: number = 2025
) {
  const cacheKey = getCacheKey('cpp_amounts', year);
  const cached = getFromCache<any>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('government_benefits')
    .select('data')
    .eq('year', year)
    .eq('benefit_type', 'CPP')
    .single();

  if (error) return { data: null, error };

  setCache(cacheKey, data.data);
  return { data: data.data, error: null };
}

/**
 * Get OAS amounts for a specific year
 */
export async function getOASAmounts(
  client: TypedSupabaseClient,
  year: number = 2025
) {
  const cacheKey = getCacheKey('oas_amounts', year);
  const cached = getFromCache<any>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('government_benefits')
    .select('data')
    .eq('year', year)
    .eq('benefit_type', 'OAS')
    .single();

  if (error) return { data: null, error };

  setCache(cacheKey, data.data);
  return { data: data.data, error: null };
}

/**
 * Get RRIF minimum withdrawal percentages
 * These don't change by year
 */
export async function getRRIFMinimums(client: TypedSupabaseClient) {
  const cacheKey = getCacheKey('rrif_minimums');
  const cached = getFromCache<Record<number, number>>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('rrif_minimums')
    .select('age, percentage')
    .order('age');

  if (error) return { data: null, error };

  const minimums: Record<number, number> = {};
  data.forEach((row: any) => {
    minimums[row.age] = parseFloat(row.percentage);
  });

  setCache(cacheKey, minimums);
  return { data: minimums, error: null };
}

/**
 * Get RRIF minimum percentage for a specific age
 */
export async function getRRIFMinimumPercentage(
  client: TypedSupabaseClient,
  age: number
): Promise<number> {
  if (age < 55) return 0;
  if (age >= 95) return 0.2;

  const { data } = await getRRIFMinimums(client);
  return data?.[age] || 0;
}

/**
 * Get TFSA contribution limits (all years)
 */
export async function getTFSALimits(client: TypedSupabaseClient) {
  const cacheKey = getCacheKey('tfsa_limits');
  const cached = getFromCache<Record<number, number>>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('tfsa_limits')
    .select('year, annual_limit')
    .order('year');

  if (error) return { data: null, error };

  const limits: Record<number, number> = {};
  data.forEach((row: any) => {
    limits[row.year] = row.annual_limit;
  });

  setCache(cacheKey, limits);
  return { data: limits, error: null };
}

/**
 * Calculate total TFSA contribution room since inception
 */
export async function calculateTFSARoom(
  client: TypedSupabaseClient,
  birthYear: number,
  currentYear: number = 2025
): Promise<number> {
  const { data: limits } = await getTFSALimits(client);
  if (!limits) return 0;

  const firstEligibleYear = Math.max(2009, birthYear + 18);
  let totalRoom = 0;

  for (let year = firstEligibleYear; year <= currentYear; year++) {
    totalRoom += limits[year] || 7000; // Default to current limit
  }

  return totalRoom;
}

/**
 * Get federal tax credits for a specific year
 */
export async function getTaxCredits(
  client: TypedSupabaseClient,
  year: number = 2025
) {
  const cacheKey = getCacheKey('tax_credits', year);
  const cached = getFromCache<any>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('tax_credits')
    .select('credit_type, data')
    .eq('year', year)
    .is('province_code', null); // Federal credits only

  if (error) return { data: null, error };

  const credits: Record<string, any> = {};
  data.forEach((row: any) => {
    credits[row.credit_type] = row.data;
  });

  setCache(cacheKey, credits);
  return { data: credits, error: null };
}

/**
 * Get provincial tax credits for a specific year and province
 */
export async function getProvincialTaxCredits(
  client: TypedSupabaseClient,
  province: Province,
  year: number = 2025
) {
  const cacheKey = getCacheKey('provincial_tax_credits', year, province);
  const cached = getFromCache<any>(cacheKey);
  if (cached) return { data: cached, error: null };

  const { data, error } = await client
    .from('tax_credits')
    .select('credit_type, data')
    .eq('year', year)
    .eq('province_code', province);

  if (error) return { data: null, error };

  const credits: Record<string, any> = {};
  data.forEach((row: any) => {
    credits[row.credit_type] = row.data;
  });

  setCache(cacheKey, credits);
  return { data: credits, error: null };
}

/**
 * Get federal Basic Personal Amount for a specific year
 */
export async function getBasicPersonalAmount(
  client: TypedSupabaseClient,
  year: number = 2025
): Promise<number> {
  const { data } = await getTaxCredits(client, year);
  return data?.BASIC_PERSONAL_AMOUNT?.amount || 15705;
}

/**
 * Get provincial Basic Personal Amount for a specific year and province
 */
export async function getProvincialBasicPersonalAmount(
  client: TypedSupabaseClient,
  province: Province,
  year: number = 2025
): Promise<number> {
  const { data } = await getProvincialTaxCredits(client, province, year);
  return data?.BASIC_PERSONAL_AMOUNT?.amount || 0;
}

/**
 * Get federal Age Amount credit for a specific year
 */
export async function getAgeAmount(
  client: TypedSupabaseClient,
  year: number = 2025
) {
  const { data } = await getTaxCredits(client, year);
  return data?.AGE_AMOUNT || { max_credit: 8790, income_threshold: 43906, reduction_rate: 0.15 };
}

/**
 * Get provincial Age Amount credit for a specific year and province (if available)
 */
export async function getProvincialAgeAmount(
  client: TypedSupabaseClient,
  province: Province,
  year: number = 2025
) {
  const { data } = await getProvincialTaxCredits(client, province, year);
  return data?.AGE_AMOUNT || null; // Not all provinces have age amounts
}

/**
 * Clear all cached tax data
 * Useful for forcing a refresh after data updates
 */
export function clearTaxDataCache(): void {
  cache.clear();
}
