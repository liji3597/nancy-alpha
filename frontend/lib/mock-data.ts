import { formatAddress, getTagEmoji } from './utils'

export interface Market {
  id: number
  slug: string
  title: string
  category: 'politics' | 'geopolitics'
  subcategory: string
  currentPrice: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  status: 'active' | 'resolved' | 'closed'
  endDate: Date
  priceHistory7d: { timestamp: Date; price: number }[]
  yesPrice: number
  noPrice: number
}

export interface TraderProfile {
  address: string
  shortAddress: string
  tags: string[]
  winRate: number
  winRate7d: number
  winRate30d: number
  roi: number
  totalProfit: number
  totalTrades: number
  totalVolume: number
  expertise: {
    category: string
    winRate: number
    trades: number
  }[]
  recentPerformance: {
    period: string
    status: 'good' | 'warning' | 'bad'
    message: string
  }
  aiReview: string
  lastActive: Date
  joinedAt: Date
}

export interface Alert {
  id: string
  type: 'whale_trade' | 'reverse_indicator' | 'follower_activity' | 'market_surge'
  icon: string
  message: string
  timestamp: Date
  link: string
}

export interface SentimentData {
  date: string
  bullish: number
  bearish: number
  volume: number
}

// Seeded random number generator for deterministic mock data
// This ensures server and client render the same data
function seededRandom(seed: number) {
  let state = seed
  return function () {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

// Create a global seeded random instance
const mockRandom = seededRandom(12345)

// Helper function to generate random address
const generateAddress = (seed: number) => {
  return '0x' + seed.toString(16).padStart(40, '0')
}

// 模拟市场数据 - 30条涵盖主要国家政治选举
export const mockMarkets: Market[] = [
  // 美国
  {
    id: 1,
    slug: 'us-election-2024',
    title: '2024年美国总统大选 - 共和党获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.52,
    priceChange24h: 5.2,
    volume24h: 1250000,
    liquidity: 85,
    status: 'active',
    endDate: new Date('2024-11-05'),
    yesPrice: 0.52,
    noPrice: 0.48,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.45 + i * 0.01 + mockRandom() * 0.03,
    })),
  },
  {
    id: 2,
    slug: 'us-senate-2024',
    title: '2024美国参议院选举 - 民主党保持多数',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.48,
    priceChange24h: -2.1,
    volume24h: 680000,
    liquidity: 72,
    status: 'active',
    endDate: new Date('2024-11-05'),
    yesPrice: 0.48,
    noPrice: 0.52,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.50 - i * 0.003 + mockRandom() * 0.02,
    })),
  },
  {
    id: 3,
    slug: 'fed-rate-decision-march',
    title: '美联储2024年3月降息',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.35,
    priceChange24h: -8.5,
    volume24h: 890000,
    liquidity: 72,
    status: 'active',
    endDate: new Date('2024-03-20'),
    yesPrice: 0.35,
    noPrice: 0.65,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.42 - i * 0.01 + mockRandom() * 0.02,
    })),
  },

  // 中国台湾
  {
    id: 4,
    slug: 'taiwan-election-2024',
    title: '台湾2024年大选 - 民进党连任',
    category: 'geopolitics',
    subcategory: '地缘政治',
    currentPrice: 0.68,
    priceChange24h: 12.3,
    volume24h: 2100000,
    liquidity: 91,
    status: 'active',
    endDate: new Date('2024-01-13'),
    yesPrice: 0.68,
    noPrice: 0.32,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.55 + i * 0.02 + mockRandom() * 0.02,
    })),
  },

  // 英国
  {
    id: 5,
    slug: 'uk-election-2024',
    title: '2024年英国大选 - 工党获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.72,
    priceChange24h: 8.5,
    volume24h: 950000,
    liquidity: 78,
    status: 'active',
    endDate: new Date('2024-12-31'),
    yesPrice: 0.72,
    noPrice: 0.28,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.65 + i * 0.01 + mockRandom() * 0.02,
    })),
  },
  {
    id: 6,
    slug: 'uk-brexit-referendum',
    title: '英国重新加入欧盟公投',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.22,
    priceChange24h: -5.3,
    volume24h: 420000,
    liquidity: 65,
    status: 'active',
    endDate: new Date('2025-06-30'),
    yesPrice: 0.22,
    noPrice: 0.78,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.25 - i * 0.005 + mockRandom() * 0.01,
    })),
  },

  // 法国
  {
    id: 7,
    slug: 'france-election-2027',
    title: '2027年法国总统选举 - 马克龙连任',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.38,
    priceChange24h: 3.2,
    volume24h: 580000,
    liquidity: 70,
    status: 'active',
    endDate: new Date('2027-05-10'),
    yesPrice: 0.38,
    noPrice: 0.62,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.35 + i * 0.005 + mockRandom() * 0.02,
    })),
  },
  {
    id: 8,
    slug: 'france-pension-reform',
    title: '法国养老金改革法案通过',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.55,
    priceChange24h: 6.8,
    volume24h: 320000,
    liquidity: 62,
    status: 'active',
    endDate: new Date('2024-06-30'),
    yesPrice: 0.55,
    noPrice: 0.45,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.48 + i * 0.01 + mockRandom() * 0.02,
    })),
  },

  // 德国
  {
    id: 9,
    slug: 'germany-election-2025',
    title: '2025年德国联邦议院选举 - CDU/CSU获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.61,
    priceChange24h: 4.5,
    volume24h: 720000,
    liquidity: 75,
    status: 'active',
    endDate: new Date('2025-09-26'),
    yesPrice: 0.61,
    noPrice: 0.39,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.57 + i * 0.006 + mockRandom() * 0.02,
    })),
  },

  // 日本
  {
    id: 10,
    slug: 'japan-election-2024',
    title: '2024年日本众议院选举 - 自民党保持多数',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.70,
    priceChange24h: 2.8,
    volume24h: 540000,
    liquidity: 68,
    status: 'active',
    endDate: new Date('2024-10-31'),
    yesPrice: 0.70,
    noPrice: 0.30,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.68 + i * 0.003 + mockRandom() * 0.02,
    })),
  },

  // 韩国
  {
    id: 11,
    slug: 'south-korea-election-2027',
    title: '2027年韩国总统选举 - 在野党获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.56,
    priceChange24h: 7.2,
    volume24h: 480000,
    liquidity: 66,
    status: 'active',
    endDate: new Date('2027-03-09'),
    yesPrice: 0.56,
    noPrice: 0.44,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.50 + i * 0.009 + mockRandom() * 0.02,
    })),
  },

  // 印度
  {
    id: 12,
    slug: 'india-election-2024',
    title: '2024年印度大选 - 莫迪连任',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.78,
    priceChange24h: 5.6,
    volume24h: 1100000,
    liquidity: 82,
    status: 'active',
    endDate: new Date('2024-05-31'),
    yesPrice: 0.78,
    noPrice: 0.22,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.73 + i * 0.007 + mockRandom() * 0.02,
    })),
  },

  // 巴西
  {
    id: 13,
    slug: 'brazil-election-2026',
    title: '2026年巴西总统选举 - 卢拉连任',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.45,
    priceChange24h: -3.5,
    volume24h: 380000,
    liquidity: 58,
    status: 'active',
    endDate: new Date('2026-10-02'),
    yesPrice: 0.45,
    noPrice: 0.55,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.48 - i * 0.005 + mockRandom() * 0.02,
    })),
  },

  // 墨西哥
  {
    id: 14,
    slug: 'mexico-election-2024',
    title: '2024年墨西哥总统选举 - 女性候选人获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.82,
    priceChange24h: 9.3,
    volume24h: 620000,
    liquidity: 74,
    status: 'active',
    endDate: new Date('2024-06-02'),
    yesPrice: 0.82,
    noPrice: 0.18,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.75 + i * 0.01 + mockRandom() * 0.02,
    })),
  },

  // 澳大利亚
  {
    id: 15,
    slug: 'australia-election-2025',
    title: '2025年澳大利亚联邦选举 - 工党连任',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.58,
    priceChange24h: 4.2,
    volume24h: 450000,
    liquidity: 64,
    status: 'active',
    endDate: new Date('2025-05-31'),
    yesPrice: 0.58,
    noPrice: 0.42,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.54 + i * 0.006 + mockRandom() * 0.02,
    })),
  },

  // 加拿大
  {
    id: 16,
    slug: 'canada-election-2025',
    title: '2025年加拿大联邦选举 - 保守党获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.63,
    priceChange24h: 6.7,
    volume24h: 520000,
    liquidity: 69,
    status: 'active',
    endDate: new Date('2025-10-20'),
    yesPrice: 0.63,
    noPrice: 0.37,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.57 + i * 0.009 + mockRandom() * 0.02,
    })),
  },

  // 意大利
  {
    id: 17,
    slug: 'italy-election-2027',
    title: '2027年意大利议会选举 - 右翼联盟获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.67,
    priceChange24h: 5.1,
    volume24h: 410000,
    liquidity: 61,
    status: 'active',
    endDate: new Date('2027-03-31'),
    yesPrice: 0.67,
    noPrice: 0.33,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.62 + i * 0.007 + mockRandom() * 0.02,
    })),
  },

  // 西班牙
  {
    id: 18,
    slug: 'spain-election-2027',
    title: '2027年西班牙大选 - 社会党获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.51,
    priceChange24h: 2.3,
    volume24h: 360000,
    liquidity: 59,
    status: 'active',
    endDate: new Date('2027-12-31'),
    yesPrice: 0.51,
    noPrice: 0.49,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.49 + i * 0.003 + mockRandom() * 0.02,
    })),
  },

  // 荷兰
  {
    id: 19,
    slug: 'netherlands-election-2025',
    title: '2025年荷兰议会选举 - 中右翼联盟获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.59,
    priceChange24h: 3.8,
    volume24h: 290000,
    liquidity: 56,
    status: 'active',
    endDate: new Date('2025-03-17'),
    yesPrice: 0.59,
    noPrice: 0.41,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.55 + i * 0.006 + mockRandom() * 0.02,
    })),
  },

  // 波兰
  {
    id: 20,
    slug: 'poland-election-2025',
    title: '2025年波兰总统选举 - 反对派获胜',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.64,
    priceChange24h: 7.9,
    volume24h: 470000,
    liquidity: 67,
    status: 'active',
    endDate: new Date('2025-05-18'),
    yesPrice: 0.64,
    noPrice: 0.36,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.57 + i * 0.01 + mockRandom() * 0.02,
    })),
  },

  // 土耳其
  {
    id: 21,
    slug: 'turkey-election-2028',
    title: '2028年土耳其总统选举 - 埃尔多安连任',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.42,
    priceChange24h: -4.2,
    volume24h: 550000,
    liquidity: 71,
    status: 'active',
    endDate: new Date('2028-05-14'),
    yesPrice: 0.42,
    noPrice: 0.58,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.46 - i * 0.006 + mockRandom() * 0.02,
    })),
  },

  // 以色列
  {
    id: 22,
    slug: 'israel-election-2024',
    title: '2024年以色列议会选举 - 内塔尼亚胡连任',
    category: 'geopolitics',
    subcategory: '地缘政治',
    currentPrice: 0.53,
    priceChange24h: 1.8,
    volume24h: 680000,
    liquidity: 73,
    status: 'active',
    endDate: new Date('2024-11-05'),
    yesPrice: 0.53,
    noPrice: 0.47,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.51 + i * 0.003 + mockRandom() * 0.02,
    })),
  },

  // 南非
  {
    id: 23,
    slug: 'south-africa-election-2024',
    title: '2024年南非大选 - ANC失去多数席位',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.71,
    priceChange24h: 8.4,
    volume24h: 390000,
    liquidity: 60,
    status: 'active',
    endDate: new Date('2024-05-29'),
    yesPrice: 0.71,
    noPrice: 0.29,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.64 + i * 0.01 + mockRandom() * 0.02,
    })),
  },

  // 阿根廷
  {
    id: 24,
    slug: 'argentina-election-2027',
    title: '2027年阿根廷总统选举 - 米莱连任',
    category: 'politics',
    subcategory: '国际政治',
    currentPrice: 0.47,
    priceChange24h: -2.9,
    volume24h: 320000,
    liquidity: 57,
    status: 'active',
    endDate: new Date('2027-10-24'),
    yesPrice: 0.47,
    noPrice: 0.53,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.50 - i * 0.004 + mockRandom() * 0.02,
    })),
  },

  // 地缘政治
  {
    id: 25,
    slug: 'ukraine-war-ends-2024',
    title: '乌克兰战争将在2024年结束',
    category: 'geopolitics',
    subcategory: '地缘政治',
    currentPrice: 0.18,
    priceChange24h: -3.2,
    volume24h: 456000,
    liquidity: 58,
    status: 'active',
    endDate: new Date('2024-12-31'),
    yesPrice: 0.18,
    noPrice: 0.82,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.20 - i * 0.003 + mockRandom() * 0.01,
    })),
  },
  {
    id: 26,
    slug: 'china-taiwan-conflict-2024',
    title: '2024年中国大陆与台湾发生军事冲突',
    category: 'geopolitics',
    subcategory: '地缘政治',
    currentPrice: 0.12,
    priceChange24h: -1.5,
    volume24h: 890000,
    liquidity: 76,
    status: 'active',
    endDate: new Date('2024-12-31'),
    yesPrice: 0.12,
    noPrice: 0.88,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.14 - i * 0.003 + mockRandom() * 0.01,
    })),
  },
  {
    id: 27,
    slug: 'israel-palestine-ceasefire',
    title: '以色列-巴勒斯坦在2024年达成永久停火',
    category: 'geopolitics',
    subcategory: '地缘政治',
    currentPrice: 0.25,
    priceChange24h: 4.6,
    volume24h: 720000,
    liquidity: 69,
    status: 'active',
    endDate: new Date('2024-12-31'),
    yesPrice: 0.25,
    noPrice: 0.75,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.21 + i * 0.006 + mockRandom() * 0.01,
    })),
  },
  {
    id: 28,
    slug: 'north-korea-nuclear-test',
    title: '朝鲜在2024年进行核试验',
    category: 'geopolitics',
    subcategory: '地缘政治',
    currentPrice: 0.34,
    priceChange24h: 2.1,
    volume24h: 410000,
    liquidity: 63,
    status: 'active',
    endDate: new Date('2024-12-31'),
    yesPrice: 0.34,
    noPrice: 0.66,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.32 + i * 0.003 + mockRandom() * 0.01,
    })),
  },
  {
    id: 29,
    slug: 'iran-nuclear-deal',
    title: '伊朗与西方国家达成新核协议',
    category: 'geopolitics',
    subcategory: '地缘政治',
    currentPrice: 0.29,
    priceChange24h: -5.8,
    volume24h: 530000,
    liquidity: 68,
    status: 'active',
    endDate: new Date('2025-06-30'),
    yesPrice: 0.29,
    noPrice: 0.71,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.33 - i * 0.006 + mockRandom() * 0.01,
    })),
  },
  {
    id: 30,
    slug: 'venezuela-regime-change',
    title: '委内瑞拉2024年政权更迭',
    category: 'geopolitics',
    subcategory: '地缘政治',
    currentPrice: 0.41,
    priceChange24h: 6.3,
    volume24h: 350000,
    liquidity: 55,
    status: 'active',
    endDate: new Date('2024-12-31'),
    yesPrice: 0.41,
    noPrice: 0.59,
    priceHistory7d: Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      price: 0.36 + i * 0.007 + mockRandom() * 0.01,
    })),
  },
]

