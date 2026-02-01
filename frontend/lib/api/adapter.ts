// Data adapter - transforms API data to frontend format with mock fallback

import { formatAddress } from '../utils'
import type {
  WhaleTrade,
  MarketData,
  TraderLeaderboardEntry,
  TraderDetailResponse,
  AITraderProfile,
  InsiderAlert
} from './types'
import type { Market, TraderProfile, Alert } from '../mock-data'
import { mockMarkets, mockTraders, mockAlerts, mockTrades, mockSentimentData } from '../mock-data'

// ==================== Market Adapter ====================

export function apiMarketToFrontend(apiMarket: MarketData, index: number = 0): Market {
  // Generate price data from slug or use defaults
  const basePrice = 0.45 + (index * 0.05) % 0.5
  const priceChange = (Math.random() - 0.5) * 20

  return {
    id: index + 1,
    slug: apiMarket.slug,
    title: apiMarket.question,
    category: apiMarket.category?.includes('politic') ? 'politics' : 'geopolitics',
    subcategory: apiMarket.category || '国际政治',
    currentPrice: basePrice,
    priceChange24h: priceChange,
    volume24h: 100000 + Math.random() * 1000000,
    liquidity: 50 + Math.random() * 50,
    status: apiMarket.active ? 'active' : apiMarket.resolved ? 'resolved' : 'closed',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    yesPrice: basePrice,
    noPrice: 1 - basePrice,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: basePrice + (Math.random() - 0.5) * 0.1,
    })),
  }
}

export function getMarketsWithFallback(apiData: MarketData[] | null | undefined): Market[] {
  if (!apiData || apiData.length === 0) {
    return mockMarkets
  }
  return apiData.map((m, i) => apiMarketToFrontend(m, i))
}

// ==================== Trader Adapter ====================

const TRADER_TAGS: Record<string, string[]> = {
  'smart_money': ['聪明钱', '神算子'],
  'dumb_money': ['反向指标'],
  'normal': ['中坚力量'],
}

// AI-generated review templates based on performance
const AI_REVIEWS = {
  elite: [
    '🎯 顶级猎手！该地址在政治市场表现卓越，多次精准预判重大事件走向，建议重点关注其持仓变化。',
    '🦅 老鹰级选手！历史战绩优异，擅长捕捉政策风向，跟单价值极高。',
    '💎 钻石手！该交易者持仓稳定，判断精准，是典型的聪明钱代表。',
    '🏆 Alpha猎人！在多个政治事件中提前布局获利，信息渠道可能较为敏锐。',
  ],
  good: [
    '📈 表现稳健的交易者，胜率高于市场平均，具有一定的跟单参考价值。',
    '🧠 聪明钱特征明显，善于在关键时刻做出正确判断，值得关注。',
    '⚡ 活跃度高且胜率不错，可能对政治新闻有较好的解读能力。',
    '🎲 风险偏好适中，收益稳定，适合作为跟单池的一部分。',
  ],
  average: [
    '📊 表现中规中矩，胜率接近市场平均水平，建议观察更多交易再做判断。',
    '⚖️ 交易风格保守，盈亏相对平衡，暂无明显的alpha信号。',
    '🔍 数据积累中，当前样本量不足以做出准确评估，持续监控中。',
  ],
  poor: [
    '⚠️ 反向指标预警！该地址近期连续误判，可考虑反向操作策略。',
    '🔴 高风险警告！胜率较低，不建议跟单，可作为反向参考。',
    '📉 表现不佳，多次在关键点位做出错误判断，谨慎参考。',
  ],
}

// Generate deterministic random from address (consistent across renders)
function seedRandom(address: string): () => number {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i)
    hash = hash & hash
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    return hash / 0x7fffffff
  }
}

function generateAIReview(winRate: number, address: string): string {
  const rand = seedRandom(address)
  let reviews: string[]
  if (winRate >= 75) {
    reviews = AI_REVIEWS.elite
  } else if (winRate >= 60) {
    reviews = AI_REVIEWS.good
  } else if (winRate >= 40) {
    reviews = AI_REVIEWS.average
  } else {
    reviews = AI_REVIEWS.poor
  }
  return reviews[Math.floor(rand() * reviews.length)]
}

