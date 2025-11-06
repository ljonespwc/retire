/**
 * Generate URL-safe slugs from article titles
 *
 * Converts titles to lowercase, replaces spaces with hyphens,
 * removes special characters, and ensures uniqueness
 */

/**
 * Generate a slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
}

/**
 * Ensure slug is unique by checking against existing slugs
 * If not unique, append a number
 */
export function ensureUniqueSlug(slug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(slug)) {
    return slug
  }

  // Append number to make unique
  let counter = 1
  let newSlug = `${slug}-${counter}`

  while (existingSlugs.includes(newSlug)) {
    counter++
    newSlug = `${slug}-${counter}`
  }

  return newSlug
}

/**
 * Validate that a slug is properly formatted
 */
export function isValidSlug(slug: string): boolean {
  // Must be lowercase, alphanumeric with hyphens only
  // No leading/trailing hyphens, no consecutive hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}
