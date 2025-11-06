import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { ArticleWithLikes } from '@/types/blog'
import { cookies } from 'next/headers'

export const metadata = {
  title: 'Articles - Retirement Planning Guides | Retire Calculator',
  description: 'Expert advice on Canadian retirement planning, CPP, OAS, RRSP, and financial independence.',
}

async function getPublishedArticles(): Promise<ArticleWithLikes[]> {
  const supabase = await createClient()

  // Fetch published articles with likes
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('publish_date', { ascending: false })

  if (articlesError) {
    console.error('Error fetching articles:', articlesError)
    return []
  }

  if (!articles || articles.length === 0) {
    return []
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
  const articlesWithLikes: ArticleWithLikes[] = articles.map((article) => ({
    ...article,
    likes: likesMap.get(article.id) || 0,
  }))

  return articlesWithLikes
}

export default async function ArticlesPage() {
  const articles = await getPublishedArticles()

  // Check dark mode from cookie (same approach as calculator)
  const cookieStore = await cookies()
  const darkModeCookie = cookieStore.get('darkMode')
  const isDarkMode = darkModeCookie?.value === 'true'

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800' : 'bg-gradient-to-br from-orange-50 via-rose-50 to-teal-50'}`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className={`text-4xl sm:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Retirement Planning Articles
          </h1>
          <p className={`text-lg sm:text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Expert guidance on Canadian retirement planning, government benefits, tax strategies, and financial independence.
          </p>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-xl">No articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} isDarkMode={isDarkMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
