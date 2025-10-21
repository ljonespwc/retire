/**
 * Canadian financial constants for 2025
 * Includes tax brackets, CPP/OAS amounts, and RRIF minimum percentages
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
 * Federal tax brackets for 2025
 * Source: Canada Revenue Agency
 */
export const FEDERAL_TAX_BRACKETS_2025: TaxBracket[] = [
  { limit: 55867, rate: 0.15 },
  { limit: 111733, rate: 0.205 },
  { limit: 173205, rate: 0.26 },
  { limit: 246752, rate: 0.29 },
  { limit: null, rate: 0.33 },
];

/**
 * Provincial/territorial tax brackets for 2025
 * Source: Provincial revenue agencies
 */
export const PROVINCIAL_TAX_BRACKETS: Record<Province, TaxBracket[]> = {
  [Province.AB]: [
    { limit: 148269, rate: 0.10 },
    { limit: 177922, rate: 0.12 },
    { limit: 237230, rate: 0.13 },
    { limit: 355845, rate: 0.14 },
    { limit: null, rate: 0.15 },
  ],
  [Province.BC]: [
    { limit: 47937, rate: 0.0506 },
    { limit: 95875, rate: 0.077 },
    { limit: 110076, rate: 0.105 },
    { limit: 133664, rate: 0.1229 },
    { limit: 181232, rate: 0.147 },
    { limit: 252752, rate: 0.168 },
    { limit: null, rate: 0.205 },
  ],
  [Province.MB]: [
    { limit: 47000, rate: 0.108 },
    { limit: 100000, rate: 0.1275 },
    { limit: null, rate: 0.174 },
  ],
  [Province.NB]: [
    { limit: 49958, rate: 0.094 },
    { limit: 99916, rate: 0.14 },
    { limit: 185064, rate: 0.16 },
    { limit: null, rate: 0.195 },
  ],
  [Province.NL]: [
    { limit: 43198, rate: 0.087 },
    { limit: 86395, rate: 0.145 },
    { limit: 154244, rate: 0.158 },
    { limit: 215943, rate: 0.178 },
    { limit: null, rate: 0.208 },
  ],
  [Province.NT]: [
    { limit: 50597, rate: 0.059 },
    { limit: 101198, rate: 0.086 },
    { limit: 164525, rate: 0.122 },
    { limit: null, rate: 0.1405 },
  ],
  [Province.NS]: [
    { limit: 29590, rate: 0.0879 },
    { limit: 59180, rate: 0.1495 },
    { limit: 93000, rate: 0.1667 },
    { limit: 150000, rate: 0.175 },
    { limit: null, rate: 0.21 },
  ],
  [Province.NU]: [
    { limit: 53268, rate: 0.04 },
    { limit: 106537, rate: 0.07 },
    { limit: 173205, rate: 0.09 },
    { limit: null, rate: 0.115 },
  ],
  [Province.ON]: [
    { limit: 51446, rate: 0.0505 },
    { limit: 102894, rate: 0.0915 },
    { limit: 150000, rate: 0.1116 },
    { limit: 220000, rate: 0.1216 },
    { limit: null, rate: 0.1316 },
  ],
  [Province.PE]: [
    { limit: 32656, rate: 0.098 },
    { limit: 64313, rate: 0.138 },
    { limit: null, rate: 0.167 },
  ],
  [Province.QC]: [
    { limit: 51780, rate: 0.14 },
    { limit: 103545, rate: 0.19 },
    { limit: 126000, rate: 0.24 },
    { limit: null, rate: 0.2575 },
  ],
  [Province.SK]: [
    { limit: 52057, rate: 0.105 },
    { limit: 148734, rate: 0.125 },
    { limit: null, rate: 0.145 },
  ],
  [Province.YT]: [
    { limit: 55867, rate: 0.064 },
    { limit: 111733, rate: 0.09 },
    { limit: 173205, rate: 0.109 },
    { limit: 500000, rate: 0.128 },
    { limit: null, rate: 0.15 },
  ],
};

/**
 * CPP (Canada Pension Plan) amounts for 2025
 */
