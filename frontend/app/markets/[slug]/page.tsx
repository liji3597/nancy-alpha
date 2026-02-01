'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { cn, formatNumber, formatTimeAgo, formatDate, getTagEmoji } from '@/lib/utils'
import { mockMarkets, mockOrderbook, mockTrades, mockTraders } from '@/lib/mock-data'
import { ArrowLeft, TrendingUp, Clock, Activity } from 'lucide-react'

export default function MarketDetailPage({ params }: { params: { slug: string } }) {
  const market = mockMarkets.find((m) => m.slug === params.slug)

  if (!market) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Market Not Found</h2>
          <Link href="/markets" className="mt-4 block text-neon-cyan hover:text-neon-green transition-smooth-fast">
            ← Back to Markets
          </Link>
        </div>
      </div>
    )
  }

  // 模拟价格历史数据
  const priceHistory = Array.from({ length: 7 }, (_, i) => ({
    timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    yesPrice: market.yesPrice + (Math.random() - 0.5) * 0.1,
    noPrice: market.noPrice + (Math.random() - 0.5) * 0.1,
  }))

  // 模拟聪明钱持仓
  const smartMoneyPositions = mockTraders
    .filter((t) => t.tags.includes('聪明钱') || t.tags.includes('巨鲸'))
    .slice(0, 3)
    .map((trader) => ({
      address: trader.address,
      shortAddress: trader.shortAddress,
      tags: trader.tags,
      outcome: Math.random() > 0.5 ? 'YES' : 'NO',
      amount: Math.random() * 50000 + 10000,
      avgPrice: market.currentPrice + (Math.random() - 0.5) * 0.1,
      unrealizedPnL: (Math.random() - 0.3) * 10000,
    }))

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <Link href="/markets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neon-cyan hover:text-neon-green transition-smooth-fast font-mono">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>
        <h1 className="text-2xl font-bold gradient-text mt-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-neon-cyan" />
          Market Detail
        </h1>
        <p className="mt-2 text-base text-dim-white">{market.title}</p>
      </div>

      {/* 市场信息头部 */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="cyber-tag-cyan">
          {market.category}
        </span>
        <span className="flex items-center gap-1 text-dim-white font-mono">
          <span className="text-neon-green">$</span>{formatNumber(market.volume24h)} (24h)
        </span>
        <span
          className={cn(
            "flex items-center gap-1 font-medium font-mono",
            market.priceChange24h > 0 ? "text-neon-green" : "text-neon-red"
          )}
        >
          {market.priceChange24h > 0 ? "↑" : "↓"} {Math.abs(market.priceChange24h).toFixed(2)}%
        </span>
        <span className="flex items-center gap-1 text-dim-gray font-mono">
          <Clock className="w-3.5 h-3.5" /> {formatDate(market.endDate)}
        </span>
        <span
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium",
            market.status === 'active'
              ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
              : "bg-cyber-gray text-dim-gray border border-cyber-border"
          )}
        >
          {market.status === 'active' ? '✅ Active' : 'Closed'}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* 价格走势图 */}
        <div className="cyber-card p-5">
          <h3 className="mb-4 text-base font-bold gradient-text">Price Trend (7D)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={priceHistory}>
              <XAxis dataKey="timestamp" stroke="#6B7280" tickFormatter={(val) => val.slice(5)} fontSize={10} />
              <YAxis stroke="#6B7280" domain={[0, 1]} tickFormatter={(val) => `$${val.toFixed(2)}`} fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #1E293B', borderRadius: '8px' }}
                labelStyle={{ color: '#9CA3AF' }}
                formatter={(value: number) => [`$${value.toFixed(4)}`, '']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="yesPrice"
                stroke="#00FF9D"
                strokeWidth={2}
                name="YES"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="noPrice"
                stroke="#FF0055"
                strokeWidth={2}
                name="NO"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 flex justify-center gap-8">
            <div className="text-center">
              <div className="text-xs text-dim-gray font-mono">YES Price</div>
              <div className="text-2xl font-bold text-neon-green font-mono">${market.yesPrice.toFixed(4)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-dim-gray font-mono">NO Price</div>
              <div className="text-2xl font-bold text-neon-red font-mono">${market.noPrice.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* 买卖压力 */}
        <div className="cyber-card p-5">
          <h3 className="mb-4 text-base font-bold gradient-text">Buy/Sell Pressure</h3>
          <div className="mb-4 flex h-8 overflow-hidden rounded-lg border border-cyber-border">
            <div className="bg-neon-green/80" style={{ width: '60%' }} />
            <div className="bg-neon-red/80" style={{ width: '40%' }} />
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-neon-green font-medium font-mono">Buy: 60.0%</span>
              <div className="text-xs text-dim-gray font-mono">${formatNumber(market.volume24h * 0.6)}</div>
            </div>
            <div className="text-right">
              <span className="text-neon-red font-medium font-mono">Sell: 40.0%</span>
              <div className="text-xs text-dim-gray font-mono">${formatNumber(market.volume24h * 0.4)}</div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-cyber-darker border border-cyber-border p-3 text-center">
            <div className="text-2xl">📈</div>
            <div className="mt-1 text-sm font-medium text-neon-green">Moderately Bullish</div>
          </div>
        </div>
      </div>

      {/* 聪明钱持仓分析 */}
      <div className="cyber-card p-5">
        <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
          <span>🧠</span> Smart Money Positions
        </h3>
        {smartMoneyPositions.length > 0 ? (
          <div className="space-y-3">
            {smartMoneyPositions.map((pos) => (
              <Link
                key={pos.address}
                href={`/traders/${pos.address}`}
                className="block rounded-lg bg-cyber-darker border border-cyber-border p-3 hover:border-neon-cyan/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">{pos.shortAddress}</span>
                      {pos.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-base" title={tag}>
                          {getTagEmoji(tag)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-dim-gray font-mono">
                      Position: <span className={pos.outcome === 'YES' ? 'text-neon-green' : 'text-neon-red'}>{pos.outcome}</span> @ ${pos.avgPrice.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground font-mono">${formatNumber(pos.amount)}</div>
                    <div
                      className={cn(
                        "text-xs font-medium font-mono",
                        pos.unrealizedPnL > 0 ? "text-neon-green" : "text-neon-red"
                      )}
                    >
                      {pos.unrealizedPnL > 0 ? "+" : ""}${formatNumber(pos.unrealizedPnL)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-dim-gray">No smart money positions yet</div>
        )}
      </div>

      {/* 最近交易 */}
      <div className="cyber-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold gradient-text flex items-center gap-2">
            <Activity className="w-4 h-4 text-neon-cyan" /> Recent Trades
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-neon-green pulse-dot"></div>
            <span className="text-[10px] text-dim-gray font-mono">Live</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-cyber-border">
          <table className="w-full text-sm">
            <thead className="bg-cyber-darker border-b border-cyber-border">
              <tr>
                <th className="px-3 py-2.5 text-left text-dim-gray font-mono text-xs">Time</th>
                <th className="px-3 py-2.5 text-left text-dim-gray font-mono text-xs">Side</th>
                <th className="px-3 py-2.5 text-right text-dim-gray font-mono text-xs">Price</th>
                <th className="px-3 py-2.5 text-right text-dim-gray font-mono text-xs">Size</th>
                <th className="px-3 py-2.5 text-right text-dim-gray font-mono text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {mockTrades.slice(0, 10).map((trade, i) => {
                const isBuy = trade.side === 'BUY'
                return (
                  <tr key={`${trade.txHash}-${i}`} className="border-t border-cyber-border hover:bg-cyber-gray/50 transition-smooth-fast">
                    <td className="px-3 py-2 text-xs text-dim-gray font-mono" suppressHydrationWarning>{formatTimeAgo(trade.timestamp)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          isBuy ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-neon-red/10 text-neon-red border border-neon-red/20"
                        )}
                      >
                        {trade.side} {trade.outcome}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-foreground">${trade.price.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right text-dim-white font-mono">{formatNumber(trade.size)}</td>
                    <td className="px-3 py-2 text-right font-medium text-foreground font-mono">
                      ${formatNumber(trade.size * trade.price)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
