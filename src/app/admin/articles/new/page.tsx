import { isAdmin } from '@/lib/auth/admin-check'
import { redirect } from 'next/navigation'
import { ArticleForm } from '@/components/admin/ArticleForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'New Article - Admin',
}

export default async function NewArticlePage() {
  // Check admin access
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    redirect('/calculator/home')
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
          <h1 className="text-3xl font-bold text-white mb-2">Create New Article</h1>
          <p className="text-gray-400">Write and publish a new blog article</p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8">
          <ArticleForm mode="create" />
        </div>
      </div>
    </div>
  )
}
