'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { generateSlug } from '@/lib/blog/slug'
import { calculateReadingTime } from '@/lib/blog/reading-time'
import { ArticleFormData } from '@/types/blog'
import ReactMarkdown from 'react-markdown'
import { Save, Eye, EyeOff, Upload, X } from 'lucide-react'

interface ArticleFormProps {
  initialData?: Partial<ArticleFormData>
  articleId?: string
  mode: 'create' | 'edit'
}

export function ArticleForm({ initialData, articleId, mode }: ArticleFormProps) {
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form fields
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [ctaText, setCtaText] = useState(initialData?.cta_text || '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialData?.featured_image_url || '')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(initialData?.status || 'draft')
  const [publishDate, setPublishDate] = useState(
    initialData?.publish_date
      ? new Date(initialData.publish_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )

  // Auto-generate slug from title
  useEffect(() => {
    if (mode === 'create' && title && !slug) {
      setSlug(generateSlug(title))
    }
  }, [title, mode, slug])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/articles/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFeaturedImageUrl(data.url)
      } else {
        alert('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!title || !slug || !excerpt || !content) {
      alert('Please fill in all required fields (title, slug, excerpt, content)')
      return
    }

    setIsSaving(true)
    try {
      const readingTime = calculateReadingTime(content)

      const articleData: ArticleFormData = {
        title,
        slug,
        excerpt,
        content,
        featured_image_url: featuredImageUrl || null,
        cta_text: ctaText || null,
        status,
        publish_date: new Date(publishDate).toISOString(),
        reading_time_minutes: readingTime,
      }

      const url = mode === 'create'
        ? '/api/admin/articles'
        : `/api/admin/articles/${articleId}`

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      })

      if (response.ok) {
        router.push('/admin/articles')
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save article')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title" className="text-white text-sm font-medium mb-2 block">
            Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="slug" className="text-white text-sm font-medium mb-2 block">
            Slug *
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="article-url-slug"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <Label htmlFor="excerpt" className="text-white text-sm font-medium mb-2 block">
          Excerpt * <span className="text-gray-400 font-normal">({excerpt.length}/200 characters)</span>
        </Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary for article cards (150-200 characters)"
          maxLength={200}
          rows={2}
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      {/* CTA Heading */}
      <div>
        <Label htmlFor="ctaText" className="text-white text-sm font-medium mb-2 block">
          CTA Heading <span className="text-gray-400 font-normal">(optional, defaults to "Can You Retire When You Want?")</span>
        </Label>
        <Input
          id="ctaText"
          value={ctaText}
          onChange={(e) => setCtaText(e.target.value)}
          placeholder="Can You Retire When You Want?"
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      {/* Featured Image */}
      <div>
        <Label htmlFor="image" className="text-white text-sm font-medium mb-2 block">
          Featured Image <span className="text-gray-400 font-normal">(1200×630px recommended, JPG/PNG/WebP)</span>
        </Label>
        {featuredImageUrl ? (
          <div className="relative">
            <img src={featuredImageUrl} alt="Featured" className="w-full max-w-md h-auto rounded-xl mb-2" />
            <Button
              onClick={() => setFeaturedImageUrl('')}
              variant="outline"
              size="sm"
              className="border-red-700 text-red-400 hover:bg-red-900/30 rounded-lg"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label htmlFor="image">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                className="border-gray-600 bg-gray-700 text-white hover:bg-gray-600 rounded-lg cursor-pointer"
                onClick={() => document.getElementById('image')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </label>
          </div>
        )}
      </div>

      {/* Content (Markdown) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="content" className="text-white text-sm font-medium">
            Content (Markdown) *
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="border-gray-600 bg-gray-700 text-white hover:bg-gray-600 rounded-lg"
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>

        {showPreview ? (
          <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 prose prose-lg max-w-none
            [&>p:first-of-type]:text-xl [&>p:first-of-type]:leading-relaxed [&>p:first-of-type]:font-medium
            [&_h1]:font-bold [&_h1]:text-4xl [&_h1]:mt-12 [&_h1]:mb-6
            [&_h2]:font-bold [&_h2]:text-3xl [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pt-8 [&_h2]:border-t
            [&_h3]:font-bold [&_h3]:text-2xl [&_h3]:mt-6 [&_h3]:mb-3
            [&_p]:leading-relaxed [&_p]:mb-6
            [&_strong]:font-bold
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6
            [&_li]:mb-2
            [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic
            [&_code]:px-2 [&_code]:py-1 [&_code]:rounded
            [&_img]:w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-8
            [&>p:first-of-type]:text-gray-100 [&_h1]:text-gray-100 [&_h2]:text-gray-100 [&_h2]:border-blue-500/30 [&_h3]:text-gray-100 [&_p]:text-gray-200 [&_li]:text-gray-200 [&_strong]:text-orange-400 [&_a]:text-blue-400 hover:[&_a]:text-blue-300 [&_blockquote]:border-blue-700 [&_blockquote]:text-gray-300 [&_code]:bg-gray-900 [&_code]:text-gray-200
          ">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article in markdown..."
            rows={20}
            className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
          />
        )}
      </div>

      {/* Status & Publish Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="status" className="text-white text-sm font-medium mb-2 block">
            Status
          </Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <Label htmlFor="publishDate" className="text-white text-sm font-medium mb-2 block">
            Publish Date
          </Label>
          <Input
            id="publishDate"
            type="datetime-local"
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-6 border-t border-gray-700">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : mode === 'create' ? 'Create Article' : 'Save Changes'}
        </Button>
        <Button
          onClick={() => router.push('/admin/articles')}
          variant="outline"
          className="border-gray-600 text-gray-400 hover:bg-gray-700 rounded-xl px-6 py-3"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
