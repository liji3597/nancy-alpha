'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { polygon, polygonMumbai } from 'wagmi/chains'

/**
 * Network switcher component
 * Prompts users to switch to Polygon network if they're on a different chain
 */
export function NetworkSwitcher() {
    const chainId = useChainId()
    const { isConnected } = useAccount()
    const { switchChain, isPending } = useSwitchChain()

    // Don't show if not connected
    if (!isConnected) return null

    // Don't show if already on Polygon or Mumbai
    if (chainId === polygon.id || chainId === polygonMumbai.id) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
            <div className="glass-card border-2 border-warning p-4 shadow-glow-warning">
                <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-warning mb-1">错误的网络</h3>
                        <p className="text-sm text-base-gray-700 mb-3">
                            请切换到 Polygon 网络以使用预测市场功能
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => switchChain({ chainId: polygon.id })}
                                disabled={isPending}
                                className="btn-primary text-sm px-4 py-2"
                            >
                                {isPending ? '切换中...' : '切换到 Polygon'}
                            </button>
                            <button
                                onClick={() => switchChain({ chainId: polygonMumbai.id })}
                                disabled={isPending}
                                className="btn-secondary text-sm px-4 py-2"
                            >
                                {isPending ? '切换中...' : 'Mumbai 测试网'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
