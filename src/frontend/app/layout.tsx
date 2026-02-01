import type { Metadata } from 'next'
import { Press_Start_2P } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/navigation'
import { NetworkSwitcher } from '@/components/network-switcher'
import { Providers } from '@/lib/providers'

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel'
})

export const metadata: Metadata = {
  title: "Nancy's Alpha - 南希严选 | 国会山望远镜",
  description: 'Connecting to CIA server... 追踪聪明钱，抄作业不迷路',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${pressStart2P.variable} bg-dark-bg`}>
        <Providers>
          {/* Particle Background Effect */}
          <div className="fixed inset-0 particle-bg pointer-events-none" />

          {/* Cyber Grid Background */}
          <div
            className="fixed inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />

          <div className="min-h-screen bg-dark-bg relative z-10">
            <Navigation />
            <NetworkSwitcher />
            <main className="ml-56 px-8 py-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
