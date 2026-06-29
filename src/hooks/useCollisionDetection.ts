'use client'

import { useEffect, useRef } from 'react'

/**
 * A hook to detect if an absolutely positioned element overflows the viewport boundaries
 * and adaptively adjust its horizontal and vertical position.
 */
export function useCollisionDetection(isOpen: boolean, padding = 16) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const adjustPosition = () => {
      const el = ref.current
      if (!el) return

      // Reset style constraints first
      el.style.left = ''
      el.style.right = ''
      el.style.top = ''
      el.style.bottom = ''
      el.style.maxHeight = ''

      // Allow browser to calculate natural dimensions
      let rect = el.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // 1. Horizontal adjustments
      if (rect.left < padding) {
        const offset = padding - rect.left
        el.style.left = `${el.offsetLeft + offset}px`
        el.style.right = 'auto'
      } else if (rect.right > viewportWidth - padding) {
        const offset = rect.right - (viewportWidth - padding)
        el.style.left = `${el.offsetLeft - offset}px`
        el.style.right = 'auto'
      }

      // Re-read rect after horizontal shifts
      rect = el.getBoundingClientRect()

      // 2. Vertical adjustments (if it overflows the bottom of the screen)
      if (rect.bottom > viewportHeight - padding) {
        const spaceAbove = rect.top
        const spaceBelow = viewportHeight - rect.bottom
        
        // If there's more space above than below, position the menu above the trigger
        if (spaceAbove > spaceBelow && rect.height > spaceBelow) {
          // Flip upwards: trigger height is roughly the parent's height, but we can set bottom: 100%
          el.style.bottom = '100%'
          el.style.top = 'auto'
          
          // Re-verify if it now overflows the top of the screen
          const newRect = el.getBoundingClientRect()
          if (newRect.top < padding) {
            el.style.top = `${padding}px`
            el.style.bottom = 'auto'
            el.style.maxHeight = `${viewportHeight - padding * 2}px`
          }
        } else {
          // Keep it below but restrict height
          el.style.maxHeight = `${viewportHeight - rect.top - padding}px`
        }
      }
    }

    // Run positioning logic on mount and window resize
    const timer = setTimeout(adjustPosition, 50)
    window.addEventListener('resize', adjustPosition)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', adjustPosition)
    }
  }, [isOpen, padding])

  return ref
}
