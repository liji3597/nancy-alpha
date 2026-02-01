import { useAccount, useReadContract, useBlockNumber } from 'wagmi'
import { ERC20_ABI } from '../contracts/erc20-abi'
import { formatUnits } from 'viem'

/**
 * Hook to read ERC20 token balance for the connected wallet
 * @param tokenAddress - The ERC20 token contract address
 * @param decimals - Token decimals (default: 6 for USDC)
 * @returns Object with balance, formatted balance, and loading state
 */
export function useTokenBalance(
    tokenAddress: `0x${string}` | undefined,
    decimals: number = 6
) {
    const { address } = useAccount()
    const { data: blockNumber } = useBlockNumber({ watch: true })

    const { data: balance, isLoading, refetch } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && !!tokenAddress,
            // Refetch when block number changes
            refetchInterval: false,
        },
    })

    // Refetch when block number changes
    if (blockNumber) {
        refetch()
    }

    const formattedBalance = balance ? formatUnits(balance, decimals) : '0'

    return {
        balance: balance || 0n,
        formattedBalance,
        isLoading,
        refetch,
    }
}

/**
 * Hook to read token allowance
 * @param tokenAddress - The ERC20 token contract address
 * @param spenderAddress - The address that can spend tokens (e.g., prediction market contract)
 * @param decimals - Token decimals (default: 6 for USDC)
 * @returns Object with allowance, formatted allowance, and loading state
 */
export function useTokenAllowance(
    tokenAddress: `0x${string}` | undefined,
    spenderAddress: `0x${string}` | undefined,
    decimals: number = 6
) {
    const { address } = useAccount()

    const { data: allowance, isLoading, refetch } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: address && spenderAddress ? [address, spenderAddress] : undefined,
        query: {
            enabled: !!address && !!tokenAddress && !!spenderAddress,
        },
    })

    const formattedAllowance = allowance ? formatUnits(allowance, decimals) : '0'

    return {
        allowance: allowance || 0n,
        formattedAllowance,
        isLoading,
        refetch,
        hasAllowance: (amount: bigint) => (allowance || 0n) >= amount,
    }
}

/**
 * Hook to read token metadata (name, symbol, decimals)
 * @param tokenAddress - The ERC20 token contract address
 * @returns Object with token metadata
 */
export function useTokenInfo(tokenAddress: `0x${string}` | undefined) {
    const { data: name } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'name',
        query: { enabled: !!tokenAddress },
    })

    const { data: symbol } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
        query: { enabled: !!tokenAddress },
    })

    const { data: decimals } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
        query: { enabled: !!tokenAddress },
    })

    return {
        name: name as string | undefined,
        symbol: symbol as string | undefined,
        decimals: decimals as number | undefined,
    }
}
