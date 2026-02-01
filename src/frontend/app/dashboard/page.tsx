'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn, formatNumber, formatTimeAgo, getTagEmoji } from '@/lib/utils'
import { TrendingUp, Users, Zap, AlertTriangle, Copy, Eye, Wifi, WifiOff } from 'lucide-react'
import {
  useMarkets,
  useTradersLeaderboard,
  usePollingWhales,
  useHealthCheck,
  useBatchAIAnalysis,
  getMarketsWithFallback,
  getTradersWithFallback,
  getAlertsWithFallback,
  getSentimentData,
} from '@/lib/api'
import type { Market, TraderProfile } from '@/lib/mock-data'

// Whale Avatar Component
function WhaleAvatar({ type, size = 'md' }: { type: 'pelosi' | 'trump' | 'pepe' | 'default', size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' }
  const avatars = {
    pelosi: { emoji: '👵', bg: 'from-neon-green/80 to-neon-cyan/80' },
    trump: { emoji: '🍊', bg: 'from-neon-orange/80 to-yellow-500/80' },
    pepe: { emoji: '🐸', bg: 'from-green-600/80 to-neon-green/80' },
    default: { emoji: '🐋', bg: 'from-neon-cyan/80 to-neon-purple/80' }
  }
  const avatar = avatars[type]
  return (
    <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center whale-bounce", avatar.bg, sizes[size])}>
      <span>{avatar.emoji}</span>
    </div>
  )
}

// 碎纸机 Loading
function ShredderLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-14 h-10 bg-cyber-gray border border-cyber-border rounded-t-lg flex items-center justify-center">
          <span className="text-xl">🗑️</span>
        </div>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 shredder-loading">
          <div className="w-6 h-8 bg-neon-red/20 border border-neon-red/30 rounded text-center text-xs pt-0.5">📄</div>
        </div>
        <div className="flex gap-0.5 mt-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 h-6 bg-gradient-to-b from-cyber-border to-transparent rounded-b animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
      <p className="mt-6 text-xs font-mono text-neon-cyan cia-typing">Shredding classified documents</p>
    </div>
  )
}

// API Connection Status
function ConnectionStatus({ isConnected, isChecking }: { isConnected: boolean, isChecking: boolean }) {
  if (isChecking) return null

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono",
      isConnected ? "bg-neon-green/10 text-neon-green" : "bg-neon-orange/10 text-neon-orange"
    )}>
      {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {isConnected ? "API Connected" : "Using Cache"}
    </div>
  )
}

