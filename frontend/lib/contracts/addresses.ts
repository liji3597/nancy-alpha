// Contract addresses for Polygon networks
// Update these with your actual deployed contract addresses

export const CONTRACTS = {
    // Polygon Mainnet (Chain ID: 137)
    polygon: {
        // TODO: Replace with your actual prediction market contract address
        predictionMarket: '0x09205b94A76Ab65B52Eb9f653644fF9730632b7a',

        // Official Polygon USDC address (native USDC)
        usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',

        // Official Polygon USDT address
        usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',

        // Official Polygon DAI address
        dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    },

    // Polygon Mumbai Testnet (Chain ID: 80001)
    polygonMumbai: {
        // TODO: Replace with your testnet contract address
        predictionMarket: '0x0000000000000000000000000000000000000000',

        // Mumbai testnet USDC (you may need to deploy your own or use a faucet)
        usdc: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',

        // Mumbai testnet tokens (placeholder addresses - replace with actual testnet tokens)
        usdt: '0x0000000000000000000000000000000000000000',
        dai: '0x0000000000000000000000000000000000000000',
    },
} as const

// Helper function to get contract addresses for current chain
export function getContractAddress(
    chainId: number,
    contractName: keyof typeof CONTRACTS.polygon
): `0x${string}` {
    if (chainId === 137) {
        return CONTRACTS.polygon[contractName] as `0x${string}`
    } else if (chainId === 80001) {
        return CONTRACTS.polygonMumbai[contractName] as `0x${string}`
    }
    throw new Error(`Unsupported chain ID: ${chainId}`)
}

// Default token to use for betting (USDC)
export const DEFAULT_TOKEN = 'usdc' as const
