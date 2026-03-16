'use client'
import { useEffect } from 'react'
import { toast } from '@/components/ui/Toast'

export function NetworkStatusProvider() {
  useEffect(() => {
    const handleOffline = () => toast.error('You\'re offline — music may stop')
    const handleOnline = () => toast.success('Back online')
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])
  return null
}
