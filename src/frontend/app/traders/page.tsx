'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatNumber, getTagEmoji } from '@/lib/utils'
import { mockTraders } from '@/lib/mock-data'
import { Users, Copy, Eye } from 'lucide-react'

type TabType = 'smart_money' | 'reverse' | 'whale' | 'all'

function TradersTabs({ activeTab, setActiveTab }: { activeTab: TabType; setActiveTab: (tab: TabType) => void }) {
  const tabs = [
    { id: 'smart_money' as TabType, label: '🏆 聪明钱', count: mockTraders.filter((t) => t.tags.includes('聪明钱')).length },
    { id: 'reverse' as TabType, label: '🔴 反向指标', count: mockTraders.filter((t) => t.tags.includes('反向指标')).length },
    { id: 'whale' as TabType, label: '🐋 巨鲸', count: mockTraders.filter((t) => t.tags.includes('巨鲸')).length },
    { id: 'all' as TabType, label: '🎯 全部', count: mockTraders.length },
  ]

  return (
    <div className="flex gap-1 cyber-card p-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "px-4 py-2.5 rounded-lg transition-all whitespace-nowrap text-sm font-medium",
            activeTab === tab.id
              ? "bg-neon-cyan text-cyber-black"
              : "text-dim-white hover:bg-cyber-gray"
          )}
        >
          {tab.label}
          <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
        </button>
      ))}
    </div>
  )
}

function TraderCard({ trader }: { trader: any }) {
  const [isFollowing, setIsFollowing] = useState(false)

  return (
    <div className="cyber-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Link href={`/traders/${trader.address}`} className="font-mono text-base font-medium text-foreground hover:text-neon-cyan transition-smooth-fast">
            {trader.shortAddress}
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {trader.tags.map((tag: string) => (
              <span key={tag} className="cyber-tag-cyan text-[10px] py-0.5">
                {getTagEmoji(tag)} {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            isFollowing
              ? "bg-cyber-gray text-dim-white border border-cyber-border"
              : "bg-neon-cyan text-cyber-black hover:bg-neon-green"
          )}
        >
          {isFollowing ? "✓ 已关注" : "+ 关注"}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3 rounded-lg bg-cyber-darker p-3 border border-cyber-border">
        <div>
          <div className="text-[10px] text-dim-gray font-mono">胜率</div>
          <div className="mt-1 text-lg font-bold text-neon-cyan font-mono">{trader.winRate}%</div>
          <div className="text-[10px] text-dim-gray font-mono">7d: {trader.winRate7d}%</div>
        </div>
        <div>
          <div className="text-[10px] text-dim-gray font-mono">ROI</div>
          <div className="mt-1 text-lg font-bold text-neon-green font-mono">{trader.roi}%</div>
        </div>
        <div>
          <div className="text-[10px] text-dim-gray font-mono">总盈利</div>
          <div className="mt-1 text-lg font-bold text-foreground font-mono">${formatNumber(trader.totalProfit)}</div>
        </div>
        <div>
          <div className="text-[10px] text-dim-gray font-mono">总交易</div>
          <div className="mt-1 text-lg font-bold text-foreground font-mono">{trader.totalTrades}笔</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="mb-2 text-xs font-medium text-dim-white">🎯 擅长领域</h4>
        <div className="space-y-1.5">
          {trader.expertise.slice(0, 3).map((exp: any) => (
            <div key={exp.category} className="flex items-center justify-between text-xs">
              <span className="text-dim-white">{exp.category}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-cyber-border">
                  <div
                    className={cn("h-full rounded-full", exp.winRate >= 70 ? "bg-neon-green" : exp.winRate >= 50 ? "bg-neon-orange" : "bg-neon-red")}
                    style={{ width: `${exp.winRate}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[10px] text-dim-gray font-mono">{exp.winRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-cyber-darker border border-cyber-border p-2.5">
        <span className="text-base">
          {trader.recentPerformance.status === 'good' ? '✅' : trader.recentPerformance.status === 'warning' ? '⚠️' : '🔴'}
        </span>
        <span className="text-xs text-dim-white">{trader.recentPerformance.message}</span>
      </div>

      <div className="mb-4 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 p-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-neon-cyan">
          <span>🤖</span>
          <span>AI 智能点评</span>
        </div>
        <p className="text-xs text-dim-white">{trader.aiReview}</p>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/traders/${trader.address}`}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cyber-darker border border-cyber-border py-2 text-xs font-medium text-dim-white hover:border-neon-cyan/30 transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          查看详情
        </Link>
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-neon-cyan py-2 text-xs font-medium text-cyber-black hover:bg-neon-green transition-all">
          <Copy className="w-3.5 h-3.5" />
          Copy Homework
        </button>
      </div>
    </div>
  )
}

export default function TradersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('smart_money')
  const [sortBy, setSortBy] = useState<'win_rate' | 'roi' | 'profit' | 'volume'>('win_rate')

  const filteredTraders = mockTraders
    .filter((trader) => {
      if (activeTab === 'all') return true
      if (activeTab === 'smart_money') return trader.tags.includes('聪明钱')
      if (activeTab === 'reverse') return trader.tags.includes('反向指标')
      if (activeTab === 'whale') return trader.tags.includes('巨鲸')
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'win_rate': return b.winRate - a.winRate
        case 'roi': return b.roi - a.roi
        case 'profit': return b.totalProfit - a.totalProfit
        case 'volume': return b.totalVolume - a.totalVolume
        default: return 0
      }
    })

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="text-2xl font-bold gradient-text-pink flex items-center gap-2">
          <Users className="w-6 h-6 text-neon-pink" />
          Traders
        </h1>
        <p className="text-[10px] text-dim-gray mt-1 font-mono">// Copy homework from the best whales</p>
      </div>

      <TradersTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex items-center gap-2">
        <span className="text-xs text-dim-gray font-mono">排序:</span>
        {[
          { value: 'win_rate' as const, label: '胜率 ↓' },
          { value: 'roi' as const, label: 'ROI ↓' },
          { value: 'profit' as const, label: '盈利 ↓' },
          { value: 'volume' as const, label: '交易量 ↓' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              sortBy === option.value
                ? "bg-neon-pink text-cyber-black"
                : "bg-cyber-darker text-dim-white border border-cyber-border hover:border-neon-pink/30"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredTraders.map((trader) => (
          <TraderCard key={trader.address} trader={trader} />
        ))}
      </div>
    </div>
  )
}
