import { useContext, useEffect } from 'react'
import { BreadcrumbLabelContext } from '../components/BreadcrumbLabelContext'

function useBreadcrumbLabelContext() {
  const ctx = useContext(BreadcrumbLabelContext)
  if (!ctx) {
    throw new Error('useBreadcrumbLabel must be used within a BreadcrumbLabelProvider')
  }
  return ctx
}

export function useBreadcrumbLabels() {
  return useBreadcrumbLabelContext().labels
}

export function useSetBreadcrumbLabel(key: string, label: string | undefined) {
  const { setLabel, markPending, clearLabel } = useBreadcrumbLabelContext()

  useEffect(() => {
    if (!key) return
    markPending(key)
    return () => clearLabel(key)
  }, [key, markPending, clearLabel])

  useEffect(() => {
    if (!key || !label) return
    setLabel(key, label)
  }, [key, label, setLabel])
}
