import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params
    const supabase = await createClient()

    // Check if article exists
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('id', articleId)
      .eq('status', 'published')
      .single()

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Get or create article_likes record
    const { data: existingLikes, error: fetchError } = await supabase
      .from('article_likes')
      .select('like_count')
      .eq('article_id', articleId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (first like)
      console.error('Error fetching likes:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      )
    }

    let newLikeCount = 1

    if (existingLikes) {
      // Increment existing likes
      newLikeCount = existingLikes.like_count + 1
      const { error: updateError } = await supabase
        .from('article_likes')
        .update({ like_count: newLikeCount })
        .eq('article_id', articleId)

      if (updateError) {
        console.error('Error updating likes:', updateError)
        return NextResponse.json(
          { error: 'Failed to update likes' },
          { status: 500 }
        )
      }
    } else {
      // Create first like record
      const { error: insertError } = await supabase
        .from('article_likes')
        .insert({ article_id: articleId, like_count: 1 })

      if (insertError) {
        console.error('Error inserting likes:', insertError)
        return NextResponse.json(
          { error: 'Failed to create like record' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ likes: newLikeCount })
  } catch (error) {
    console.error('Error in like route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
