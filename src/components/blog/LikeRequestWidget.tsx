'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

interface LikeRequestWidgetProps {
  articleId: string
  initialLikes: number
  isDarkMode: boolean
}

const MAX_LIKES_PER_ARTICLE = 50

export function LikeRequestWidget({ articleId, initialLikes, isDarkMode }: LikeRequestWidgetProps) {
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
      const response = await fetch(`/api/articles/${articleId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes)

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
  const hasLiked = userLikes > 0

  return (
    <div className="text-center py-8">
      <p className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Enjoyed this article?
      </p>
      <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        A quick like helps others discover it too.
      </p>

      <button
        onClick={handleLike}
        disabled={isMaxed || isLoading}
        className={`
          px-8 py-3 rounded-xl font-medium shadow-lg
          transition-all duration-200
          ${isAnimating ? 'scale-105' : 'hover:scale-105'}
          ${isMaxed
            ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
            : isDarkMode
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-indigo-500/25'
              : 'bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-rose-500/25'
          }
        `}
      >
        <Heart
          className={`w-5 h-5 inline mr-2 ${isAnimating ? 'scale-125' : ''} transition-transform`}
          fill={hasLiked ? 'currentColor' : 'none'}
        />
        {likes} {likes === 1 ? 'like' : 'likes'}
      </button>

      {!isMaxed && userLikes > 0 && (
        <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {remainingLikes} likes remaining
        </p>
      )}
      {isMaxed && (
        <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Thanks for all the love!
        </p>
      )}
    </div>
  )
}
