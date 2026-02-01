import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20_ABI } from '../contracts/erc20-abi'
import { parseUnits } from 'viem'

/**
 * Hook to approve ERC20 token spending
 * @returns Object with approve function and transaction state
 */
export function useTokenApproval() {
    const [isPending, setIsPending] = useState(false)

    const {
        writeContract,
        data: hash,
        error: writeError,
        isPending: isWritePending
    } = useWriteContract()

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: confirmError
    } = useWaitForTransactionReceipt({
        hash,
    })

    /**
     * Approve token spending
     * @param tokenAddress - The ERC20 token contract address
     * @param spenderAddress - The address that will be allowed to spend tokens
     * @param amount - Amount to approve (in token units, e.g., "100" for 100 USDC)
     * @param decimals - Token decimals (default: 6 for USDC)
     */
    const approve = async (
        tokenAddress: `0x${string}`,
        spenderAddress: `0x${string}`,
        amount: string,
        decimals: number = 6
    ) => {
        try {
            setIsPending(true)
            const amountBigInt = parseUnits(amount, decimals)

            writeContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [spenderAddress, amountBigInt],
            })
        } catch (error) {
            console.error('Approval error:', error)
            setIsPending(false)
            throw error
        }
    }

    /**
     * Approve maximum amount (useful for one-time approval)
     */
    const approveMax = async (
        tokenAddress: `0x${string}`,
        spenderAddress: `0x${string}`
    ) => {
        try {
            setIsPending(true)
            const maxAmount = 2n ** 256n - 1n // Max uint256

            writeContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [spenderAddress, maxAmount],
            })
        } catch (error) {
            console.error('Approval error:', error)
            setIsPending(false)
            throw error
        }
    }

    // Reset pending state when transaction is confirmed or fails
    if (isConfirmed || writeError || confirmError) {
        if (isPending) {
            setIsPending(false)
        }
    }

    return {
        approve,
        approveMax,
        hash,
        isPending: isPending || isWritePending || isConfirming,
        isConfirming,
        isConfirmed,
        error: writeError || confirmError,
    }
}
