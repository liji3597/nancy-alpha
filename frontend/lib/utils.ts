import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toFixed(2)
}

export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatTimeAgo(date: Date | string | number | null | undefined): string {
  if (!date) return ''
  const now = new Date()
  let past: Date
  if (typeof date === 'number') {
    past = new Date(date)
  } else if (typeof date === 'string') {
    past = new Date(date)
  } else {
    past = date
  }

  // 检查日期是否有效
  if (isNaN(past.getTime())) return ''

  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (seconds < 60) return `${seconds}秒前`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`
  return past.toLocaleDateString()
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const TAG_EMOJIS: Record<string, string> = {
  '聪明钱': '🧠',
  '巨鲸': '🐋',
  '反向指标': '🔴',
  '早鸟': '🐦',
  '神算子': '🎯',
  '套利者': '💰',
  '机器人': '🤖',
  '中坚力量': '💪',
  '小试牛刀': '🦐',
  '疑似内幕者': '⚡',
  '对冲者': '⚖️',
}

export function getTagEmoji(tag: string): string {
  return TAG_EMOJIS[tag] || '🏷️'
}

export function getTagStyle(tag: string): string {
  const styles: Record<string, string> = {
    '聪明钱': 'bg-purple-900/50 text-purple-400 border-purple-500/30',
    '巨鲸': 'bg-cyan-900/50 text-cyan-400 border-cyan-500/30',
    '反向指标': 'bg-red-900/50 text-red-400 border-red-500/30',
    '早鸟': 'bg-green-900/50 text-green-400 border-green-500/30',
    '神算子': 'bg-yellow-900/50 text-yellow-400 border-yellow-500/30',
    '套利者': 'bg-blue-900/50 text-blue-400 border-blue-500/30',
    '机器人': 'bg-gray-700 text-gray-400 border-gray-600',
    '中坚力量': 'bg-indigo-900/50 text-indigo-400 border-indigo-500/30',
    '小试牛刀': 'bg-orange-900/50 text-orange-400 border-orange-500/30',
    '疑似内幕者': 'bg-pink-900/50 text-pink-400 border-pink-500/30',
    '对冲者': 'bg-teal-900/50 text-teal-400 border-teal-500/30',
  }
  return styles[tag] || 'bg-gray-700 text-gray-400 border-gray-600'
}
