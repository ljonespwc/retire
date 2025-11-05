/**
 * AI Claim Parser
 *
 * Extracts numerical claims and assertions from AI-generated text
 * (both narratives and insights) for validation purposes.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DollarAmount {
  value: number;
  raw: string; // Original text like "$962K"
  position: number; // Character position in text
}

export interface Age {
  value: number;
  raw: string; // Original text like "age 65"
  position: number;
}

export interface AgeRange {
  start: number;
  end: number;
  raw: string; // Original text like "ages 84-90"
  position: number;
}

export interface Percentage {
  value: number; // Decimal form (e.g., 0.05 for 5%)
  raw: string; // Original text like "5%"
  position: number;
}

export interface Claim {
  type: 'increase' | 'decrease' | 'deplete' | 'sustain' | 'peak' | 'reduce' | 'eliminate' | 'cut';
  subject: string; // What the claim is about (e.g., "portfolio", "CPP", "pension")
  raw: string; // Full claim text
  position: number;
}

export interface ParsedClaims {
  dollarAmounts: DollarAmount[];
  ages: Age[];
  ageRanges: AgeRange[];
  percentages: Percentage[];
  claims: Claim[];
  rawText: string;
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse dollar amounts from text
 * Handles: $962K, $1.2M, $100,000, $5000
 */
export function parseDollarAmounts(text: string): DollarAmount[] {
  const amounts: DollarAmount[] = [];

  // Pattern: $123K, $1.2M, $100,000
  const pattern = /\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(K|M|k|m|thousand|million)?/gi;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const numStr = match[1].replace(/,/g, '');
    let value = parseFloat(numStr);

    const unit = match[2]?.toUpperCase();
    if (unit === 'K' || unit === 'THOUSAND') {
      value *= 1000;
    } else if (unit === 'M' || unit === 'MILLION') {
      value *= 1000000;
    }

    amounts.push({
      value,
      raw: match[0],
      position: match.index,
    });
  }

  return amounts;
}

/**
 * Parse ages from text
 * Handles: age 65, at age 83, at 70
 */
export function parseAges(text: string): Age[] {
  const ages: Age[] = [];

  // Pattern: "age 65", "at age 83", "at 70"
  const patterns = [
    /\bage\s+(\d{2,3})\b/gi,
    /\bat\s+age\s+(\d{2,3})\b/gi,
    /\bat\s+(\d{2,3})\b/gi,
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex state

    while ((match = pattern.exec(text)) !== null) {
      const age = parseInt(match[1]);

      // Validate reasonable age range (50-120)
      if (age >= 50 && age <= 120) {
        ages.push({
          value: age,
          raw: match[0],
          position: match.index,
        });
      }
    }
  }

  // Remove duplicates (same age at same position)
  const unique = ages.filter((age, i, arr) =>
    arr.findIndex(a => a.value === age.value && a.position === age.position) === i
  );

  return unique;
}

/**
 * Parse age ranges from text
 * Handles: ages 84-90, age 65 to 70, between 60 and 65
 */
export function parseAgeRanges(text: string): AgeRange[] {
  const ranges: AgeRange[] = [];

  // Pattern: "ages 84-90", "age 65 to 70", "between 60 and 65"
  const patterns = [
    /\bages?\s+(\d{2,3})\s*-\s*(\d{2,3})\b/gi,
    /\bages?\s+(\d{2,3})\s+to\s+(\d{2,3})\b/gi,
    /\bbetween\s+(\d{2,3})\s+and\s+(\d{2,3})\b/gi,
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);

      // Validate reasonable range
      if (start >= 50 && end <= 120 && start < end) {
        ranges.push({
          start,
          end,
          raw: match[0],
          position: match.index,
        });
      }
    }
  }

  return ranges;
}

/**
 * Parse percentages from text
 * Handles: 100%, 5.5%, 3.14159%
 */
export function parsePercentages(text: string): Percentage[] {
  const percentages: Percentage[] = [];

  // Pattern: "100%", "5.5%"
  const pattern = /(\d+(?:\.\d+)?)\s*%/gi;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const value = parseFloat(match[1]) / 100; // Convert to decimal

    percentages.push({
      value,
      raw: match[0],
      position: match.index,
    });
  }

  return percentages;
}

/**
 * Parse claims (action verbs and subjects)
 * Handles: "increases CPP by", "portfolio depletes", "reduces pension"
 */
export function parseClaims(text: string): Claim[] {
  const claims: Claim[] = [];

  const claimPatterns = [
    { type: 'increase' as const, patterns: [/\b(increases?|higher|gains?|grows?)\s+(?:your\s+)?(\w+(?:\s+\w+)?)/gi] },
    { type: 'decrease' as const, patterns: [/\b(decreases?|lower|lowers?|drops?|falls?)\s+(?:your\s+)?(\w+(?:\s+\w+)?)/gi] },
    { type: 'deplete' as const, patterns: [/\b(depletes?|runs?\s+out|exhausts?)\s+(?:at|by)?/gi] },
    { type: 'sustain' as const, patterns: [/\b(sustains?|maintains?|preserves?)\s+(?:through)?/gi] },
    { type: 'peak' as const, patterns: [/\b(peaks?|maximizes?)\s+at/gi] },
    { type: 'reduce' as const, patterns: [/\b(reduces?|reducing|cuts?|cutting)\s+(?:your\s+)?(\w+(?:\s+\w+)?)/gi] },
    { type: 'eliminate' as const, patterns: [/\b(eliminates?|eliminating|wipes?\s+out)\s+(?:your\s+)?(\w+(?:\s+\w+)?)/gi] },
    { type: 'cut' as const, patterns: [/\b(cuts?)\s+(?:your\s+)?(\w+(?:\s+\w+)?)/gi] },
  ];

  for (const { type, patterns } of claimPatterns) {
    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;

      while ((match = pattern.exec(text)) !== null) {
        const subject = match[2] || '';

        claims.push({
          type,
          subject: subject.trim(),
          raw: match[0],
          position: match.index,
        });
      }
    }
  }

  return claims;
}

/**
 * Parse all claims from AI text
 */
export function parseAIClaims(text: string): ParsedClaims {
  return {
    dollarAmounts: parseDollarAmounts(text),
    ages: parseAges(text),
    ageRanges: parseAgeRanges(text),
    percentages: parsePercentages(text),
    claims: parseClaims(text),
    rawText: text,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find dollar amount close to a target value (within tolerance)
 */
export function findDollarAmountNear(
  amounts: DollarAmount[],
  target: number,
  tolerancePercent: number = 5
): DollarAmount | undefined {
  const tolerance = Math.abs(target) * (tolerancePercent / 100);

  return amounts.find(amount =>
    Math.abs(amount.value - target) <= tolerance
  );
}

/**
 * Find age close to a target value (within years)
 */
export function findAgeNear(
  ages: Age[],
  target: number,
  toleranceYears: number = 1
): Age | undefined {
  return ages.find(age =>
    Math.abs(age.value - target) <= toleranceYears
  );
}

/**
 * Check if text contains a claim about a specific subject
 */
export function hasClaim(
  claims: Claim[],
  type: Claim['type'],
  subjectKeywords: string[]
): Claim | undefined {
  return claims.find(claim =>
    claim.type === type &&
    subjectKeywords.some(keyword =>
      claim.subject.toLowerCase().includes(keyword.toLowerCase()) ||
      claim.raw.toLowerCase().includes(keyword.toLowerCase())
    )
  );
}
