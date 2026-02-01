// API Client for Insider-hunter backend

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

// API Base URL - configure via environment variable
// Note: Next.js requires restart after changing .env.local
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Debug log for API URL
if (typeof window !== 'undefined') {
  console.log('[API] Base URL:', API_BASE_URL)
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// ==================== Whale Trades API ====================

export async function getWhalesLive(params: WhalesQueryParams = {}): Promise<WhaleTradesResponse> {
  const query = buildQueryString(params)
  return fetchApi<WhaleTradesResponse>(`/api/whales/live${query}`)
}

// ==================== Markets API ====================

export async function getMarkets(params: MarketsQueryParams = {}): Promise<MarketsResponse> {
  const query = buildQueryString(params)
  return fetchApi<MarketsResponse>(`/api/markets${query}`)
}

export async function getMarketDetail(slug: string): Promise<MarketDetailResponse> {
  return fetchApi<MarketDetailResponse>(`/api/market/${slug}`)
}

// ==================== Traders API ====================

export async function getTradersLeaderboard(params: LeaderboardQueryParams = {}): Promise<TraderLeaderboardResponse> {
  const query = buildQueryString(params)
  return fetchApi<TraderLeaderboardResponse>(`/api/traders/leaderboard${query}`)
}

export async function getTraderDetail(address: string): Promise<TraderDetailResponse> {
  return fetchApi<TraderDetailResponse>(`/api/trader/${address}`)
}

// ==================== AI Trader Profile API ====================

export async function getAILeaderboard(params: LeaderboardQueryParams = {}): Promise<AILeaderboardResponse> {
  const query = buildQueryString(params)
  return fetchApi<AILeaderboardResponse>(`/api/traders/ai-leaderboard${query}`)
}

export async function analyzeTraderAI(address: string, forceRefresh = false): Promise<any> {
  const query = buildQueryString({ force_refresh: forceRefresh })
  return fetchApi(`/api/traders/${address}/ai-analyze${query}`, { method: 'POST' })
}

export async function batchAnalyzeTraders(params: { limit?: number; min_trades?: number; force_refresh?: boolean } = {}): Promise<any> {
  const query = buildQueryString(params)
  return fetchApi(`/api/traders/batch-ai-analyze${query}`, { method: 'POST' })
}

// ==================== Insider Analysis API ====================

export async function getInsiderAlerts(params: InsiderAlertsQueryParams = {}): Promise<InsiderAlertsResponse> {
  const query = buildQueryString(params)
  return fetchApi<InsiderAlertsResponse>(`/api/insider/alerts${query}`)
}

export async function triggerInsiderAnalysis(limit = 5): Promise<any> {
  const query = buildQueryString({ limit })
  return fetchApi(`/api/insider/analyze${query}`, { method: 'POST' })
}

// ==================== Health Check ====================

export async function healthCheck(): Promise<{ status: string; service: string }> {
  return fetchApi('/api/health')
}

// Export all API functions
export const api = {
  // Whales
  getWhalesLive,

  // Markets
  getMarkets,
  getMarketDetail,

  // Traders
  getTradersLeaderboard,
  getTraderDetail,

  // AI Profile
  getAILeaderboard,
  analyzeTraderAI,
  batchAnalyzeTraders,

  // Insider
  getInsiderAlerts,
  triggerInsiderAnalysis,

  // System
  healthCheck,
}

export default api
