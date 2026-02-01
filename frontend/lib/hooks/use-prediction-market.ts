import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { PREDICTION_MARKET_ABI } from '../contracts/prediction-market-abi'
import { getContractAddress } from '../contracts/addresses'
import { parseUnits } from 'viem'

/**
 * Hook to interact with the prediction market contract
 */
export function usePredictionMarket() {
    const { address } = useAccount()
    const chainId = useChainId()

    const marketAddress = getContractAddress(chainId, 'predictionMarket')

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
     * Place a bet on a market
     * @param marketId - The market ID
     * @param outcome - true for YES, false for NO
     * @param amount - Amount to bet (in token units, e.g., "100" for 100 USDC)
     * @param decimals - Token decimals (default: 6 for USDC)
     */
    const placeBet = async (
        marketId: number,
        outcome: boolean,
        amount: string,
        decimals: number = 6
    ) => {
        const amountBigInt = parseUnits(amount, decimals)

        writeContract({
            address: marketAddress,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'placeBet',
            args: [BigInt(marketId), outcome, amountBigInt],
        })
    }

    /**
     * Claim winnings from a resolved market
     * @param marketId - The market ID
     */
    const claimWinnings = async (marketId: number) => {
        writeContract({
            address: marketAddress,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'claimWinnings',
            args: [BigInt(marketId)],
        })
    }

    return {
        placeBet,
        claimWinnings,
        hash,
        isPending: isWritePending || isConfirming,
        isConfirming,
        isConfirmed,
        error: writeError || confirmError,
    }
}

/**
 * Hook to read market information
 * @param marketId - The market ID
 */
export function useMarketInfo(marketId: number | undefined) {
    const chainId = useChainId()
    const marketAddress = getContractAddress(chainId, 'predictionMarket')

    const { data, isLoading, refetch } = useReadContract({
        address: marketAddress,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'getMarketInfo',
        args: marketId !== undefined ? [BigInt(marketId)] : undefined,
        query: {
            enabled: marketId !== undefined,
        },
    })

    return {
        marketInfo: data as any,
        isLoading,
        refetch,
    }
}

/**
 * Hook to read user's position in a market
 * @param marketId - The market ID
 */
export function useUserPosition(marketId: number | undefined) {
    const { address } = useAccount()
    const chainId = useChainId()
    const marketAddress = getContractAddress(chainId, 'predictionMarket')

    const { data, isLoading, refetch } = useReadContract({
        address: marketAddress,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'getUserPosition',
        args: marketId !== undefined && address ? [BigInt(marketId), address] : undefined,
        query: {
            enabled: marketId !== undefined && !!address,
        },
    })

    return {
        position: data as any,
        isLoading,
        refetch,
    }
}

/**
 * Hook to read all user's bets
 */
export function useUserBets() {
    const { address } = useAccount()
    const chainId = useChainId()
    const marketAddress = getContractAddress(chainId, 'predictionMarket')

    const { data, isLoading, refetch } = useReadContract({
        address: marketAddress,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'getUserBets',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    return {
        bets: data as bigint[] | undefined,
        isLoading,
        refetch,
    }
}