// 模拟交易者数据 - 40条包含三种标签类型
export const mockTraders: TraderProfile[] = [
  // 聪明钱类型 (15个)
  ...Array.from({ length: 15 }, (_, i) => {
    const winRate = 70 + mockRandom() * 20
    const roi = 50 + mockRandom() * 150
    const totalProfit = 30000 + mockRandom() * 200000
    const address = generateAddress(i + 1)

    return {
      address,
      shortAddress: formatAddress(address),
      tags: i < 5 ? ['聪明钱', '巨鲸', '早鸟'] : i < 10 ? ['聪明钱', '神算子'] : ['聪明钱', '早鸟'],
      winRate: Math.round(winRate),
      winRate7d: Math.round(winRate + (mockRandom() - 0.5) * 10),
      winRate30d: Math.round(winRate + (mockRandom() - 0.5) * 5),
      roi: Math.round(roi),
      totalProfit: Math.round(totalProfit),
      totalTrades: Math.round(50 + mockRandom() * 300),
      totalVolume: Math.round(100000 + mockRandom() * 1000000),
      expertise: [
        { category: '国际政治', winRate: Math.round(winRate + (mockRandom() - 0.5) * 15), trades: Math.round(20 + mockRandom() * 80) },
        { category: '地缘政治', winRate: Math.round(winRate + (mockRandom() - 0.5) * 15), trades: Math.round(15 + mockRandom() * 60) },
      ],
      recentPerformance: {
        period: '7d',
        status: 'good' as const,
        message: `近期表现${['稳定', '优秀', '出色'][Math.floor(mockRandom() * 3)]}，连续${Math.floor(3 + mockRandom() * 8)}笔盈利`,
      },
      aiReview: `该交易者擅长${['政治选举', '地缘冲突', '政策预测'][Math.floor(mockRandom() * 3)]}类市场，历史胜率${Math.round(winRate)}%。${['能提前布局', '善于捕捉机会', '风险控制优秀'][Math.floor(mockRandom() * 3)]}。建议跟单比例${30 + Math.floor(mockRandom() * 40)}%。`,
      lastActive: new Date(Date.now() - mockRandom() * 60 * 60 * 1000),
      joinedAt: new Date(Date.now() - (180 + mockRandom() * 365) * 24 * 60 * 60 * 1000),
    } as TraderProfile
  }),

  // 反向指标类型 (10个)
  ...Array.from({ length: 10 }, (_, i) => {
    const winRate = 15 + mockRandom() * 20
    const roi = -80 + mockRandom() * 60
    const totalProfit = -50000 + mockRandom() * 40000
    const address = generateAddress(i + 100)

    return {
      address,
      shortAddress: formatAddress(address),
      tags: ['反向指标'],
      winRate: Math.round(winRate),
      winRate7d: Math.round(winRate + (mockRandom() - 0.5) * 8),
      winRate30d: Math.round(winRate + (mockRandom() - 0.5) * 5),
      roi: Math.round(roi),
      totalProfit: Math.round(totalProfit),
      totalTrades: Math.round(40 + mockRandom() * 150),
      totalVolume: Math.round(30000 + mockRandom() * 200000),
      expertise: [
        { category: '国际政治', winRate: Math.round(winRate + (mockRandom() - 0.5) * 10), trades: Math.round(15 + mockRandom() * 50) },
        { category: '地缘政治', winRate: Math.round(winRate + (mockRandom() - 0.5) * 10), trades: Math.round(10 + mockRandom() * 40) },
      ],
      recentPerformance: {
        period: '7d',
        status: 'bad' as const,
        message: `连续亏损，近期胜率仅${Math.round(winRate)}%`,
      },
      aiReview: `典型的反向指标，买什么亏什么。建议反向操作，当该地址买入时考虑卖出。反向指标强度${60 + Math.floor(mockRandom() * 30)}/100，可靠性${['较高', '中等', '一般'][Math.floor(mockRandom() * 3)]}。`,
      lastActive: new Date(Date.now() - mockRandom() * 120 * 60 * 1000),
      joinedAt: new Date(Date.now() - (90 + mockRandom() * 300) * 24 * 60 * 60 * 1000),
    } as TraderProfile
  }),

  // 中坚力量类型 (15个)
  ...Array.from({ length: 15 }, (_, i) => {
    const winRate = 50 + mockRandom() * 20
    const roi = 10 + mockRandom() * 60
    const totalProfit = 10000 + mockRandom() * 80000
    const address = generateAddress(i + 200)

    return {
      address,
      shortAddress: formatAddress(address),
      tags: i < 8 ? ['巨鲸', '中坚力量'] : ['中坚力量'],
      winRate: Math.round(winRate),
      winRate7d: Math.round(winRate + (mockRandom() - 0.5) * 12),
      winRate30d: Math.round(winRate + (mockRandom() - 0.5) * 8),
      roi: Math.round(roi),
      totalProfit: Math.round(totalProfit),
      totalTrades: Math.round(30 + mockRandom() * 200),
      totalVolume: Math.round(50000 + mockRandom() * 800000),
      expertise: [
        { category: '国际政治', winRate: Math.round(winRate + (mockRandom() - 0.5) * 12), trades: Math.round(12 + mockRandom() * 60) },
        { category: '地缘政治', winRate: Math.round(winRate + (mockRandom() - 0.5) * 12), trades: Math.round(10 + mockRandom() * 50) },
      ],
      recentPerformance: {
        period: '7d',
        status: (winRate > 60 ? 'good' : 'warning') as 'good' | 'warning',
        message: `${['表现稳定', '略有波动', '持续改进'][Math.floor(mockRandom() * 3)]}，胜率${Math.round(winRate)}%`,
      },
      aiReview: `${i < 8 ? '大额' : ''}稳健型交易者，${i < 8 ? '单笔平均交易额较高，' : ''}胜率中等但盈利稳定。适合${['保守型', '稳健型', '平衡型'][Math.floor(mockRandom() * 3)]}跟单策略。建议跟单比例${20 + Math.floor(mockRandom() * 30)}%。`,
      lastActive: new Date(Date.now() - mockRandom() * 180 * 60 * 1000),
      joinedAt: new Date(Date.now() - (60 + mockRandom() * 400) * 24 * 60 * 60 * 1000),
    } as TraderProfile
  }),
]

