// Prediction Market Contract ABI
// This is a simplified ABI for a prediction market contract
// Update this with your actual contract ABI

export const PREDICTION_MARKET_ABI = [
    // Read functions
    {
        inputs: [{ name: 'marketId', type: 'uint256' }],
        name: 'getMarketInfo',
        outputs: [
            { name: 'creator', type: 'address' },
            { name: 'question', type: 'string' },
            { name: 'endTime', type: 'uint256' },
            { name: 'resolved', type: 'bool' },
            { name: 'outcome', type: 'bool' },
            { name: 'totalYes', type: 'uint256' },
            { name: 'totalNo', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'marketId', type: 'uint256' },
            { name: 'user', type: 'address' },
        ],
        name: 'getUserPosition',
        outputs: [
            { name: 'yesAmount', type: 'uint256' },
            { name: 'noAmount', type: 'uint256' },
            { name: 'claimed', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getUserBets',
        outputs: [{ name: '', type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'marketId', type: 'uint256' },
            { name: 'user', type: 'address' },
        ],
        name: 'calculatePotentialWinnings',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    // Write functions
    {
        inputs: [
            { name: 'marketId', type: 'uint256' },
            { name: 'outcome', type: 'bool' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'placeBet',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'marketId', type: 'uint256' }],
        name: 'claimWinnings',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'question', type: 'string' },
            { name: 'endTime', type: 'uint256' },
        ],
        name: 'createMarket',
        outputs: [{ name: 'marketId', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'marketId', type: 'uint256' },
            { name: 'outcome', type: 'bool' },
        ],
        name: 'resolveMarket',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Events
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'marketId', type: 'uint256' },
            { indexed: false, name: 'question', type: 'string' },
            { indexed: false, name: 'endTime', type: 'uint256' },
        ],
        name: 'MarketCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'marketId', type: 'uint256' },
            { indexed: true, name: 'user', type: 'address' },
            { indexed: false, name: 'outcome', type: 'bool' },
            { indexed: false, name: 'amount', type: 'uint256' },
        ],
        name: 'BetPlaced',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'marketId', type: 'uint256' },
            { indexed: false, name: 'outcome', type: 'bool' },
        ],
        name: 'MarketResolved',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'marketId', type: 'uint256' },
            { indexed: true, name: 'user', type: 'address' },
            { indexed: false, name: 'amount', type: 'uint256' },
        ],
        name: 'WinningsClaimed',
        type: 'event',
    },
] as const
