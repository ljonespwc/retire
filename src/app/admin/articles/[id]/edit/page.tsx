import { isAdmin } from '@/lib/auth/admin-check'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArticleForm } from '@/components/admin/ArticleForm'
import { ArticleFormData } from '@/types/blog'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface EditArticlePageProps {
  params: Promise<{ id: string }>
}

async function getArticle(id: string): Promise<ArticleFormData | null> {
  const supabase = await createClient()

  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !article) {
    return null
  }

  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featured_image_url: article.featured_image_url,
    cta_text: article.cta_text,
    status: article.status as 'draft' | 'published' | 'archived',
    publish_date: article.publish_date,
    reading_time_minutes: article.reading_time_minutes,
  }
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  // Check admin access
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    redirect('/calculator/home')
  }

  const { id } = await params
  const article = await getArticle(id)

  if (!article) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-2 mb-6 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Articles
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Article</h1>
          <p className="text-gray-400">{article.title}</p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8">
          <ArticleForm mode="edit" initialData={article} articleId={id} />
        </div>
      </div>
    </div>
  )
}
