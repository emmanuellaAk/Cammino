import { useEffect, useRef, useState, type ComponentType } from 'react'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

/** Compiles MDX source to a renderable component at runtime, debounced.
 * Keeps the last successfully-compiled component on screen while a newer
 * (possibly transiently invalid, mid-edit) source is recompiling, instead of
 * blanking the preview on every keystroke. */
export function useMdxPreview(source: string, debounceMs = 400) {
  const [Content, setContent] = useState<ComponentType<{ components?: Record<string, unknown> }> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(true)
  const latestSource = useRef(source)
  latestSource.current = source

  useEffect(() => {
    setCompiling(true)
    const timer = setTimeout(async () => {
      const src = latestSource.current
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { default: Compiled } = await evaluate(src, runtime as any)
        setContent(() => Compiled as ComponentType<{ components?: Record<string, unknown> }>)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to render preview')
      } finally {
        setCompiling(false)
      }
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [source, debounceMs])

  return { Content, error, compiling }
}
