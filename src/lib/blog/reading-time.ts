/**
 * Calculate reading time for article content
 *
 * Estimates reading time based on word count
 * Average reading speed: 200-250 words per minute
 */

const WORDS_PER_MINUTE = 225 // Average reading speed

/**
 * Calculate reading time from markdown content
 * Strips markdown syntax and counts words
 */
export function calculateReadingTime(markdownContent: string): number {
  // Remove markdown syntax for accurate word count
  const plainText = markdownContent
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .replace(/[*_~]/g, '') // Remove bold, italic, strikethrough
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
    .replace(/^>\s/gm, '') // Remove blockquotes
    .replace(/^-\s/gm, '') // Remove list markers
    .replace(/^\d+\.\s/gm, '') // Remove numbered list markers

  // Count words
  const words = plainText.trim().split(/\s+/).length

  // Calculate minutes and round
  const minutes = Math.ceil(words / WORDS_PER_MINUTE)

  // Minimum 1 minute
  return Math.max(1, minutes)
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`
}
