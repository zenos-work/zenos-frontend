/**
 * usePremiumFunnel Hook
 * Phase 3 (GAP-017): Premium funnel event instrumentation
 * Tracks conversion events for membership funnel analytics
 */
import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'

type FunnelEventType =
  | 'paywall_shown'
  | 'paywall_clicked'
  | 'signup_started'
  | 'signup_completed'
  | 'membership_upgraded'

interface FunnelEventData {
  event_type: FunnelEventType
  article_id?: string
  device_type?: 'mobile' | 'desktop' | 'tablet'
  referrer?: string
  ip_hash?: string
}

export function usePremiumFunnel(articleId?: string) {
  const { user } = useAuth()
  const failedEventsRef = useRef<FunnelEventData[]>([])

  // Detect device type
  const getDeviceType = useCallback((): 'mobile' | 'desktop' | 'tablet' => {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }, [])

  // Log premium funnel event
  const logEvent = useCallback(
    async (eventType: FunnelEventType, data?: Partial<FunnelEventData>) => {
      try {
        const eventData: FunnelEventData = {
          event_type: eventType,
          article_id: articleId,
          device_type: getDeviceType(),
          referrer: document.referrer || undefined,
          ...data,
        }

        const response = await fetch('/api/membership/funnel-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          console.warn(`Failed to log funnel event: ${eventType}`)
          failedEventsRef.current.push(eventData)
        }
      } catch (error) {
        console.error('Error logging premium funnel event:', error)
        failedEventsRef.current.push({
          event_type: eventType,
          article_id: articleId,
        })
      }
    },
    [articleId, getDeviceType]
  )

  // Log paywall shown when article loads
  useEffect(() => {
    if (articleId && !user) {
      logEvent('paywall_shown', { article_id: articleId }).catch(console.error)
    }
  }, [articleId, user, logEvent])

  // Retry failed events on reconnection
  const retryFailedEvents = useCallback(async () => {
    if (failedEventsRef.current.length === 0) return

    const failed = [...failedEventsRef.current]
    failedEventsRef.current = []

    for (const eventData of failed) {
      try {
        const response = await fetch('/api/membership/funnel-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          failedEventsRef.current.push(eventData)
        }
      } catch {
        failedEventsRef.current.push(eventData)
      }
    }
  }, [])

  // Retry failed events on online
  useEffect(() => {
    window.addEventListener('online', retryFailedEvents)
    return () => window.removeEventListener('online', retryFailedEvents)
  }, [retryFailedEvents])

  return { logEvent }
}
