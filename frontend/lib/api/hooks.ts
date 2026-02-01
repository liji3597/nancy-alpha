'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from './client'
import type {
  WhaleTradesResponse,
  MarketsResponse,
  MarketDetailResponse,
  TraderLeaderboardResponse,
  TraderDetailResponse,
  AILeaderboardResponse,
  InsiderAlertsResponse,
  WhalesQueryParams,
  MarketsQueryParams,
  LeaderboardQueryParams,
  InsiderAlertsQueryParams,
} from './types'

// Generic hook state type
interface UseQueryState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// Generic fetch hook
function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
): UseQueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, deps)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

// ==================== Whale Trades Hooks ====================

export function useWhalesLive(params: WhalesQueryParams = {}) {
  return useQuery<WhaleTradesResponse>(
    () => api.getWhalesLive(params),
    [params.limit, params.offset, params.market_slug]
  )
}

// ==================== Markets Hooks ====================

export function useMarkets(params: MarketsQueryParams = {}) {
  return useQuery<MarketsResponse>(
    () => api.getMarkets(params),
    [params.limit, params.offset, params.active_only]
  )
}

export function useMarketDetail(slug: string) {
  return useQuery<MarketDetailResponse>(
    () => api.getMarketDetail(slug),
    [slug]
  )
}

// ==================== Traders Hooks ====================

export function useTradersLeaderboard(params: LeaderboardQueryParams = {}) {
  return useQuery<TraderLeaderboardResponse>(
    () => api.getTradersLeaderboard(params),
    [params.limit, params.min_trades, params.trader_type]
  )
}

export function useTraderDetail(address: string) {
  return useQuery<TraderDetailResponse>(
    () => api.getTraderDetail(address),
    [address]
  )
}

// ==================== AI Profile Hooks ====================

export function useAILeaderboard(params: LeaderboardQueryParams = {}) {
  return useQuery<AILeaderboardResponse>(
    () => api.getAILeaderboard(params),
    [params.limit, params.trader_type]
  )
}

// Hook to analyze a single trader with AI
export function useTraderAIAnalysis(address: string | null, enabled = true) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!address || !enabled) return

    let isMounted = true
    setIsLoading(true)

    api.analyzeTraderAI(address, false)
      .then((result) => {
        if (isMounted) {
          setData(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('AI analysis failed'))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => { isMounted = false }
  }, [address, enabled])

  return { data, isLoading, error }
}

// Hook to batch analyze multiple traders
export function useBatchAIAnalysis(addresses: string[], enabled = true) {
  const [analyses, setAnalyses] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || addresses.length === 0) return

    let isMounted = true
    setIsLoading(true)

    // Analyze each address (with rate limiting)
    const analyzeAll = async () => {
      const results: Record<string, any> = {}

      for (const address of addresses.slice(0, 5)) { // Limit to 5 to avoid API overload
        try {
          const result = await api.analyzeTraderAI(address, false)
          if (isMounted) {
            results[address] = result
            setAnalyses(prev => ({ ...prev, [address]: result }))
          }
        } catch (err) {
          console.error(`AI analysis failed for ${address}:`, err)
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (isMounted) {
        setIsLoading(false)
      }
    }

    analyzeAll()
    return () => { isMounted = false }
  }, [addresses.join(','), enabled])

  return { analyses, isLoading }
}

// ==================== Insider Alerts Hooks ====================

export function useInsiderAlerts(params: InsiderAlertsQueryParams = {}) {
  return useQuery<InsiderAlertsResponse>(
    () => api.getInsiderAlerts(params),
    [params.suspect_only, params.limit, params.offset]
  )
}

// ==================== Polling Hook for Real-time Data ====================

export function usePollingWhales(params: WhalesQueryParams = {}, intervalMs = 10000) {
  const [data, setData] = useState<WhaleTradesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const result = await api.getWhalesLive(params)
        if (isMounted) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    const interval = setInterval(fetchData, intervalMs)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [params.limit, params.offset, params.market_slug, intervalMs])

  return { data, isLoading, error }
}

// ==================== Health Check Hook ====================

export function useHealthCheck() {
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.healthCheck()
        setIsConnected(true)
      } catch {
        setIsConnected(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return { isConnected, isChecking }
}
