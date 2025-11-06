'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { ArticleWithLikes } from '@/types/blog'
import { getArticleGradientClass } from '@/lib/blog/gradients'
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

  // Get gradient for this article
  const gradientClass = getArticleGradientClass(article.id, isDarkMode)

  return (
    <Link href={`/articles/${article.slug}`}>
      <div
        className={`${gradientClass} rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col justify-between min-h-[280px]`}
      >
        {/* Article Content */}
        <div>
          <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {article.title}
          </h3>
          <p className={`text-base mb-4 line-clamp-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {article.excerpt}
          </p>
        </div>

        {/* Article Meta */}
        <div className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="flex items-center gap-4">
            <span>{publishDate}</span>
            {article.reading_time_minutes && (
              <>
                <span>•</span>
                <span>{formatReadingTime(article.reading_time_minutes)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{article.likes}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
