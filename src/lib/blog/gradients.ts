/**
 * Gradient palette for article cards
 *
 * Provides predefined light gradients that work in both light and dark modes.
 * Gradients are assigned consistently based on article ID.
 */

export interface Gradient {
  light: string // Gradient for light mode
  dark: string // Gradient for dark mode
  name: string // Descriptive name
}

export const ARTICLE_GRADIENTS: Gradient[] = [
  {
    name: 'sunset',
    light: 'from-orange-100 via-rose-100 to-pink-100',
    dark: 'from-orange-900/40 via-rose-900/40 to-pink-900/40',
  },
  {
    name: 'ocean',
    light: 'from-blue-100 via-cyan-100 to-teal-100',
    dark: 'from-blue-900/40 via-cyan-900/40 to-teal-900/40',
  },
  {
    name: 'forest',
    light: 'from-emerald-100 via-green-100 to-lime-100',
    dark: 'from-emerald-900/40 via-green-900/40 to-lime-900/40',
  },
  {
    name: 'lavender',
    light: 'from-purple-100 via-violet-100 to-indigo-100',
    dark: 'from-purple-900/40 via-violet-900/40 to-indigo-900/40',
  },
  {
    name: 'peach',
    light: 'from-amber-100 via-orange-100 to-red-100',
    dark: 'from-amber-900/40 via-orange-900/40 to-red-900/40',
  },
  {
    name: 'mint',
    light: 'from-teal-100 via-emerald-100 to-green-100',
    dark: 'from-teal-900/40 via-emerald-900/40 to-green-900/40',
  },
  {
    name: 'sky',
    light: 'from-sky-100 via-blue-100 to-indigo-100',
    dark: 'from-sky-900/40 via-blue-900/40 to-indigo-900/40',
  },
  {
    name: 'rose',
    light: 'from-pink-100 via-rose-100 to-red-100',
    dark: 'from-pink-900/40 via-rose-900/40 to-red-900/40',
  },
  {
    name: 'golden',
    light: 'from-yellow-100 via-amber-100 to-orange-100',
    dark: 'from-yellow-900/40 via-amber-900/40 to-orange-900/40',
  },
  {
    name: 'cool',
    light: 'from-slate-100 via-gray-100 to-zinc-100',
    dark: 'from-slate-800/40 via-gray-800/40 to-zinc-800/40',
  },
]

/**
 * Get a gradient for an article based on its ID
 * Uses a simple hash to ensure the same article always gets the same gradient
 */
export function getArticleGradient(articleId: string, isDarkMode: boolean): string {
  // Simple hash function to convert UUID to number
  const hash = articleId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)

  // Get gradient index (stable for same ID)
  const index = Math.abs(hash) % ARTICLE_GRADIENTS.length
  const gradient = ARTICLE_GRADIENTS[index]

  return isDarkMode ? gradient.dark : gradient.light
}

/**
 * Get the full gradient class string for Tailwind
 */
export function getArticleGradientClass(articleId: string, isDarkMode: boolean): string {
  const gradient = getArticleGradient(articleId, isDarkMode)
  return `bg-gradient-to-br ${gradient}`
}
