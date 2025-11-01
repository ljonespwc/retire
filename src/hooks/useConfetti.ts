/**
 * useConfetti Hook
 *
 * Manages celebratory confetti effect with continuous animation.
 * Automatically cleans up on component unmount.
 */

import { useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {
  const confettiIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startConfetti = () => {
    // Clear any existing confetti
    stopConfetti()

    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    // Start continuous confetti until stopped
    confettiIntervalRef.current = setInterval(function() {
      const particleCount = 50

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#fb923c', '#fbbf24', '#10b981', '#06b6d4']
      })

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#fb923c', '#fbbf24', '#10b981', '#06b6d4']
      })
    }, 250)
  }

  const stopConfetti = () => {
    if (confettiIntervalRef.current) {
      clearInterval(confettiIntervalRef.current)
      confettiIntervalRef.current = null
    }
  }

  // Cleanup confetti on unmount
  useEffect(() => {
    return () => stopConfetti()
  }, [])

  return { startConfetti, stopConfetti }
}
