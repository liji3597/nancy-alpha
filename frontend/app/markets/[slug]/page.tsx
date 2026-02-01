'use client'

import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cn, formatNumber, formatTimeAgo, formatDate, getTagEmoji } from '@/lib/utils'
import { useMarketDetail } from '@/lib/api/hooks'
import { mockMarkets, mockTrades, mockTraders } from '@/lib/mock-data'
import { ArrowLeft, TrendingUp, Clock, Activity, Users, DollarSign, Info, CheckCircle, XCircle, BarChart3, Loader2 } from 'lucide-react'

// Next.js 14 中 params 是普通对象，不是 Promise
export default function MarketDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  // 尝试从 API 获取数据
  const { data: apiMarket, isLoading, error } = useMarketDetail(slug)

  // 优先从 API 获取真实价格，mock 数据作为后备
  const mockMarket = mockMarkets.find((m) => m.slug === slug)

  // 合并数据源：优先使用 API 数据的价格
  const market = apiMarket ? {
    ...mockMarket,
    title: apiMarket.question || mockMarket?.title,
    slug: apiMarket.slug,
    category: apiMarket.category || mockMarket?.category,
    subcategory: apiMarket.category || mockMarket?.subcategory,
    resolved: apiMarket.resolved,
    active: apiMarket.active,
    status: apiMarket.active ? 'active' : apiMarket.resolved ? 'resolved' : 'closed',
    // 优先使用 API 返回的真实链上价格
    yesPrice: apiMarket.yes_price ?? mockMarket?.yesPrice ?? 0.5,
    noPrice: apiMarket.no_price ?? mockMarket?.noPrice ?? 0.5,
    currentPrice: apiMarket.yes_price ?? mockMarket?.currentPrice ?? 0.5,
    volume24h: apiMarket.stats?.total_volume || mockMarket?.volume24h || 0,
    tradeCount: apiMarket.stats?.trade_count || 0,
    whaleCount: apiMarket.stats?.whale_count || 0,
    recentTrades: apiMarket.recent_trades || [],
    endDate: mockMarket?.endDate,
    liquidity: mockMarket?.liquidity,
  } : mockMarket

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    )
  }

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

  // 计算概率百分比
  const yesPercent = Math.round((market.yesPrice || 0.5) * 100)
  const noPercent = 100 - yesPercent

  // 模拟价格历史数据
  const priceHistory = Array.from({ length: 7 }, (_, i) => ({
    timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    yesPrice: (market.yesPrice || 0.5) + (Math.random() - 0.5) * 0.1,
    noPrice: (market.noPrice || 0.5) + (Math.random() - 0.5) * 0.1,
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
      avgPrice: (market.yesPrice || 0.5) + (Math.random() - 0.5) * 0.1,
      unrealizedPnL: (Math.random() - 0.3) * 10000,
    }))

  // 使用 API 交易数据或 mock 数据
  const trades = (market as any).recentTrades?.length > 0
    ? (market as any).recentTrades.map((t: any) => ({
        txHash: t.tx_hash,
        maker: t.maker,
        side: t.side,
        outcome: t.outcome,
        price: t.price || 0.5,
        size: t.amount_usd || 1000,
        timestamp: new Date(t.timestamp),
      }))
    : mockTrades.slice(0, 10)

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <Link href="/markets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neon-cyan hover:text-neon-green transition-smooth-fast font-mono">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>
      </div>

      {/* 主标题区域 */}
      <div className="cyber-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium",
                market.status === 'active' || (market as any).active
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                  : "bg-cyber-gray text-dim-gray border border-cyber-border"
              )}>
                {market.status === 'active' || (market as any).active ? '🟢 Active' : '⚫ Closed'}
              </span>
              <span className="cyber-tag-cyan">{market.subcategory || market.category}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {market.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-dim-gray font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                截止: {market.endDate ? formatDate(market.endDate) : 'TBD'}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                总交易量: ${formatNumber(market.volume24h || 0)}
              </span>
              {(market as any).tradeCount > 0 && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  交易次数: {(market as any).tradeCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* YES/NO 概率卡片 - Polymarket 风格 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* YES 卡片 */}
        <div className="cyber-card p-6 border-2 border-neon-green/30 hover:border-neon-green/50 transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-neon-green" />
              </div>
              <div>
                <div className="text-lg font-bold text-neon-green">YES</div>
                <div className="text-xs text-dim-gray font-mono">看涨</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-neon-green font-mono">{yesPercent}%</div>
              <div className="text-sm text-dim-gray font-mono">${(market.yesPrice || 0.5).toFixed(2)}</div>
            </div>
          </div>
          <div className="h-3 bg-cyber-darker rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-green/60 to-neon-green rounded-full transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
          <div className="mt-3 text-xs text-dim-gray">
            如果事件发生，每份 YES 将结算为 $1.00
          </div>
        </div>

        {/* NO 卡片 */}
        <div className="cyber-card p-6 border-2 border-neon-red/30 hover:border-neon-red/50 transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neon-red/20 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-neon-red" />
              </div>
              <div>
                <div className="text-lg font-bold text-neon-red">NO</div>
                <div className="text-xs text-dim-gray font-mono">看跌</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-neon-red font-mono">{noPercent}%</div>
              <div className="text-sm text-dim-gray font-mono">${(market.noPrice || 0.5).toFixed(2)}</div>
            </div>
          </div>
          <div className="h-3 bg-cyber-darker rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-red/60 to-neon-red rounded-full transition-all duration-500"
              style={{ width: `${noPercent}%` }}
            />
          </div>
          <div className="mt-3 text-xs text-dim-gray">
            如果事件不发生，每份 NO 将结算为 $1.00
          </div>
        </div>
      </div>

      {/* 市场描述与规则 */}
      <div className="cyber-card p-5">
        <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
          <Info className="w-5 h-5 text-neon-cyan" />
          市场描述与结算规则
        </h3>
        <div className="space-y-4 text-sm text-dim-white">
          <div>
            <div className="text-neon-cyan font-medium mb-1">📋 市场问题</div>
            <p className="text-foreground">{market.title}</p>
          </div>
          <div>
            <div className="text-neon-cyan font-medium mb-1">⚖️ 结算规则</div>
            <ul className="list-disc list-inside space-y-1 text-dim-gray">
              <li>该市场将根据官方公布的结果进行结算</li>
              <li>如果事件在截止日期前发生，<span className="text-neon-green">YES</span> 结算为 $1.00，<span className="text-neon-red">NO</span> 结算为 $0.00</li>
              <li>如果事件未发生，<span className="text-neon-red">NO</span> 结算为 $1.00，<span className="text-neon-green">YES</span> 结算为 $0.00</li>
              <li>结算价格基于可信新闻来源和官方声明</li>
            </ul>
          </div>
          <div>
            <div className="text-neon-cyan font-medium mb-1">📊 市场统计</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <div className="bg-cyber-darker rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground font-mono">${formatNumber(market.volume24h || 0)}</div>
                <div className="text-xs text-dim-gray">总交易量</div>
              </div>
              <div className="bg-cyber-darker rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground font-mono">{(market as any).tradeCount || '—'}</div>
                <div className="text-xs text-dim-gray">交易次数</div>
              </div>
              <div className="bg-cyber-darker rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground font-mono">{(market as any).whaleCount || '—'}</div>
                <div className="text-xs text-dim-gray">巨鲸数量</div>
              </div>
              <div className="bg-cyber-darker rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground font-mono">{market.liquidity || '—'}</div>
                <div className="text-xs text-dim-gray">流动性评分</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* 价格走势图 */}
        <div className="cyber-card p-5">
          <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-cyan" />
            价格走势 (7D)
          </h3>
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
        </div>

        {/* 买卖压力 */}
        <div className="cyber-card p-5">
          <h3 className="mb-4 text-base font-bold gradient-text">买卖压力分析</h3>
          <div className="mb-4 flex h-10 overflow-hidden rounded-lg border border-cyber-border">
            <div className="bg-gradient-to-r from-neon-green/60 to-neon-green flex items-center justify-center text-cyber-black text-sm font-bold" style={{ width: `${yesPercent}%` }}>
              {yesPercent}%
            </div>
            <div className="bg-gradient-to-r from-neon-red to-neon-red/60 flex items-center justify-center text-white text-sm font-bold" style={{ width: `${noPercent}%` }}>
              {noPercent}%
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-neon-green font-medium font-mono">买入 YES: {yesPercent}%</span>
              <div className="text-xs text-dim-gray font-mono">${formatNumber((market.volume24h || 0) * yesPercent / 100)}</div>
            </div>
            <div className="text-right">
              <span className="text-neon-red font-medium font-mono">买入 NO: {noPercent}%</span>
              <div className="text-xs text-dim-gray font-mono">${formatNumber((market.volume24h || 0) * noPercent / 100)}</div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-cyber-darker border border-cyber-border p-4 text-center">
            <div className="text-3xl mb-2">{yesPercent > 60 ? '🚀' : yesPercent > 40 ? '⚖️' : '📉'}</div>
            <div className={cn(
              "text-sm font-medium",
              yesPercent > 60 ? "text-neon-green" : yesPercent > 40 ? "text-neon-orange" : "text-neon-red"
            )}>
              {yesPercent > 70 ? '强烈看涨' : yesPercent > 55 ? '温和看涨' : yesPercent > 45 ? '观点分歧' : yesPercent > 30 ? '温和看跌' : '强烈看跌'}
            </div>
            <div className="text-xs text-dim-gray mt-1">基于当前市场价格</div>
          </div>
        </div>
      </div>

      {/* 聪明钱持仓分析 */}
      <div className="cyber-card p-5">
        <h3 className="mb-4 text-base font-bold gradient-text flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-cyan" />
          🧠 聪明钱持仓
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
                      持仓: <span className={pos.outcome === 'YES' ? 'text-neon-green' : 'text-neon-red'}>{pos.outcome}</span> @ ${pos.avgPrice.toFixed(2)}
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
          <div className="text-center text-sm text-dim-gray py-6">暂无聪明钱持仓数据</div>
        )}
      </div>

      {/* 最近交易 */}
      <div className="cyber-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold gradient-text flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-cyan" /> 最近交易
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
                <th className="px-3 py-2.5 text-left text-dim-gray font-mono text-xs">时间</th>
                <th className="px-3 py-2.5 text-left text-dim-gray font-mono text-xs">方向</th>
                <th className="px-3 py-2.5 text-right text-dim-gray font-mono text-xs">价格</th>
                <th className="px-3 py-2.5 text-right text-dim-gray font-mono text-xs">数量</th>
                <th className="px-3 py-2.5 text-right text-dim-gray font-mono text-xs">总额</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 10).map((trade: any, i: number) => {
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
                    <td className="px-3 py-2 text-right font-mono text-foreground">${trade.price.toFixed(2)}</td>
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