// 模拟警报数据
export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'whale_trade',
    icon: '🐋',
    message: formatAddress(mockTraders[0].address) + ' 买入 "2024美国总统选举" $50,000 @0.62',
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    link: '/traders/' + mockTraders[0].address,
  },
  {
    id: '2',
    type: 'reverse_indicator',
    icon: '🔴',
    message: formatAddress(mockTraders[15].address) + ' 买入 "美联储降息" $10,000 @0.45',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    link: '/traders/' + mockTraders[15].address,
  },
  {
    id: '3',
    type: 'market_surge',
    icon: '📈',
    message: '"台湾选举" 价格暴涨12% 突破$0.68',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    link: '/markets/taiwan-election-2024',
  },
  {
    id: '4',
    type: 'follower_activity',
    icon: '⭐',
    message: '你关注的' + formatAddress(mockTraders[4].address) + ' 卖出 "油价预测" $8,000 @0.52',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    link: '/traders/' + mockTraders[4].address,
  },
]

// 模拟情绪数据
export const mockSentimentData: SentimentData[] = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  bullish: 45 + mockRandom() * 25,
  bearish: 30 + mockRandom() * 20,
  volume: 500000 + mockRandom() * 1000000,
}))

// 模拟订单簿数据
export const mockOrderbook = {
  bids: Array.from({ length: 10 }, (_, i) => ({
    price: 0.50 - i * 0.01,
    size: 10000 + mockRandom() * 50000,
  })),
  asks: Array.from({ length: 10 }, (_, i) => ({
    price: 0.51 + i * 0.01,
    size: 10000 + mockRandom() * 50000,
  })),
}

// 模拟交易历史数据
export const mockTrades = Array.from({ length: 20 }, (_, i) => ({
  txHash: '0x' + mockRandom().toString(16).slice(2, 66),
  maker: '0x' + mockRandom().toString(16).slice(2, 42),
  taker: '0x' + mockRandom().toString(16).slice(2, 42),
  outcome: mockRandom() > 0.5 ? 'YES' : 'NO',
  side: mockRandom() > 0.5 ? 'BUY' : 'SELL',
  price: 0.45 + mockRandom() * 0.1,
  size: 100 + mockRandom() * 10000,
  timestamp: new Date(Date.now() - i * 30000),
}))
