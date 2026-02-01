'use client'

import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useTokenBalance, useTokenAllowance } from '@/lib/hooks/use-token-balance'
import { useTokenApproval } from '@/lib/hooks/use-token-approval'
import { usePredictionMarket } from '@/lib/hooks/use-prediction-market'
import { getContractAddress, DEFAULT_TOKEN } from '@/lib/contracts/addresses'
import { parseUnits, formatUnits } from 'viem'

interface BetFormProps {
    marketId: number
    marketTitle: string
    yesPrice: number
    noPrice: number
    onSuccess?: () => void
}

export function BetForm({ marketId, marketTitle, yesPrice, noPrice, onSuccess }: BetFormProps) {
    const { address, isConnected } = useAccount()
    const chainId = useChainId()

    const [outcome, setOutcome] = useState<'yes' | 'no'>('yes')
    const [amount, setAmount] = useState('')
    const [step, setStep] = useState<'input' | 'approve' | 'bet'>('input')

    // Get contract addresses
    const tokenAddress = getContractAddress(chainId, DEFAULT_TOKEN)
    const marketAddress = getContractAddress(chainId, 'predictionMarket')

    // Hooks
    const { balance, formattedBalance } = useTokenBalance(tokenAddress)
    const { allowance, hasAllowance, refetch: refetchAllowance } = useTokenAllowance(
        tokenAddress,
        marketAddress
    )
    const { approveMax, isPending: isApproving, isConfirmed: isApproved } = useTokenApproval()
    const { placeBet, isPending: isBetting, isConfirmed: isBetConfirmed, error: betError } = usePredictionMarket()

    // Calculate potential winnings
    const calculatePotentialWinnings = () => {
        if (!amount || isNaN(parseFloat(amount))) return '0'
        const betAmount = parseFloat(amount)
        const price = outcome === 'yes' ? yesPrice : noPrice
        const potentialReturn = betAmount / price
        return potentialReturn.toFixed(2)
    }

    // Handle approve
    const handleApprove = async () => {
        try {
            setStep('approve')
            await approveMax(tokenAddress, marketAddress)
        } catch (error) {
            console.error('Approval failed:', error)
            setStep('input')
        }
    }

    // Handle bet
    const handleBet = async () => {
        if (!amount || parseFloat(amount) <= 0) return

        try {
            setStep('bet')
            await placeBet(marketId, outcome === 'yes', amount)
        } catch (error) {
            console.error('Bet failed:', error)
            setStep('input')
        }
    }

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isConnected || !amount || parseFloat(amount) <= 0) return

        const amountBigInt = parseUnits(amount, 6) // USDC has 6 decimals

        // Check if approval is needed
        if (!hasAllowance(amountBigInt)) {
            await handleApprove()
        } else {
            await handleBet()
        }
    }

    // Reset form after successful bet
    if (isBetConfirmed && step === 'bet') {
        setAmount('')
        setStep('input')
        refetchAllowance()
        if (onSuccess) onSuccess()
    }

    // Auto-proceed to bet after approval
    if (isApproved && step === 'approve') {
        handleBet()
    }

    if (!isConnected) {
        return (
            <div className="glass-card p-6 text-center">
                <p className="text-base-gray-700">请先连接钱包以进行下注</p>
            </div>
        )
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">下注</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Outcome selection */}
                <div>
                    <label className="block text-sm font-medium mb-2">选择结果</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setOutcome('yes')}
                            className={`p-4 rounded-lg border-2 transition-smooth-fast ${outcome === 'yes'
                                    ? 'border-success bg-success/10 text-success'
                                    : 'border-base-gray-800 hover:border-base-gray-700'
                                }`}
                        >
                            <div className="text-2xl font-bold">YES</div>
                            <div className="text-sm opacity-70">${yesPrice.toFixed(2)}</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setOutcome('no')}
                            className={`p-4 rounded-lg border-2 transition-smooth-fast ${outcome === 'no'
                                    ? 'border-error bg-error/10 text-error'
                                    : 'border-base-gray-800 hover:border-base-gray-700'
                                }`}
                        >
                            <div className="text-2xl font-bold">NO</div>
                            <div className="text-sm opacity-70">${noPrice.toFixed(2)}</div>
                        </button>
                    </div>
                </div>

                {/* Amount input */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        下注金额 (USDC)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            max={formattedBalance}
                            className="w-full bg-base-gray-900 border border-base-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-smooth-fast"
                        />
                        <button
                            type="button"
                            onClick={() => setAmount(formattedBalance)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary-light"
                        >
                            最大
                        </button>
                    </div>
                    <div className="text-xs text-base-gray-700 mt-1">
                        余额: {parseFloat(formattedBalance).toFixed(2)} USDC
                    </div>
                </div>

                {/* Potential winnings */}
                {amount && parseFloat(amount) > 0 && (
                    <div className="glass-card-inner p-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-base-gray-700">预期收益</span>
                            <span className="font-bold">{calculatePotentialWinnings()} USDC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-base-gray-700">潜在回报率</span>
                            <span className="font-bold text-success">
                                {((parseFloat(calculatePotentialWinnings()) / parseFloat(amount) - 1) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {betError && (
                    <div className="text-sm text-error bg-error/10 border border-error rounded-lg p-3">
                        下注失败: {betError.message}
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={
                        !amount ||
                        parseFloat(amount) <= 0 ||
                        parseFloat(amount) > parseFloat(formattedBalance) ||
                        isApproving ||
                        isBetting
                    }
                    className="btn-primary w-full py-3"
                >
                    {isApproving && '授权中...'}
                    {isBetting && '下注中...'}
                    {!isApproving && !isBetting && (
                        hasAllowance(parseUnits(amount || '0', 6)) ? '确认下注' : '授权并下注'
                    )}
                </button>

                {/* Status message */}
                {(isApproving || isBetting) && (
                    <div className="text-sm text-center text-base-gray-700">
                        {isApproving && '正在授权 USDC...'}
                        {isBetting && '正在提交下注交易...'}
                    </div>
                )}
            </form>
        </div>
    )
}
