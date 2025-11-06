/**
 * TypeScript types for blog/article features
 */

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string // Markdown content
  featured_image_url: string | null
  cta_text: string | null // Dynamic CTA text, null uses default
  status: ArticleStatus
  publish_date: string // ISO timestamp
  created_at: string
  updated_at: string
  author_id: string | null
  reading_time_minutes: number | null
}

export interface ArticleLikes {
  id: string
  article_id: string
  like_count: number
  created_at: string
  updated_at: string
}

/**
 * Article with likes included (for listings and detail pages)
 */
export interface ArticleWithLikes extends Article {
  likes: number // Total like count from article_likes table
}

/**
 * Form data for creating/editing articles
 */
export interface ArticleFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string | null
  cta_text: string | null
  status: ArticleStatus
  publish_date: string
  reading_time_minutes: number | null
}
