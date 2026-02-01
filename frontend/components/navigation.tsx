'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, TrendingUp, Users, Star, Bell, Zap } from 'lucide-react'
import { WalletConnect } from './wallet-connect'

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: Home, memeLabel: 'Dashboard' },
  { href: '/markets', label: '市场', icon: TrendingUp, memeLabel: 'Alpha' },
  { href: '/traders', label: '交易员', icon: Users, memeLabel: 'Traders' },
  { href: '/following', label: '抄作业', icon: Star, memeLabel: 'Copy' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* 左侧垂直导航栏 - Cyberpunk Terminal Style */}
      <aside className="fixed left-0 top-0 h-screen w-56 cyber-card border-r border-cyber-border flex flex-col z-50 rounded-none">
        {/* Logo */}
        <div className="p-5 border-b border-cyber-border">
          <Link href="/dashboard" className="flex flex-col gap-1 transition-smooth-fast hover:opacity-80 group">
            <div className="flex items-center gap-3">
              {/* Glowing Logo Icon */}
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center glow-cyan">
                  <Zap className="w-5 h-5 text-cyber-black" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-neon-green rounded-full pulse-dot" />
              </div>
              <div>
                <span className="text-lg font-bold gradient-text tracking-wide">NANCY'S</span>
                <span className="text-lg font-bold text-neon-cyan ml-1">α</span>
              </div>
            </div>
            <span className="text-[9px] text-dim-gray font-mono group-hover:text-neon-green transition-colors">
              // 南希严选 v2.0
            </span>
          </Link>
        </div>

        {/* CIA Connection Status */}
        <div className="px-3 py-2.5 mx-3 mt-3 rounded-lg bg-cyber-darker border border-cyber-border">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-dot" />
            <span className="text-[9px] font-mono text-neon-green cia-typing">
              Connecting to CIA server
            </span>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-3 mt-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "nav-active"
                      : "text-dim-white hover:bg-cyber-gray hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 transition-all",
                    isActive ? "text-neon-cyan" : "group-hover:text-neon-green"
                  )} />
                  <div className="flex flex-col">
                    <span className="text-sm">{item.label}</span>
                    <span className={cn(
                      "text-[9px] font-mono",
                      isActive ? "text-neon-cyan/60" : "text-dim-gray"
                    )}>
                      /{item.memeLabel}
                    </span>
                  </div>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-cyan pulse-dot" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Meme Easter Egg */}
          <div className="mt-4 p-2.5 rounded-lg bg-cyber-darker border border-dashed border-cyber-border">
            <div className="text-[9px] text-dim-gray font-mono text-center">
              <span className="text-neon-pink">💎</span> "Trust me bro" <span className="text-neon-pink">💎</span>
            </div>
          </div>
        </nav>

        {/* 连接钱包按钮 */}
        <div className="p-3 border-t border-cyber-border">
          <WalletConnect />
        </div>

        {/* Footer Meme */}
        <div className="px-3 pb-3">
          <div className="text-[8px] text-dim-gray font-mono text-center leading-relaxed">
            Not financial advice™
            <br />
            DYOR or copy Nancy 🤷‍♀️
          </div>
        </div>
      </aside>

      {/* 右上角状态栏 - 整合通知和实时状态 */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {/* Live Status */}
        <div className="cyber-card px-3 py-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-neon-green pulse-dot"></div>
          <span className="text-[10px] text-dim-gray font-mono">Live</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2.5 cyber-card hover:border-neon-cyan/50 transition-all duration-300 group">
          <Bell className="h-4 w-4 text-dim-white group-hover:text-neon-cyan transition-colors" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-neon-red rounded-full flex items-center justify-center text-white text-[10px] font-bold glow-red">
            3
          </span>
        </button>
      </div>
    </>
  )
}
