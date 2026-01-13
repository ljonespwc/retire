import { createClient } from '@/lib/supabase/server'
import { ArticleWithLikes } from '@/types/blog'
import type { Metadata } from 'next'
import { ArticlesPageContent } from '@/components/blog/ArticlesPageContent'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.canadaretirecalc.com'

export const metadata: Metadata = {
  title: 'Retirement Planning Articles | Canadian CPP, OAS & Tax Guides',
  description: 'Expert guides on Canadian retirement planning. Learn about CPP timing, OAS optimization, RRSP/RRIF strategies, provincial taxes, and retirement income planning.',
  keywords: ['Canadian retirement', 'CPP timing', 'OAS optimization', 'RRSP withdrawal', 'RRIF strategy', 'retirement planning', 'Canadian taxes'],
  openGraph: {
    title: 'Retirement Planning Articles | Canada Retire Calc',
    description: 'Expert guides on Canadian retirement planning. Learn about CPP timing, OAS optimization, RRSP/RRIF strategies, and tax-efficient retirement income.',
    url: `${siteUrl}/articles`,
    type: 'website',
    siteName: 'Canada Retire Calc',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Canadian Retirement Planning Articles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retirement Planning Articles | Canada Retire Calc',
    description: 'Expert guides on Canadian retirement planning. CPP, OAS, RRSP/RRIF strategies, and tax optimization.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/articles`,
  },
}

async function getArticles(): Promise<ArticleWithLikes[]> {
  const supabase = await createClient()

  // Fetch published articles
  const { data: articlesData, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('publish_date', { ascending: false })

  if (articlesError || !articlesData) {
    console.error('Error fetching articles:', articlesError)
    return []
  }

  // Fetch likes for all articles
  const { data: likes } = await supabase
    .from('article_likes')
    .select('article_id, like_count')

  // Create a map of article_id -> like_count
  const likesMap = new Map<string, number>()
  if (likes) {
    likes.forEach((like) => {
      likesMap.set(like.article_id, like.like_count)
    })
  }

  // Combine articles with their like counts
  return articlesData.map((article) => ({
    ...article,
    likes: likesMap.get(article.id) || 0,
  }))
}

export default async function ArticlesPage() {
  const articles = await getArticles()

  // Structured data (JSON-LD) for SEO - Blog/CollectionPage schema
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Retirement Planning Articles',
    description: 'Expert guides on Canadian retirement planning covering CPP, OAS, RRSP/RRIF strategies, and tax optimization.',
    url: `${siteUrl}/articles`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Canada Retire Calc',
      url: siteUrl,
    },
    about: {
      '@type': 'Thing',
      name: 'Canadian Retirement Planning',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt,
          url: `${siteUrl}/articles/${article.slug}`,
          datePublished: article.publish_date,
          dateModified: article.updated_at,
          image: article.featured_image_url || `${siteUrl}/og-image.png`,
          author: {
            '@type': 'Organization',
            name: 'Canada Retire Calc',
          },
        },
      })),
    },
  }

  return <ArticlesPageContent articles={articles} structuredData={structuredData} />
}