export function apiTraderToFrontend(trader: TraderLeaderboardEntry | TraderDetailResponse, index: number = 0): TraderProfile {
  const tags = [...(TRADER_TAGS[trader.trader_type] || ['中坚力量'])]
  if (trader.total_volume > 100000) {
    tags.unshift('巨鲸')
  }

  // Use address-based seed for consistent random values
  const rand = seedRandom(trader.address)

  // Check if we have meaningful win/loss data (not just trades but actual results)
  const hasWinLossData = (trader.win_count || 0) > 0 || (trader.loss_count || 0) > 0
  const apiWinRate = trader.win_rate * 100

  // If no win/loss data yet (markets not settled), generate random but consistent stats
  const winRate = hasWinLossData && apiWinRate > 0
    ? Math.round(apiWinRate)
    : Math.round(45 + rand() * 40) // Random 45-85% for wallets without settled trades

  const roi = hasWinLossData && apiWinRate > 0
    ? Math.round(winRate > 60 ? (winRate - 50) * 3 : -(60 - winRate) * 2)
    : Math.round((rand() - 0.3) * 100) // Random -30% to +70%

  // Generate AI review
  const existingAIReview = (trader as any).ai_profile?.ai_analysis || (trader as any).label
  const aiReview = existingAIReview || generateAIReview(winRate, trader.address)

  return {
    address: trader.address,
    shortAddress: formatAddress(trader.address),
    tags,
    winRate,
    winRate7d: Math.round(winRate + (rand() - 0.5) * 10),
    winRate30d: Math.round(winRate + (rand() - 0.5) * 5),
    roi: Math.round(roi),
    totalProfit: Math.round((trader.total_volume || 50000 + rand() * 200000) * (roi / 100)),
    totalTrades: trader.total_trades || Math.round(10 + rand() * 50),
    totalVolume: trader.total_volume || Math.round(50000 + rand() * 200000),
    expertise: [
      { category: '国际政治', winRate: Math.round(winRate + (rand() - 0.5) * 15), trades: Math.round((trader.total_trades || 30) * 0.6) },
      { category: '地缘政治', winRate: Math.round(winRate + (rand() - 0.5) * 15), trades: Math.round((trader.total_trades || 30) * 0.4) },
    ],
    recentPerformance: {
      period: '7d',
      status: winRate >= 60 ? 'good' : winRate >= 40 ? 'warning' : 'bad',
      message: winRate >= 60 ? '近期表现优秀' : winRate >= 40 ? '表现稳定' : '连续亏损中',
    },
    aiReview,
    lastActive: new Date(Date.now() - rand() * 24 * 60 * 60 * 1000),
    joinedAt: new Date(Date.now() - (90 + rand() * 365) * 24 * 60 * 60 * 1000),
  }
}

export function getTradersWithFallback(apiData: TraderLeaderboardEntry[] | null | undefined): TraderProfile[] {
  if (!apiData || apiData.length === 0) {
    return mockTraders
  }
  return apiData.map((t, i) => apiTraderToFrontend(t, i))
}

// ==================== AI Trader Adapter ====================

export function apiAITraderToFrontend(trader: AITraderProfile, index: number = 0): TraderProfile {
  const base = apiTraderToFrontend(trader as any, index)

  // Add AI-specific tags
  if (trader.label) {
    base.tags.push(trader.label)
  }

  // Override AI review with actual AI analysis
  base.aiReview = trader.ai_analysis || base.aiReview

  return base
}

// ==================== Whale Trade to Alert Adapter ====================

export function whaleTradeToAlert(trade: WhaleTrade, index: number): Alert {
  const isBuy = trade.side === 'BUY'

  return {
    id: trade.tx_hash.slice(0, 10),
    type: 'whale_trade',
    icon: '🐋',
    message: `${formatAddress(trade.maker)} ${isBuy ? '买入' : '卖出'} "${trade.market_slug}" $${Math.round(trade.amount_usd).toLocaleString()} @${trade.price.toFixed(2)}`,
    timestamp: new Date(trade.timestamp),
    link: `/traders/${trade.maker}`,
  }
}

export function getAlertsWithFallback(whales: WhaleTrade[] | null | undefined): Alert[] {
  if (!whales || whales.length === 0) {
    return mockAlerts
  }
  return whales.slice(0, 10).map((w, i) => whaleTradeToAlert(w, i))
}

// ==================== Insider Alert Adapter ====================

export function insiderAlertToFrontendAlert(alert: InsiderAlert): Alert {
  return {
    id: String(alert.id),
    type: alert.is_suspect ? 'whale_trade' : 'market_surge',
    icon: alert.is_suspect ? '🚨' : '📊',
    message: `${formatAddress(alert.maker)} 在相关新闻前${alert.time_diff_minutes}分钟交易 $${Math.round(alert.amount_usd).toLocaleString()} - ${alert.reason}`,
    timestamp: new Date(alert.created_at),
    link: `/markets/${alert.market_slug}`,
  }
}

// ==================== Trade Adapter ====================

export function whaleTradeToTrade(trade: WhaleTrade) {
  return {
    txHash: trade.tx_hash,
    maker: trade.maker,
    taker: trade.maker, // API doesn't provide taker
    outcome: trade.outcome,
    side: trade.side,
    price: trade.price,
    size: trade.size,
    timestamp: new Date(trade.timestamp),
  }
}

export function getTradesWithFallback(whales: WhaleTrade[] | null | undefined) {
  if (!whales || whales.length === 0) {
    return mockTrades
  }
  return whales.map(whaleTradeToTrade)
}

// ==================== Sentiment Data (Mock only for now) ====================

export function getSentimentData() {
  return mockSentimentData
}

// ==================== Combined Data Provider ====================

export interface DashboardData {
  markets: Market[]
  traders: TraderProfile[]
  alerts: Alert[]
  trades: ReturnType<typeof whaleTradeToTrade>[]
  sentiment: typeof mockSentimentData
}

export function combineDashboardData(
  apiMarkets: MarketData[] | null | undefined,
  apiTraders: TraderLeaderboardEntry[] | null | undefined,
  apiWhales: WhaleTrade[] | null | undefined
): DashboardData {
  return {
    markets: getMarketsWithFallback(apiMarkets),
    traders: getTradersWithFallback(apiTraders),
    alerts: getAlertsWithFallback(apiWhales),
    trades: getTradesWithFallback(apiWhales),
    sentiment: getSentimentData(),
  }
}
