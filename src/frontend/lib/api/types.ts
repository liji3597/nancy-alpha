// API Response Types - matching Insider-hunter backend

// ==================== Whale Trades ====================
export interface WhaleTrade {
  tx_hash: string
  market_slug: string
  maker: string
  side: 'BUY' | 'SELL'
  outcome: string
  price: number
  size: number
  amount_usd: number
  timestamp: string
}

export interface WhaleTradesResponse {
  total: number
  data: WhaleTrade[]
}

// ==================== Markets ====================
export interface MarketData {
  slug: string
  question: string
  condition_id?: string
  yes_token_id?: string
  no_token_id?: string
  category: string
  resolved: boolean
  resolution_outcome: string | null
  active: boolean
  created_at: string | null
}

export interface MarketsResponse {
  total: number
  data: MarketData[]
}

export interface MarketStats {
  trade_count: number
  total_volume: number
  whale_count: number
}

export interface MarketDetailResponse {
  slug: string
  question: string
  condition_id?: string
  yes_token_id?: string
  no_token_id?: string
  category: string
  resolved: boolean
  resolution_outcome: string | null
  active: boolean
  stats: MarketStats
  recent_trades: {
    tx_hash: string
    maker: string
    side: string
    outcome: string
    amount_usd: number
    timestamp: string
  }[]
}

// ==================== Traders ====================
export interface TraderLeaderboardEntry {
  address: string
  win_rate: number
  total_volume: number
  total_trades: number
  win_count: number
  loss_count: number
  avg_trade_size: number
  trader_type: 'smart_money' | 'dumb_money' | 'normal'
  label: string | null
  last_trade_at: string
}

export interface TraderLeaderboardResponse {
  data: TraderLeaderboardEntry[]
}

export interface TraderDetailResponse {
  address: string
  win_rate: number
  total_volume: number
  total_trades: number
  win_count: number
  loss_count: number
  trader_type: 'smart_money' | 'dumb_money' | 'normal'
  recent_trades: {
    tx_hash: string
    market_slug: string
    side: string
    outcome: string
    amount_usd: number
    timestamp: string
  }[]
  ai_profile?: {
    label: string
    trading_style: string
    risk_preference: string
    ai_analysis: string
  }
}

// ==================== AI Trader Profile ====================
export interface AITraderProfile {
  address: string
  win_rate: number
  total_volume: number
  total_trades: number
  trader_type: string
  label: string
  trading_style: string
  risk_preference: string
  ai_analysis: string
}

export interface AILeaderboardResponse {
  data: AITraderProfile[]
}

// ==================== Insider Alerts ====================
export interface InsiderAlert {
  id: number
  trade_id: number
  tx_hash: string
  market_slug: string
  maker: string
  amount_usd: number
  related_news: string
  time_diff_minutes: number
  is_suspect: boolean
  confidence: number
  reason: string
  created_at: string
}

export interface InsiderAlertsResponse {
  total: number
  data: InsiderAlert[]
}

// ==================== API Query Parameters ====================
export interface WhalesQueryParams {
  limit?: number
  offset?: number
  market_slug?: string
}

export interface MarketsQueryParams {
  limit?: number
  offset?: number
  active_only?: boolean
}

export interface LeaderboardQueryParams {
  limit?: number
  min_trades?: number
  trader_type?: 'smart_money' | 'dumb_money' | 'normal'
}

export interface InsiderAlertsQueryParams {
  suspect_only?: boolean
  limit?: number
  offset?: number
}
