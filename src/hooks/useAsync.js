import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const counter = useRef(0)

  const run = useCallback(async (silent = false) => {
    const id = ++counter.current
    if (!silent) setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await loaderRef.current()
      if (id === counter.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (id === counter.current) setState({ data: null, error, loading: false })
    }
  }, [])

  useEffect(() => {
    run()
    return () => {
      counter.current += 1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const reload = useCallback(() => run(true), [run])
  return { ...state, reload, retry: () => run(false) }
}
