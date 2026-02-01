'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { useChainId } from 'wagmi'
import { useTokenBalance } from '@/lib/hooks/use-token-balance'
import { getContractAddress, DEFAULT_TOKEN } from '@/lib/contracts/addresses'
import { Wallet, AlertTriangle } from 'lucide-react'

export function WalletConnect() {
  const chainId = useChainId()

  // Get USDC balance
  let tokenAddress: `0x${string}` | undefined
  try {
    tokenAddress = getContractAddress(chainId, DEFAULT_TOKEN)
  } catch {
    // Chain not supported, tokenAddress stays undefined
  }

  const { formattedBalance } = useTokenBalance(tokenAddress)

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className="w-full"
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-green text-cyber-black font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 glow-cyan"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="w-full py-3 rounded-lg bg-neon-red/20 border border-neon-red/50 text-neon-red font-medium text-sm hover:bg-neon-red/30 transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Wrong Network
                  </button>
                )
              }

              return (
                <div className="space-y-2 w-full">
                  {/* Balance display */}
                  {tokenAddress && (
                    <div className="rounded-lg bg-cyber-darker border border-cyber-border p-3">
                      <div className="text-[10px] text-dim-gray font-mono mb-1">USDC Balance</div>
                      <div className="text-lg font-bold text-neon-green font-mono">
                        ${parseFloat(formattedBalance).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Network button */}
                  <button
                    onClick={openChainModal}
                    className="w-full py-2 rounded-lg bg-cyber-darker border border-cyber-border hover:border-neon-cyan/30 transition-all flex items-center justify-start px-3 gap-2"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 18, height: 18 }}
                          />
                        )}
                      </div>
                    )}
                    <span className="text-xs text-dim-white font-mono">{chain.name}</span>
                  </button>

                  {/* Account button */}
                  <button
                    onClick={openAccountModal}
                    className="w-full py-2 rounded-lg bg-cyber-darker border border-cyber-border hover:border-neon-cyan/30 transition-all text-xs text-neon-cyan font-mono"
                  >
                    {account.displayName}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
