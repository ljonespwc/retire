'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { ArticleWithLikes } from '@/types/blog'
import { getArticleCardStyles } from '@/lib/blog/gradients'
import { formatReadingTime } from '@/lib/blog/reading-time'

interface ArticleCardProps {
  article: ArticleWithLikes
  isDarkMode: boolean
}

export function ArticleCard({ article, isDarkMode }: ArticleCardProps) {
  // Format publish date
  const publishDate = new Date(article.publish_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Get styles for this article (used as fallback when no image)
  const styles = getArticleCardStyles(article.id, isDarkMode)
  const hasImage = !!article.featured_image_url

  return (
    <Link href={`/articles/${article.slug}`}>
      <div
        className={`
          rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden
          border ${isDarkMode ? 'border-white/10' : 'border-gray-200/80'}
          ${hasImage
            ? (isDarkMode ? 'bg-gray-800' : 'bg-white')
            : styles.gradient
          }
        `}
      >
        {/* Featured Image */}
        {hasImage && (
          <div className="aspect-[1200/630] w-full overflow-hidden">
            <img
              src={article.featured_image_url!}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div className={`p-6 flex flex-col flex-grow ${hasImage ? '' : 'min-h-[280px]'}`}>
          <div className="flex-grow">
            <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {article.title}
            </h3>
            <p className={`text-base mb-4 line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {article.excerpt}
            </p>
          </div>

          {/* Article Meta */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className={isDarkMode ? 'text-blue-400' : 'text-orange-600'}>{publishDate}</span>
              {article.reading_time_minutes && (
                <>
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{formatReadingTime(article.reading_time_minutes)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{article.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
