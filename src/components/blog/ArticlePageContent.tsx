'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ArticleWithLikes } from '@/types/blog'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { LikeButton } from '@/components/blog/LikeButton'
import { CTASection } from '@/components/blog/CTASection'
import { formatReadingTime } from '@/lib/blog/reading-time'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAuth } from '@/contexts/AuthContext'
import { LoginModal } from '@/components/auth/LoginModal'

interface ArticlePageContentProps {
  article: ArticleWithLikes
  structuredData: object
}

export function ArticlePageContent({ article, structuredData }: ArticlePageContentProps) {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)
  const [mounted, setMounted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, isAnonymous, loading: authLoading, logout } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const effectiveDarkMode = mounted ? isDarkMode : false

  const theme = {
    background: effectiveDarkMode
      ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800'
      : 'bg-gradient-to-br from-orange-50 via-rose-50 to-teal-50',
    headerBg: effectiveDarkMode
      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
      : 'bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400',
    text: {
      primary: effectiveDarkMode ? 'text-gray-100' : 'text-gray-800',
      secondary: effectiveDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: effectiveDarkMode ? 'text-gray-400' : 'text-gray-500',
    },
  }

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleLoginClick = () => {
    setShowLoginModal(true)
  }

  // Format publish date
  const publishDate = new Date(article.publish_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={`min-h-screen ${theme.background}`}>
        <CalculatorHeader
          isDarkMode={effectiveDarkMode}
          theme={theme}
          isAnonymous={isAnonymous}
          authLoading={authLoading}
          user={user}
          onToggleDarkMode={handleToggleDarkMode}
          onLoginClick={handleLoginClick}
          onLogout={logout}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back to Articles Link */}
          <Link
            href="/articles"
            className={`inline-flex items-center gap-2 mb-8 hover:underline ${effectiveDarkMode ? 'text-blue-400' : 'text-orange-600'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Articles
          </Link>

          {/* Article Header */}
          <article className={`${effectiveDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 sm:p-12`}>
            <header className="mb-8">
              <h1 className={`text-4xl sm:text-5xl font-bold mb-6 ${theme.text.primary}`}>
                {article.title}
              </h1>

              <div className="flex items-center gap-4 mb-6 text-sm">
                <span className={effectiveDarkMode ? 'text-blue-400' : 'text-orange-600'}>{publishDate}</span>
                {article.reading_time_minutes && (
                  <>
                    <span className={effectiveDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                    <span className={effectiveDarkMode ? 'text-gray-400' : 'text-gray-600'}>{formatReadingTime(article.reading_time_minutes)}</span>
                  </>
                )}
              </div>

              {/* Like Button */}
              <div className="mb-8">
                <LikeButton articleId={article.id} initialLikes={article.likes} isDarkMode={effectiveDarkMode} />
              </div>

              {/* Featured Image */}
              {article.featured_image_url && (
                <img
                  src={article.featured_image_url}
                  alt={article.title}
                  className="w-full h-auto rounded-2xl mb-8"
                />
              )}
            </header>

            {/* Article Content (Markdown) */}
            <div
              className={`
                prose prose-lg max-w-none
                [&>p:first-of-type]:text-xl [&>p:first-of-type]:leading-relaxed [&>p:first-of-type]:font-medium
                [&_h2]:font-bold [&_h2]:text-3xl [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pt-8 [&_h2]:border-t
                [&_h3]:font-bold [&_h3]:text-2xl [&_h3]:mt-6 [&_h3]:mb-3
                [&_p]:leading-relaxed [&_p]:mb-6
                [&_strong]:font-bold
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6
                [&_li]:mb-2
                [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic
                [&_code]:px-2 [&_code]:py-1 [&_code]:rounded
                ${effectiveDarkMode
                  ? '[&>p:first-of-type]:text-gray-100 [&_h2]:text-gray-100 [&_h2]:border-blue-500/30 [&_h3]:text-gray-100 [&_p]:text-gray-200 [&_li]:text-gray-200 [&_strong]:text-orange-400 [&_a]:text-blue-400 hover:[&_a]:text-blue-300 [&_blockquote]:border-blue-700 [&_blockquote]:text-gray-300 [&_code]:bg-gray-900 [&_code]:text-gray-200'
                  : '[&>p:first-of-type]:text-gray-800 [&_h2]:text-gray-900 [&_h2]:border-orange-200 [&_h3]:text-gray-900 [&_p]:text-gray-700 [&_strong]:text-orange-600 [&_a]:text-blue-600 hover:[&_a]:text-blue-700 [&_blockquote]:border-blue-500 [&_code]:bg-gray-100'}
              `}
            >
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>

            {/* Divider */}
            <hr className={`my-12 ${effectiveDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* CTA Section */}
            <CTASection ctaText={article.cta_text} isDarkMode={effectiveDarkMode} />
          </article>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={() => setShowLoginModal(false)}
          isDarkMode={effectiveDarkMode}
        />
      </div>
    </>
  )
}
