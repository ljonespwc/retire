/**
 * Canadian financial type definitions and constants
 *
 * NOTE: As of Sprint 1, all tax data (brackets, CPP/OAS amounts, RRIF minimums, etc.)
 * has been migrated to the Supabase database for dynamic updates and multi-year support.
 *
 * This file now contains only TypeScript types and interfaces.
 * To retrieve tax data, use the query functions in src/lib/supabase/tax-data.ts
 */

/**
 * Canadian provinces and territories
 */
export enum Province {
  AB = 'AB', // Alberta
  BC = 'BC', // British Columbia
  MB = 'MB', // Manitoba
  NB = 'NB', // New Brunswick
  NL = 'NL', // Newfoundland and Labrador
  NT = 'NT', // Northwest Territories
  NS = 'NS', // Nova Scotia
  NU = 'NU', // Nunavut
  ON = 'ON', // Ontario
  PE = 'PE', // Prince Edward Island
  QC = 'QC', // Quebec
  SK = 'SK', // Saskatchewan
  YT = 'YT', // Yukon
}

/**
 * Tax bracket definition
 */
export interface TaxBracket {
  /** Upper limit of income for this bracket (null for highest bracket) */
  limit: number | null;
  /** Tax rate for this bracket (as decimal, e.g., 0.15 for 15%) */
  rate: number;
}

/**
 * DEPRECATED: Tax data has been moved to the database
 *
 * All federal/provincial tax brackets, CPP/OAS amounts, RRIF minimums, TFSA limits,
 * and tax credits are now stored in Supabase for dynamic updates and multi-year support.
 *
 * To retrieve this data, use the query functions in:
 * @see src/lib/supabase/tax-data.ts
 *
 * Example usage:
 * ```typescript
 * import { getFederalTaxBrackets, getProvincialTaxBrackets } from '@/lib/supabase/tax-data';
 * import { createClient } from '@/lib/supabase/client';
 *
 * const client = createClient();
 * const { data: federalBrackets } = await getFederalTaxBrackets(client, 2025);
 * const { data: ontarioBrackets } = await getProvincialTaxBrackets(client, Province.ON, 2025);
 * ```
 */
