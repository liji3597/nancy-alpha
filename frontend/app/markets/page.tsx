'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { cn, formatNumber, formatDate } from '@/lib/utils'
import { mockMarkets } from '@/lib/mock-data'
import { TrendingUp, Filter, BarChart3 } from 'lucide-react'

function MarketCard({ market }: { market: any }) {
  return (
    <Link href={`/markets/${market.slug}`} className="block">
      <div className="cyber-card p-4 hover:border-neon-cyan/40 transition-all">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{market.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="cyber-tag-cyan py-0.5">{market.subcategory}</span>
            <span className="text-dim-gray font-mono">截止 {formatDate(market.endDate)}</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xl font-bold font-mono text-foreground">${market.currentPrice.toFixed(2)}</div>
            <div className={cn("text-xs font-mono", market.priceChange24h > 0 ? "text-neon-green" : "text-neon-red")}>
              {market.priceChange24h > 0 ? "↑" : "↓"} {Math.abs(market.priceChange24h).toFixed(2)}%
            </div>
          </div>

          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={market.priceHistory7d}>
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={market.priceChange24h > 0 ? "#00FF9D" : "#FF0055"}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-dim-gray font-mono">
          <span>24h Vol: ${formatNumber(market.volume24h)}</span>
          <span className="flex items-center gap-1">
            流动性:
            <span className={cn("font-medium", market.liquidity > 70 ? "text-neon-green" : market.liquidity > 40 ? "text-neon-orange" : "text-neon-red")}>
              {market.liquidity}/100
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [sortBy, setSortBy] = useState<'volume' | 'price_change' | 'liquidity'>('volume')

  const categories = ['全部', '国际政治', '地缘政治']

  const filteredMarkets = mockMarkets
    .filter((m) => selectedCategory === '全部' || m.subcategory === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'volume': return b.volume24h - a.volume24h
        case 'price_change': return b.priceChange24h - a.priceChange24h
        case 'liquidity': return b.liquidity - a.liquidity
        default: return 0
      }
    })

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-neon-cyan" />
          Markets
        </h1>
        <p className="text-[10px] text-dim-gray mt-1 font-mono">// Leak Alpha from prediction markets</p>
      </div>

      {/* 筛选和排序 */}
      <div className="cyber-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dim-gray" />
          <span className="text-xs text-dim-gray font-mono">分类:</span>
          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-neon-cyan text-cyber-black"
                    : "bg-cyber-darker text-dim-white border border-cyber-border hover:border-neon-cyan/30"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-dim-gray" />
          <span className="text-xs text-dim-gray font-mono">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg bg-cyber-darker border border-cyber-border px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-neon-cyan/50"
          >
            <option value="volume">交易量 ↓</option>
            <option value="price_change">价格变化 ↓</option>
            <option value="liquidity">流动性 ↓</option>
          </select>
        </div>
      </div>

      {/* 市场列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMarkets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  )
}