export const CPP_AMOUNTS = {
  /** Maximum monthly CPP benefit at age 65 (2025) */
  max_monthly_at_65: 1433.00,
  /** Average monthly CPP benefit at age 65 (2025) */
  average_monthly_at_65: 816.52,
  /** Maximum annual pensionable earnings (2025) */
  ympe: 68500,
  /** Basic exemption amount */
  basic_exemption: 3500,
  /** Contribution rate (employee + employer) */
  contribution_rate: 0.1190,
  /** Early reduction per month before 65 (0.6% per month) */
  early_reduction_rate: 0.006,
  /** Late increase per month after 65 (0.7% per month) */
  late_increase_rate: 0.007,
  /** Minimum age to start receiving CPP */
  min_age: 60,
  /** Maximum age to defer CPP */
  max_age: 70,
};

/**
 * OAS (Old Age Security) amounts for 2025
 */
export const OAS_AMOUNTS = {
  /** Maximum monthly OAS benefit (2025 Q1) */
  max_monthly: 718.33,
  /** Age to start receiving OAS */
  standard_age: 65,
  /** Maximum age to defer OAS */
  max_deferral_age: 70,
  /** Deferral increase per month (0.6% per month) */
  deferral_increase_rate: 0.006,
  /** Income threshold for OAS clawback (2025) */
  clawback_threshold: 90997,
  /** OAS recovery tax rate (15% of income over threshold) */
  clawback_rate: 0.15,
  /** Income level at which OAS is fully clawed back */
  full_clawback_income: 148451,
};

/**
 * RRIF (Registered Retirement Income Fund) minimum withdrawal percentages by age
 * Percentage of account value that must be withdrawn each year
 */
export const RRIF_MINIMUM_PERCENTAGES: Record<number, number> = {
  55: 0.0286,
  56: 0.0290,
  57: 0.0294,
  58: 0.0299,
  59: 0.0303,
  60: 0.0308,
  61: 0.0313,
  62: 0.0318,
  63: 0.0323,
  64: 0.0328,
  65: 0.0333,
  66: 0.0339,
  67: 0.0345,
  68: 0.0351,
  69: 0.0357,
  70: 0.0364,
  71: 0.0528,
  72: 0.0540,
  73: 0.0553,
  74: 0.0567,
  75: 0.0582,
  76: 0.0598,
  77: 0.0617,
  78: 0.0636,
  79: 0.0658,
  80: 0.0682,
  81: 0.0708,
  82: 0.0738,
  83: 0.0771,
  84: 0.0808,
  85: 0.0851,
  86: 0.0899,
  87: 0.0955,
  88: 0.1021,
  89: 0.1099,
  90: 0.1192,
  91: 0.1306,
  92: 0.1449,
  93: 0.1634,
  94: 0.1879,
  95: 0.2000,
};

/**
 * Get RRIF minimum percentage for a given age
 * For ages 95+, use 20% (highest rate)
 */
export function getRRIFMinimumPercentage(age: number): number {
  if (age < 55) return 0;
  if (age >= 95) return 0.2000;
  return RRIF_MINIMUM_PERCENTAGES[age] || 0;
}

/**
 * TFSA (Tax-Free Savings Account) contribution limits by year
 */
export const TFSA_ANNUAL_LIMITS: Record<number, number> = {
  2009: 5000,
  2010: 5000,
  2011: 5000,
  2012: 5000,
  2013: 5500,
  2014: 5500,
  2015: 10000,
  2016: 5500,
  2017: 5500,
  2018: 5500,
  2019: 6000,
  2020: 6000,
  2021: 6000,
  2022: 6000,
  2023: 6500,
  2024: 7000,
  2025: 7000,
};

/**
 * Calculate total TFSA contribution room since inception
 */
export function calculateTFSARoom(birthYear: number, currentYear: number = 2025): number {
  // Must be 18+ to contribute
  const firstEligibleYear = Math.max(2009, birthYear + 18);

  let totalRoom = 0;
  for (let year = firstEligibleYear; year <= currentYear; year++) {
    totalRoom += TFSA_ANNUAL_LIMITS[year] || 7000; // Default to current limit
  }

  return totalRoom;
}

/**
 * Basic Personal Amount (BPA) - federal non-refundable tax credit for 2025
 */
export const BASIC_PERSONAL_AMOUNT_2025 = 15705;

/**
 * Age Amount - additional non-refundable credit for those 65+ (2025)
 */
export const AGE_AMOUNT_2025 = {
  max_credit: 8790,
  income_threshold: 43906,
  reduction_rate: 0.15,
};
