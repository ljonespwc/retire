'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { ArticleWithLikes } from '@/types/blog'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAuth } from '@/contexts/AuthContext'
import { LoginModal } from '@/components/auth/LoginModal'

export default function ArticlesPage() {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false)
  const [mounted, setMounted] = useState(false)
  const [articles, setArticles] = useState<ArticleWithLikes[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, isAnonymous, loading: authLoading, logout } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchArticles() {
      const supabase = createClient()

      // Fetch published articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('publish_date', { ascending: false })

      if (articlesError) {
        console.error('Error fetching articles:', articlesError)
        setLoading(false)
        return
      }

      if (!articlesData || articlesData.length === 0) {
        setArticles([])
        setLoading(false)
        return
      }

      // Fetch likes for all articles
      const { data: likes, error: likesError } = await supabase
        .from('article_likes')
        .select('article_id, like_count')

      if (likesError) {
        console.error('Error fetching likes:', likesError)
      }

      // Create a map of article_id -> like_count
      const likesMap = new Map<string, number>()
      if (likes) {
        likes.forEach((like) => {
          likesMap.set(like.article_id, like.like_count)
        })
      }

      // Combine articles with their like counts
      const articlesWithLikes: ArticleWithLikes[] = articlesData.map((article) => ({
        ...article,
        likes: likesMap.get(article.id) || 0,
      }))

      setArticles(articlesWithLikes)
      setLoading(false)
    }

    fetchArticles()
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

  return (
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

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className={`text-4xl sm:text-5xl font-bold mb-4 ${theme.text.primary}`}>
            Plan smarter. Retire better.
          </h1>
          <p className={`text-lg sm:text-xl max-w-3xl mx-auto ${theme.text.secondary}`}>
            Clear, evidence-based thinking on CPP, OAS, and the retirement math that actually matters.
          </p>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className={`text-center py-20 ${theme.text.muted}`}>
            <p className="text-xl">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className={`text-center py-20 ${theme.text.muted}`}>
            <p className="text-xl">No articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} isDarkMode={effectiveDarkMode} />
            ))}
          </div>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => setShowLoginModal(false)}
        isDarkMode={effectiveDarkMode}
      />
    </div>
  )
}
