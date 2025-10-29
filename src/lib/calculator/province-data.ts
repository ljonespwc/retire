/**
 * Canadian province/territory data for retirement calculator
 */

import { Province } from '@/types/constants'

export const PROVINCE_NAMES: Record<Province, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NT: 'Northwest Territories',
  NS: 'Nova Scotia',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon'
}

// Generate select options from province names
export const PROVINCE_OPTIONS = Object.entries(PROVINCE_NAMES).map(([value, label]) => ({
  value,
  label
}))
