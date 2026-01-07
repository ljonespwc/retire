import { createClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth/admin-check'
import { NextRequest, NextResponse } from 'next/server'
import { ArticleFormData } from '@/types/blog'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = await createClient()
    const articleData: ArticleFormData = await request.json()

    // Validate required fields
    if (!articleData.title || !articleData.slug || !articleData.excerpt || !articleData.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug is taken by another article
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', articleData.slug)
      .neq('id', id)
      .single()

    if (existingArticle) {
      return NextResponse.json(
        { error: 'Slug already exists. Please choose a different slug.' },
        { status: 400 }
      )
    }

    // Update article
    const { data: article, error } = await supabase
      .from('articles')
      .update({
        title: articleData.title,
        slug: articleData.slug,
        excerpt: articleData.excerpt,
        content: articleData.content,
        featured_image_url: articleData.featured_image_url,
        cta_text: articleData.cta_text,
        status: articleData.status,
        publish_date: articleData.publish_date,
        reading_time_minutes: articleData.reading_time_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating article:', error)
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      )
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error in update article route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
