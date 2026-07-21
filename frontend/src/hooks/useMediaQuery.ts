import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** ≤1024px — sidebar becomes an off-canvas drawer, detail-page grids stack. */
export function useIsTablet() {
  return useMediaQuery('(max-width: 1024px)')
}

/** ≤640px — form grids collapse to a single column, denser paddings. */
export function useIsMobile() {
  return useMediaQuery('(max-width: 640px)')
}
