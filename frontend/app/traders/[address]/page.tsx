'use client'

import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn, formatNumber, formatTimeAgo, formatDate, getTagEmoji, getTagStyle } from '@/lib/utils'
import { mockTraders, mockMarkets } from '@/lib/mock-data'
import { ArrowLeft, Users, Target, Brain, History } from 'lucide-react'

export default function TraderDetailPage({ params }: { params: { address: string } }) {
  const trader = mockTraders.find((t) => t.address === params.address)

  if (!trader) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Trader Not Found</h2>
          <Link href="/traders" className="mt-4 block text-neon-pink hover:text-neon-cyan transition-smooth-fast">
            ← Back to Traders
          </Link>
        </div>
      </div>
    )
  }

  // 模拟胜率趋势数据
  const winRateTrend = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    winRate: trader.winRate + (Math.random() - 0.5) * 15,
  }))

  // 模拟交易历史
  const tradeHistory = mockMarkets.slice(0, 3).map((market) => ({
    marketSlug: market.slug,
    marketTitle: market.title,
    trades: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
      txHash: '0x' + Math.random().toString(16).slice(2, 66),
      outcome: Math.random() > 0.5 ? 'YES' : 'NO',
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      price: Math.random() * 0.5 + 0.25,
      size: Math.random() * 5000 + 500,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      pnl: (Math.random() - 0.3) * 2000,
    })),
    totalPnL: (Math.random() - 0.3) * 5000,
    status: Math.random() > 0.3 ? 'won' : 'lost',
  }))

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <Link href="/traders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neon-pink hover:text-neon-cyan transition-smooth-fast font-mono">
          <ArrowLeft className="w-4 h-4" /> Back to Traders
        </Link>
        <h1 className="text-2xl font-bold gradient-text-pink mt-2 flex items-center gap-2">
          <Users className="w-6 h-6 text-neon-pink" />
          Trader Detail
        </h1>
        <p className="mt-2 font-mono text-sm text-dim-gray">{trader.address}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {trader.tags.map((tag) => (
          <span
            key={tag}
            className="cyber-tag-cyan"
          >
            {getTagEmoji(tag)} {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-dim-gray font-mono">
        <span>Joined: {formatDate(trader.joinedAt)}</span>
        <span suppressHydrationWarning>Last Active: {formatTimeAgo(trader.lastActive)}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="cyber-card p-5">
          <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
            <span>📊</span> Basic Info
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-cyber-border">
              <span className="text-dim-gray">Wallet</span>
              <span className="font-mono text-foreground">{trader.shortAddress}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-cyber-border">
              <span className="text-dim-gray">Joined</span>
              <span className="text-foreground font-mono">{formatDate(trader.joinedAt)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-cyber-border">
              <span className="text-dim-gray">Last Active</span>
              <span className="text-foreground font-mono" suppressHydrationWarning>{formatTimeAgo(trader.lastActive)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-dim-gray">Total Volume</span>
              <span className="font-medium text-neon-cyan font-mono">${formatNumber(trader.totalVolume)}</span>
            </div>
          </div>
        </div>

        <div className="cyber-card p-5">
          <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
            <Target className="w-4 h-4 text-neon-cyan" /> Core Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-cyber-darker border border-cyber-border p-3">
              <div className="text-[10px] text-dim-gray font-mono">Win Rate</div>
              <div className="mt-1 text-2xl font-bold text-neon-purple font-mono">{trader.winRate}%</div>
              <div className="mt-1 text-[10px] text-dim-gray font-mono">
                7D: {trader.winRate7d}% | 30D: {trader.winRate30d}%
              </div>
            </div>
            <div className="rounded-lg bg-cyber-darker border border-cyber-border p-3">
              <div className="text-[10px] text-dim-gray font-mono">ROI</div>
              <div className="mt-1 text-2xl font-bold text-neon-green font-mono">{trader.roi}%</div>
            </div>
            <div className="rounded-lg bg-cyber-darker border border-cyber-border p-3">
              <div className="text-[10px] text-dim-gray font-mono">Total Profit</div>
              <div className="mt-1 text-xl font-bold text-foreground font-mono">${formatNumber(trader.totalProfit)}</div>
            </div>
            <div className="rounded-lg bg-cyber-darker border border-cyber-border p-3">
              <div className="text-[10px] text-dim-gray font-mono">Total Trades</div>
              <div className="mt-1 text-xl font-bold text-foreground font-mono">{trader.totalTrades}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="cyber-card p-5 border-neon-purple/30">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-neon-purple" />
          <h3 className="text-base font-bold text-neon-purple">AI Analysis</h3>
        </div>
        <p className="mb-4 leading-relaxed text-dim-white text-sm">{trader.aiReview}</p>
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-cyber-darker border border-cyber-border p-4">
          <div>
            <div className="text-[10px] text-dim-gray font-mono">Suggested Copy Ratio</div>
            <div className="mt-1 text-lg font-bold text-neon-purple font-mono">30-50%</div>
          </div>
          <div>
            <div className="text-[10px] text-dim-gray font-mono">Risk Level</div>
            <div className="mt-1 text-lg font-bold text-neon-orange font-mono">Medium</div>
          </div>
          <div>
            <div className="text-[10px] text-dim-gray font-mono">Confidence</div>
            <div className="mt-1 text-lg font-bold text-neon-green font-mono">82/100</div>
          </div>
        </div>
      </div>

      <div className="cyber-card p-5">
        <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
          <span>📈</span> Win Rate Trend (30D)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={winRateTrend}>
            <XAxis dataKey="date" stroke="#6B7280" tickFormatter={(val) => val.slice(5)} fontSize={10} />
            <YAxis stroke="#6B7280" domain={[0, 100]} fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #1E293B', borderRadius: '8px' }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
            />
            <Line type="monotone" dataKey="winRate" stroke="#C4B5FD" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="cyber-card p-5">
        <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
          <Target className="w-4 h-4 text-neon-cyan" /> Expertise Analysis
        </h3>
        <div className="space-y-4">
          {trader.expertise.map((exp) => (
            <div key={exp.category}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-foreground text-sm">{exp.category}</span>
                <span className="text-xs text-dim-gray font-mono">
                  {exp.trades} trades | {exp.winRate}% win
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cyber-darker border border-cyber-border">
                <div
                  className={cn(
                    "h-full rounded-full",
                    exp.winRate >= 70 ? "bg-neon-green" : exp.winRate >= 50 ? "bg-neon-orange" : "bg-neon-red"
                  )}
                  style={{ width: `${exp.winRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cyber-card p-5">
        <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
          <History className="w-4 h-4 text-neon-cyan" /> Trade History
        </h3>
        <div className="space-y-4">
          {tradeHistory.map((market) => (
            <div key={market.marketSlug} className="rounded-lg bg-cyber-darker border border-cyber-border p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <Link
                    href={`/markets/${market.marketSlug}`}
                    className="font-medium text-foreground hover:text-neon-cyan transition-smooth-fast text-sm"
                  >
                    {market.marketTitle}
                  </Link>
                  <div className="mt-1 text-[10px] text-dim-gray font-mono">{market.trades.length} trades</div>
                </div>
                {market.status !== 'ongoing' && (
                  <div
                    className={cn("text-right", market.totalPnL > 0 ? "text-neon-green" : "text-neon-red")}
                  >
                    <div className="text-xs">{market.status === 'won' ? '✅ Profit' : '❌ Loss'}</div>
                    <div className="mt-1 font-mono text-lg font-bold">
                      {market.totalPnL > 0 ? '+' : ''}${formatNumber(market.totalPnL)}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {market.trades.map((trade, i) => (
                  <div key={`${trade.txHash}-${i}`} className="flex items-center justify-between text-sm py-1.5 border-t border-cyber-border first:border-t-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          trade.side === 'BUY' ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-neon-red/10 text-neon-red border border-neon-red/20"
                        )}
                      >
                        {trade.side} {trade.outcome}
                      </span>
                      <span className="text-dim-gray text-xs font-mono" suppressHydrationWarning>{formatTimeAgo(trade.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-foreground text-xs">${trade.price.toFixed(4)}</span>
                      <span className="text-dim-gray text-xs font-mono">x{formatNumber(trade.size)}</span>
                      {trade.pnl !== undefined && (
                        <span
                          className={cn("font-medium font-mono text-xs", trade.pnl > 0 ? "text-neon-green" : "text-neon-red")}
                        >
                          {trade.pnl > 0 ? '+' : ''}${formatNumber(trade.pnl)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