// Alert Feed with real data
function AlertFeed({ alerts }: { alerts: { id: string, icon: string, message: string, link: string, timestamp: Date }[] }) {
  return (
    <div className="w-full overflow-hidden cyber-card py-2.5 relative">
      <div className="animate-marquee flex gap-10 whitespace-nowrap px-4">
        {alerts.map((alert) => (
          <Link key={alert.id} href={alert.link} className="flex items-center gap-2.5 hover:text-neon-cyan transition-smooth-fast group">
            <span className="text-lg whale-bounce">{alert.icon}</span>
            <span className="text-xs font-medium text-dim-white group-hover:text-neon-cyan">{alert.message}</span>
            <span className="text-[10px] text-dim-gray font-mono" suppressHydrationWarning>{formatTimeAgo(alert.timestamp)}</span>
            <span className="cyber-tag-green text-[10px] py-0.5">NEW</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Hot Markets with real data
function HotMarkets({ markets }: { markets: Market[] }) {
  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-neon-cyan" />
          <span className="gradient-text">热门 Alpha</span>
        </h3>
        <span className="cyber-tag-cyan text-[10px]">// Leak Alpha</span>
      </div>

      <div className="space-y-2">
        {markets.slice(0, 4).map((market, index) => (
          <Link key={market.id} href={`/markets/${market.slug}`}
            className="block rounded-lg bg-cyber-darker/60 p-3 hover:bg-cyber-gray border border-transparent hover:border-neon-cyan/30 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neon-cyan">#{index + 1}</span>
                  <span className="text-sm font-medium text-dim-white group-hover:text-neon-cyan line-clamp-1">{market.title}</span>
                </div>
                <div className="mt-1">
                  <span className="cyber-tag-cyan text-[10px] py-0.5">{market.subcategory}</span>
                </div>
              </div>
              <div className="text-right ml-3">
                <div className="text-base font-bold font-mono text-foreground">${market.currentPrice.toFixed(2)}</div>
                <div className={cn("text-xs font-mono", market.priceChange24h > 0 ? "text-neon-green" : "text-neon-red")}>
                  {market.priceChange24h > 0 ? "↑" : "↓"} {Math.abs(market.priceChange24h).toFixed(1)}%
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link href="/markets" className="mt-4 flex items-center justify-center gap-2 text-xs text-neon-cyan hover:text-neon-green font-mono py-2 transition-smooth">
        <Eye className="w-3.5 h-3.5" />
        <span>Leak More Alpha →</span>
      </Link>
    </div>
  )
}

// Top Smart Money with real data and AI profile
function TopSmartMoney({ traders }: { traders: TraderProfile[] }) {
  const smartMoneyTraders = traders.filter((t) => t.tags.includes('聪明钱')).sort((a, b) => b.winRate - a.winRate).slice(0, 5)
  // Fallback: if no smart money traders, show top performers by win rate
  const displayTraders = smartMoneyTraders.length > 0 ? smartMoneyTraders : traders.sort((a, b) => b.winRate - a.winRate).slice(0, 5)

  // Call AI analysis API for each trader
  const traderAddresses = displayTraders.map(t => t.address)
  const { analyses: aiAnalyses, isLoading: aiLoading } = useBatchAIAnalysis(traderAddresses, displayTraders.length > 0)

  const getWhaleType = (index: number): 'pelosi' | 'trump' | 'pepe' | 'default' => {
    const types: ('pelosi' | 'trump' | 'pepe' | 'default')[] = ['pelosi', 'pepe', 'trump', 'default', 'pepe']
    return types[index] || 'default'
  }

  // Get AI review for a trader (from API or fallback)
  // Get AI review for a trader (from API or fallback, limited to 30 chars)
  const getAIReview = (trader: TraderProfile): string => {
    let review = ''
    const apiAnalysis = aiAnalyses[trader.address]
    if (apiAnalysis?.ai_analysis) {
      review = apiAnalysis.ai_analysis
    } else if (apiAnalysis?.label) {
      review = `${apiAnalysis.label} - ${apiAnalysis.trading_style || ''}风格`
    } else {
      review = trader.aiReview || '正在分析中...'
    }
    // Limit to 30 characters
    return review.length > 30 ? review.slice(0, 30) + '...' : review
  }

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-neon-pink" />
          <span className="gradient-text-pink">国会山巨鲸</span>
        </h3>
        <span className="cyber-tag-green text-[10px]">
          {aiLoading ? '// Analyzing... 🔄' : '// Smart Money 🧠'}
        </span>
      </div>

      {displayTraders.length > 0 ? (
        <div className="space-y-2">
          {displayTraders.map((trader, index) => (
            <Link key={trader.address} href={`/traders/${trader.address}`}
              className="block rounded-lg bg-cyber-darker/60 p-3 hover:bg-cyber-gray border border-transparent hover:border-neon-pink/30 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-dim-gray w-5">#{index + 1}</span>
                  <WhaleAvatar type={getWhaleType(index)} size="sm" />
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-medium text-dim-white group-hover:text-neon-pink">{trader.shortAddress}</span>
                    <div className="flex gap-1 mt-0.5">
                      {trader.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px]" title={tag}>{getTagEmoji(tag)}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-neon-green font-mono">{trader.winRate}%</div>
                  <div className="text-[10px] text-dim-gray font-mono">ROI {trader.roi}%</div>
                </div>
              </div>
              {/* AI Profile Analysis */}
              <div className="mt-2 pt-2 border-t border-cyber-border/30">
                <p className="text-[10px] text-dim-gray line-clamp-2 leading-relaxed">
                  <span className="text-neon-cyan">🤖 AI:</span> {getAIReview(trader)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-xs text-dim-gray py-6">暂无聪明钱数据</div>
      )}

      <Link href="/traders?tab=smart-money" className="mt-4 flex items-center justify-center gap-2 text-xs text-neon-pink hover:text-neon-cyan font-mono py-2 transition-smooth">
        <Copy className="w-3.5 h-3.5" />
        <span>Copy Their Homework →</span>
      </Link>
    </div>
  )
}

// Reverse Indicator with real data
function ReverseIndicatorFeed({ traders }: { traders: TraderProfile[] }) {
  const reverseTraders = traders.filter((t) => t.tags.includes('反向指标'))

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-neon-red" />
          <span className="text-neon-red">反向指标警报</span>
        </h3>
        <span className="cyber-tag-red text-[10px] alert-flash">// WRONG! 🔊</span>
      </div>

      {reverseTraders.length > 0 ? (
        <div className="space-y-2">
          {reverseTraders.slice(0, 2).map((trader) => (
            <div key={trader.address} className="rounded-lg bg-neon-red/5 border border-neon-red/20 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <WhaleAvatar type="default" size="sm" />
                    <span className="font-mono text-xs font-medium text-dim-white">{trader.shortAddress}</span>
                    <span className="cyber-tag-red text-[10px] py-0.5">胜率 {trader.winRate}%</span>
                  </div>
                  <div className="mt-1.5 text-xs text-dim-gray">{trader.recentPerformance.message}</div>
                </div>
                <div className="cyber-tag-red text-[10px]">反向 {100 - trader.winRate}%</div>
              </div>
              <div className="mt-2.5 rounded-lg bg-neon-orange/10 border border-neon-orange/20 p-2 text-[10px] text-dim-white">
                <span className="text-neon-orange font-medium">💡 Pro tip:</span> Do the opposite
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-xs text-dim-gray py-6">暂无反向指标动态</div>
      )}

      <Link href="/traders?tab=reverse" className="mt-4 flex items-center justify-center gap-2 text-xs text-neon-red hover:text-neon-orange font-mono py-2 transition-smooth">
        <span>See All Losers →</span>
      </Link>
    </div>
  )
}

// Market Sentiment
function MarketSentiment() {
  const sentimentData = getSentimentData()

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-neon-cyan" />
          <span className="gradient-text">市场情绪雷达</span>
        </h3>
        <span className="cyber-tag-cyan text-[10px]">7D</span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={sentimentData}>
          <XAxis dataKey="date" stroke="#4B5563" tickFormatter={(val) => val.slice(5)} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
          <YAxis stroke="#4B5563" domain={[0, 100]} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
          <Tooltip contentStyle={{ backgroundColor: '#161B28', border: '1px solid #1F2937', borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)' }} labelStyle={{ color: '#00D4FF', fontWeight: 600, fontFamily: 'monospace', fontSize: '11px' }} />
          <Line type="monotone" dataKey="bullish" stroke="#00FF9D" strokeWidth={2} name="Bulls" dot={false} />
          <Line type="monotone" dataKey="bearish" stroke="#FF0055" strokeWidth={2} name="Bears" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 flex justify-center gap-5 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-neon-green glow-green"></div>
          <span className="text-dim-gray font-mono">Bulls 🐂</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-neon-red glow-red"></div>
          <span className="text-dim-gray font-mono">Bears 🐻</span>
        </div>
      </div>
    </div>
  )
}

// Stats Cards with real data
function StatsCards({ tradersCount, marketsCount, whalesCount }: { tradersCount: number, marketsCount: number, whalesCount: number }) {
  const stats = [
    { label: 'Alpha Leaked', value: `$${(marketsCount * 80).toLocaleString()}K`, change: '+12.5%', icon: '💰', positive: true },
    { label: 'Whales Tracked', value: tradersCount.toLocaleString(), change: `+${Math.floor(tradersCount * 0.03)}`, icon: '🐋', positive: true },
    { label: 'Homework Copied', value: (whalesCount * 10).toLocaleString(), change: '+156', icon: '📝', positive: true },
    { label: 'Wrong Calls', value: Math.floor(tradersCount * 0.25).toString(), change: '-69', icon: '❌', positive: false },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <div key={index} className="cyber-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">{stat.icon}</span>
            <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded", stat.positive ? "text-neon-green bg-neon-green/10" : "text-neon-red bg-neon-red/10")}>
              {stat.change}
            </span>
          </div>
          <div className={cn("text-xl font-bold font-mono", stat.positive ? "text-neon-cyan" : "text-neon-orange")}>
            {stat.value}
          </div>
          <div className="text-[10px] text-dim-gray mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // API Hooks with real data
  const { isConnected, isChecking } = useHealthCheck()
  const { data: marketsData, isLoading: marketsLoading } = useMarkets({ limit: 50, active_only: true })
  const { data: tradersData, isLoading: tradersLoading } = useTradersLeaderboard({ limit: 50 })
  const { data: whalesData } = usePollingWhales({ limit: 20 }, 15000) // Poll every 15 seconds

  // Transform API data to frontend format with fallback
  const markets = getMarketsWithFallback(marketsData?.data)
  const traders = getTradersWithFallback(tradersData?.data)
  const alerts = getAlertsWithFallback(whalesData?.data)

  useEffect(() => {
    // Show loading animation for 1.5s minimum
    const timer = setTimeout(() => setIsInitialLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const isLoading = isInitialLoading || (marketsLoading && tradersLoading)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ShredderLoading />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          仪表盘
          <span className="text-lg font-normal text-dim-gray">/Dashboard</span>
          <span className="w-2 h-2 rounded-full bg-neon-green pulse-dot" />
        </h1>
        <p className="text-[10px] text-dim-gray mt-1 font-mono">// Welcome back, fellow insider trader 🤫</p>
      </div>

      <StatsCards
        tradersCount={traders.length}
        marketsCount={markets.length}
        whalesCount={whalesData?.total || 100}
      />
      <AlertFeed alerts={alerts} />

      <div className="grid gap-4 lg:grid-cols-2">
        <HotMarkets markets={markets} />
        <TopSmartMoney traders={traders} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReverseIndicatorFeed traders={traders} />
        <MarketSentiment />
      </div>

      <div className="text-center py-3 flex flex-col items-center gap-2">
        <p className="text-[9px] text-dim-gray font-mono">
          ⚠️ This is satire. Not financial advice. We're definitely not connected to any government servers.
        </p>
        <ConnectionStatus isConnected={isConnected} isChecking={isChecking} />
      </div>
    </div>
  )
}
