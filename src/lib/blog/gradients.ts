/**
 * Gradient palette for article cards
 * Gradients assigned consistently by article ID hash.
 */

const GRADIENTS = [
  { light: 'from-orange-100 via-rose-100 to-pink-100', dark: 'from-orange-500/50 via-rose-500/50 to-pink-500/50' },
  { light: 'from-blue-100 via-cyan-100 to-teal-100', dark: 'from-blue-500/50 via-cyan-500/50 to-teal-500/50' },
  { light: 'from-emerald-100 via-green-100 to-lime-100', dark: 'from-emerald-500/50 via-green-500/50 to-lime-500/50' },
  { light: 'from-purple-100 via-violet-100 to-indigo-100', dark: 'from-purple-500/50 via-violet-500/50 to-indigo-500/50' },
  { light: 'from-amber-100 via-orange-100 to-red-100', dark: 'from-amber-500/50 via-orange-500/50 to-red-500/50' },
  { light: 'from-teal-100 via-emerald-100 to-green-100', dark: 'from-teal-500/50 via-emerald-500/50 to-green-500/50' },
  { light: 'from-sky-100 via-blue-100 to-indigo-100', dark: 'from-sky-500/50 via-blue-500/50 to-indigo-500/50' },
  { light: 'from-pink-100 via-rose-100 to-red-100', dark: 'from-pink-500/50 via-rose-500/50 to-red-500/50' },
  { light: 'from-yellow-100 via-amber-100 to-orange-100', dark: 'from-yellow-500/50 via-amber-500/50 to-orange-500/50' },
  { light: 'from-slate-100 via-gray-100 to-zinc-100', dark: 'from-indigo-500/50 via-purple-500/50 to-pink-500/50' },
]

/** Get gradient class for article card based on article ID */
export function getArticleCardStyles(articleId: string, isDarkMode: boolean): { gradient: string } {
  const hash = articleId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const config = GRADIENTS[Math.abs(hash) % GRADIENTS.length]
  return { gradient: `bg-gradient-to-br ${isDarkMode ? config.dark : config.light}` }
}
