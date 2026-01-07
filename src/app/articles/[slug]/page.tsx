import { createClient } from '@/lib/supabase/server'
import { ArticleWithLikes } from '@/types/blog'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArticlePageContent } from '@/components/blog/ArticlePageContent'

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

  return <ArticlePageContent article={article} structuredData={structuredData} />
}
