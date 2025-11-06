import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin-check'
import { redirect } from 'next/navigation'
import { ArticleWithLikes } from '@/types/blog'
import Link from 'next/link'
import { PlusCircle, Edit, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Manage Articles - Admin',
}

async function getArticles(): Promise<ArticleWithLikes[]> {
  const supabase = await createClient()

  // Fetch all articles (drafts, published, archived)
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  if (!articles || articles.length === 0) {
    return []
  }

  // Fetch likes for all articles
  const { data: likes } = await supabase
    .from('article_likes')
    .select('article_id, like_count')

  const likesMap = new Map<string, number>()
  if (likes) {
    likes.forEach((like) => {
      likesMap.set(like.article_id, like.like_count)
    })
  }

  return articles.map((article) => ({
    ...article,
    likes: likesMap.get(article.id) || 0,
  }))
}

export default async function AdminArticlesPage() {
  // Check admin access
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    redirect('/calculator/home')
  }

  const articles = await getArticles()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Manage Articles</h1>
            <p className="text-gray-400">Create and edit blog articles</p>
          </div>
          <Link href="/admin/articles/new">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg">
              <PlusCircle className="w-5 h-5 mr-2" />
              New Article
            </Button>
          </Link>
        </div>

        {/* Articles Table */}
        {articles.length === 0 ? (
          <div className="bg-gray-800 rounded-3xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No articles yet</p>
            <Link href="/admin/articles/new">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl">
                Create Your First Article
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{article.title}</div>
                        <div className="text-gray-400 text-sm">/{article.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`
                          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                          ${article.status === 'published' ? 'bg-green-900/30 text-green-400' : ''}
                          ${article.status === 'draft' ? 'bg-yellow-900/30 text-yellow-400' : ''}
                          ${article.status === 'archived' ? 'bg-gray-900/30 text-gray-400' : ''}
                        `}
                      >
                        {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {new Date(article.publish_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{article.likes}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/articles/${article.id}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-700 text-blue-400 hover:bg-blue-900/30 rounded-lg"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        {article.status === 'published' && (
                          <Link href={`/articles/${article.slug}`} target="_blank">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg"
                            >
                              View
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
