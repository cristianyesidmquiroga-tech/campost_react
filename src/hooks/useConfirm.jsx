import { useCallback, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ui'

export function useConfirm() {
  const [options, setOptions] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    (config) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setOptions(config)
      }),
    [],
  )

  const dialog = options && (
    <ConfirmDialog
      {...options}
      onResult={(result) => {
        setOptions(null)
        resolver.current?.(result)
      }}
    />
  )
  return [confirm, dialog]
}
