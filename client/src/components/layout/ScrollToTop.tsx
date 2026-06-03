import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router'

// ─── Scroll To Top ──────────────────────────────────────────────────────────────
// React Router's data router does not reset scroll on navigation, so following a
// footer link (or any link from mid/bottom of a page) lands the next page at the
// same offset. This resets the window to the top whenever the path changes.
//
// `selector` lets layouts with their own scroll container (e.g. AdminLayout's
// <main>) reset that element instead of the window.

interface ScrollToTopProps {
  selector?: string
}

export function ScrollToTop({ selector }: ScrollToTopProps) {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    if (selector) {
      const el = document.querySelector(selector)
      if (el) {
        el.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, selector])

  return null
}
