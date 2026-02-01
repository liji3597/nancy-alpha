import { NextResponse } from 'next/server'
import {
  mockMarkets,
  mockTraders,
  mockAlerts,
  mockSentimentData,
  mockOrderbook,
  mockTrades,
} from '@/lib/mock-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  switch (type) {
    case 'markets':
      return NextResponse.json({ markets: mockMarkets })
    case 'traders':
      return NextResponse.json({ traders: mockTraders })
    case 'alerts':
      return NextResponse.json({ alerts: mockAlerts })
    case 'sentiment':
      return NextResponse.json({ sentiment: mockSentimentData })
    case 'orderbook':
      return NextResponse.json(mockOrderbook)
    case 'trades':
      return NextResponse.json({ trades: mockTrades })
    default:
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
}
