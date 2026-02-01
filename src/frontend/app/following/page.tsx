'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatNumber, formatTimeAgo, getTagEmoji } from '@/lib/utils'
import { mockTraders } from '@/lib/mock-data'
import { useHasMounted } from '@/lib/hooks/use-has-mounted'
import { Star, Settings, Eye, Sliders, UserMinus } from 'lucide-react'

function FollowedTraderCard({ trader }: { trader: any }) {
  const [showSettings, setShowSettings] = useState(false)
  const [followConfig, setFollowConfig] = useState({ enabled: true, copyRatio: 30, maxPerTrade: 1000 })

  const followPerformance = {
    totalInvested: Math.random() * 5000 + 1000,
    totalPnL: (Math.random() - 0.3) * 2000,
    followedTrades: Math.floor(Math.random() * 20) + 5,
    lastFollowTime: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
  }

  const status = trader.recentPerformance.status === 'good' ? 'active' : 'warning'

  return (
    <div className="cyber-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Link href={`/traders/${trader.address}`} className="font-mono text-base font-medium text-foreground hover:text-neon-cyan transition-smooth-fast">
            {trader.shortAddress}
          </Link>
          <div className="mt-2 flex flex-wrap gap-1">
            {trader.tags.slice(0, 4).map((tag: string) => (
              <span key={tag} className="text-sm" title={tag}>{getTagEmoji(tag)}</span>
            ))}
          </div>
        </div>
        <div className={cn("rounded-lg px-2.5 py-1 text-xs font-medium", status === 'active' ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-neon-red/10 text-neon-red border border-neon-red/20")}>
          {status === 'active' ? '✅ 活跃' : '⚠️ 警示'}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-cyber-darker border border-cyber-border p-3">
        <div>
          <div className="text-[10px] text-dim-gray font-mono">胜率</div>
          <div className="mt-1 text-base font-bold text-neon-cyan font-mono">{trader.winRate}%</div>
        </div>
        <div>
          <div className="text-[10px] text-dim-gray font-mono">ROI</div>
          <div className="mt-1 text-base font-bold text-neon-green font-mono">{trader.roi}%</div>
        </div>
        <div>
          <div className="text-[10px] text-dim-gray font-mono">总盈利</div>
          <div className="mt-1 text-base font-bold text-foreground font-mono">${formatNumber(trader.totalProfit)}</div>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 p-3">
        <div className="mb-2 text-xs font-medium text-neon-cyan">跟单表现</div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <div className="text-dim-gray">已投入</div>
            <div className="mt-0.5 font-medium text-foreground font-mono">${formatNumber(followPerformance.totalInvested)}</div>
          </div>
          <div>
            <div className="text-dim-gray">盈亏</div>
            <div className={cn("mt-0.5 font-medium font-mono", followPerformance.totalPnL > 0 ? "text-neon-green" : "text-neon-red")}>
              {followPerformance.totalPnL > 0 ? '+' : ''}${formatNumber(followPerformance.totalPnL)}
            </div>
          </div>
          <div>
            <div className="text-dim-gray">跟单次数</div>
            <div className="mt-0.5 font-medium text-foreground font-mono">{followPerformance.followedTrades}笔</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-dim-gray font-mono" suppressHydrationWarning>
          最后跟单: {formatTimeAgo(followPerformance.lastFollowTime)}
        </div>
      </div>

      <div className="mb-4">
        <button onClick={() => setShowSettings(!showSettings)} className="flex w-full items-center justify-between rounded-lg bg-cyber-darker border border-cyber-border p-2.5 text-xs font-medium text-dim-white hover:border-neon-cyan/30 transition-all">
          <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> 跟单配置</span>
          <span>{showSettings ? '▲' : '▼'}</span>
        </button>

        {showSettings && (
          <div className="mt-2 space-y-3 rounded-lg bg-cyber-darker border border-cyber-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-dim-white">启用跟单</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={followConfig.enabled} onChange={(e) => setFollowConfig({ ...followConfig, enabled: e.target.checked })} className="peer sr-only" />
                <div className="peer h-5 w-9 rounded-full bg-cyber-border after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-dim-gray after:transition-all peer-checked:bg-neon-cyan peer-checked:after:translate-x-full peer-checked:after:bg-cyber-black"></div>
              </label>
            </div>
            {followConfig.enabled && (
              <>
                <div>
                  <label className="mb-1 block text-[10px] text-dim-gray font-mono">跟单比例: {followConfig.copyRatio}%</label>
                  <input type="range" min="10" max="100" step="5" value={followConfig.copyRatio} onChange={(e) => setFollowConfig({ ...followConfig, copyRatio: parseInt(e.target.value) })} className="w-full accent-neon-cyan" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-dim-gray font-mono">单笔最大额</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dim-gray">$</span>
                    <input type="number" value={followConfig.maxPerTrade} onChange={(e) => setFollowConfig({ ...followConfig, maxPerTrade: parseInt(e.target.value) })} className="flex-1 rounded-lg bg-cyber-black border border-cyber-border px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:border-neon-cyan/50" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={`/traders/${trader.address}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cyber-darker border border-cyber-border py-2 text-xs font-medium text-dim-white hover:border-neon-cyan/30 transition-all">
          <Eye className="w-3.5 h-3.5" /> 详情
        </Link>
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-neon-cyan py-2 text-xs font-medium text-cyber-black hover:bg-neon-green transition-all">
          <Sliders className="w-3.5 h-3.5" /> 调整
        </button>
        <button className="rounded-lg bg-neon-red/20 border border-neon-red/30 px-3 py-2 text-xs font-medium text-neon-red hover:bg-neon-red/30 transition-all">
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function FollowingPage() {
  const hasMounted = useHasMounted()
  const [filter, setFilter] = useState<'all' | 'active' | 'warning' | 'paused'>('all')

  const followedTraders = mockTraders.slice(0, 3)

  const overview = {
    totalFollowed: followedTraders.length,
    activeFollowed: followedTraders.filter((t) => t.recentPerformance.status === 'good').length,
    totalInvested: 12500,
    totalPnL: 2340,
    todayActivities: 5,
  }

  const filteredTraders = followedTraders.filter((trader) => {
    if (filter === 'all') return true
    if (filter === 'active') return trader.recentPerformance.status === 'good'
    if (filter === 'warning') return trader.recentPerformance.status === 'warning'
    return true
  })

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Star className="w-6 h-6 text-neon-cyan" />
          My Following
          {hasMounted && <span className="text-lg text-dim-gray">({overview.totalFollowed})</span>}
        </h1>
        <p className="text-[10px] text-dim-gray mt-1 font-mono">// Track your copied homework performance</p>
      </div>

      {/* 快速筛选 */}
      <div className="flex gap-1.5">
        {[
          { value: 'all' as const, label: '全部', count: overview.totalFollowed },
          { value: 'active' as const, label: '活跃', count: overview.activeFollowed },
          { value: 'warning' as const, label: '警示', count: overview.totalFollowed - overview.activeFollowed },
          { value: 'paused' as const, label: '已暂停', count: 0 },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              filter === f.value
                ? "bg-neon-cyan text-cyber-black"
                : "bg-cyber-darker text-dim-white border border-cyber-border hover:border-neon-cyan/30"
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 跟单总览 */}
        <div className="cyber-card p-5">
          <h3 className="mb-4 text-base font-bold gradient-text">跟单总览</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-dim-gray font-mono">关注</div>
              <div className="mt-1 text-xl font-bold text-foreground font-mono">{overview.totalFollowed}</div>
              <div className="text-[10px] text-dim-gray font-mono">活跃: {overview.activeFollowed}</div>
            </div>
            <div>
              <div className="text-[10px] text-dim-gray font-mono">总投入</div>
              <div className="mt-1 text-xl font-bold text-foreground font-mono">${formatNumber(overview.totalInvested)}</div>
            </div>
            <div>
              <div className="text-[10px] text-dim-gray font-mono">总盈亏</div>
              <div className={cn("mt-1 text-xl font-bold font-mono", overview.totalPnL > 0 ? "text-neon-green" : "text-neon-red")}>
                {overview.totalPnL > 0 ? '+' : ''}${formatNumber(overview.totalPnL)}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-cyber-darker border border-cyber-border p-3">
            <span className="text-xs text-dim-white">今日动态</span>
            <span className="text-base font-bold text-neon-cyan font-mono">{overview.todayActivities} 条</span>
          </div>
        </div>

        {/* 最近动态 */}
        <div className="lg:col-span-2 cyber-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold gradient-text">🔔 最近动态</h3>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-neon-green pulse-dot"></div>
              <span className="text-[10px] text-dim-gray font-mono">实时更新</span>
            </div>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {followedTraders.map((trader, i) => (
              <div key={trader.address} className="rounded-lg bg-cyber-darker border border-cyber-border p-3 hover:border-neon-cyan/30 transition-all">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💰</span>
                  <div className="flex-1">
                    <p className="text-xs text-dim-white">
                      <Link href={`/traders/${trader.address}`} className="font-mono font-medium text-foreground hover:text-neon-cyan">{trader.shortAddress}</Link>{' '}
                      买入 "2024美国总统选举" ${formatNumber(Math.random() * 10000 + 1000)} @0.62
                    </p>
                    <div className="mt-1 text-[10px] text-dim-gray font-mono">{i * 5 + 2}分钟前</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 关注的交易者列表 */}
      <div>
        <h2 className="mb-4 text-base font-bold text-foreground">📋 我关注的交易者</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTraders.map((trader) => (
            <FollowedTraderCard key={trader.address} trader={trader} />
          ))}
        </div>
      </div>
    </div>
  )
}
