'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LikeButtonProps {
  articleId: string
  initialLikes: number
  isDarkMode: boolean
}

const MAX_LIKES_PER_ARTICLE = 50

export function LikeButton({ articleId, initialLikes, isDarkMode }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [userLikes, setUserLikes] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load user's like count from localStorage on mount
  useEffect(() => {
    const storageKey = `article_likes_${articleId}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setUserLikes(parseInt(stored, 10))
    }
  }, [articleId])

  const handleLike = async () => {
    if (userLikes >= MAX_LIKES_PER_ARTICLE || isLoading) {
      return
    }

    setIsLoading(true)
    setIsAnimating(true)

    try {
      // Call API to increment like count
      const response = await fetch(`/api/articles/${articleId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes)

        // Update localStorage
        const newUserLikes = userLikes + 1
        setUserLikes(newUserLikes)
        const storageKey = `article_likes_${articleId}`
        localStorage.setItem(storageKey, newUserLikes.toString())
      }
    } catch (error) {
      console.error('Error liking article:', error)
    } finally {
      setIsLoading(false)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const remainingLikes = MAX_LIKES_PER_ARTICLE - userLikes
  const isMaxed = userLikes >= MAX_LIKES_PER_ARTICLE

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleLike}
        disabled={isMaxed || isLoading}
        variant="outline"
        className={`
          ${isDarkMode
            ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
            : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
          }
          ${isMaxed ? 'opacity-50 cursor-not-allowed' : ''}
          rounded-xl px-6 py-3 transition-all duration-200
          ${isAnimating ? 'scale-110' : ''}
        `}
        title={isMaxed ? "You've used all your likes" : `${remainingLikes} likes remaining`}
      >
        <Heart className={`w-5 h-5 mr-2 ${isAnimating ? 'fill-current text-red-500' : ''}`} />
        <span className="text-base font-medium">{likes} Likes</span>
      </Button>

      {!isMaxed && (
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {remainingLikes} left
        </span>
      )}
      {isMaxed && (
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Max likes reached
        </span>
      )}
    </div>
  )
}
