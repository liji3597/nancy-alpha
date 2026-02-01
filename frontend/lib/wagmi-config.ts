import { http, createConfig } from 'wagmi'
import { polygon, polygonMumbai } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// WalletConnect Project ID - Get your own from cloud.walletconnect.com
// For now, we'll use injected wallets (MetaMask) which don't require a project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

export const config = createConfig({
    chains: [polygon, polygonMumbai],
    connectors: [
        injected(),
        // Only include WalletConnect if we have a valid project ID
        ...(projectId && projectId !== 'YOUR_PROJECT_ID'
            ? [walletConnect({ projectId })]
            : []
        ),
        coinbaseWallet({
            appName: 'Poli - Political Prediction Market',
            appLogoUrl: 'https://poli.market/logo.png',
        }),
    ],
    transports: {
        [polygon.id]: http('https://polygon-rpc.com'),
        [polygonMumbai.id]: http('https://rpc-mumbai.maticvigil.com'),
    },
})

declare module 'wagmi' {
    interface Register {
        config: typeof config
    }
}
