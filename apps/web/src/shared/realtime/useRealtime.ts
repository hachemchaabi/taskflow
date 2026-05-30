import { useContext } from 'react'
import { RealtimeContext } from './RealtimeContext'

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within a RealtimeProvider')
  return ctx
}
