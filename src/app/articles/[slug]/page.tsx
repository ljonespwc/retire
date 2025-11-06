import { createClient } from '@/lib/supabase/server'
import { LikeButton } from '@/components/blog/LikeButton'
import { CTASection } from '@/components/blog/CTASection'
import { ArticleWithLikes } from '@/types/blog'
import { formatReadingTime } from '@/lib/blog/reading-time'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import type { Metadata } from 'next'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

async function getArticle(slug: string): Promise<ArticleWithLikes | null> {
  const supabase = await createClient()

  // Fetch article by slug
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !article) {
    return null
  }

  // Fetch likes for this article
  const { data: likes } = await supabase
    .from('article_likes')
    .select('like_count')
    .eq('article_id', article.id)
    .single()

  return {
    ...article,
    likes: likes?.like_count || 0,
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://retirementcalculator.ca'
  const articleUrl = `${siteUrl}/articles/${article.slug}`
  const imageUrl = article.featured_image_url || `${siteUrl}/og-image.png`

  return {
    title: `${article.title} | Retirement Planning Guide`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: articleUrl,
      type: 'article',
      publishedTime: article.publish_date,
      modifiedTime: article.updated_at,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [imageUrl],
    },
    alternates: {
      canonical: articleUrl,
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  const cookieStore = await cookies()
  const darkModeCookie = cookieStore.get('darkMode')
  const isDarkMode = darkModeCookie?.value === 'true'

  // Format publish date
  const publishDate = new Date(article.publish_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Structured data (JSON-LD) for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featured_image_url || `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`,
    datePublished: article.publish_date,
    dateModified: article.updated_at,
    author: {
      '@type': 'Organization',
      name: 'Retirement Calculator',
    },
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800' : 'bg-gradient-to-br from-orange-50 via-rose-50 to-teal-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumbs */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/" className={`hover:underline ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Home
                </Link>
              </li>
              <li className={isDarkMode ? 'text-gray-600' : 'text-gray-400'}>/</li>
              <li>
                <Link href="/articles" className={`hover:underline ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Articles
                </Link>
              </li>
              <li className={isDarkMode ? 'text-gray-600' : 'text-gray-400'}>/</li>
              <li className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{article.title}</li>
            </ol>
          </nav>

          {/* Back to Articles Link */}
          <Link
            href="/articles"
            className={`inline-flex items-center gap-2 mb-8 hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Articles
          </Link>

          {/* Article Header */}
          <article className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 sm:p-12`}>
            <header className="mb-8">
              <h1 className={`text-4xl sm:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {article.title}
              </h1>

              <div className={`flex items-center gap-4 mb-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>{publishDate}</span>
                {article.reading_time_minutes && (
                  <>
                    <span>•</span>
                    <span>{formatReadingTime(article.reading_time_minutes)}</span>
                  </>
                )}
              </div>

              {/* Like Button */}
              <div className="mb-8">
                <LikeButton articleId={article.id} initialLikes={article.likes} isDarkMode={isDarkMode} />
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
                ${isDarkMode ? 'prose-invert' : ''}
                prose-headings:font-bold
                prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-blue-600 hover:prose-a:text-blue-700
                prose-strong:font-bold
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6
                prose-li:mb-2
                prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic
                ${isDarkMode ? 'prose-blockquote:border-blue-700' : 'prose-blockquote:border-blue-500'}
                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded
                ${isDarkMode ? 'prose-code:bg-gray-900' : ''}
              `}
            >
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>

            {/* Divider */}
            <hr className={`my-12 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* CTA Section */}
            <CTASection ctaText={article.cta_text} isDarkMode={isDarkMode} />
          </article>
        </div>
      </div>
    </>
  )
}
