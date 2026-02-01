"""交易解码模块 - 解析 Polymarket CTF Exchange 的 OrderFilled 事件"""
from __future__ import annotations
from decimal import Decimal
from typing import Dict, Optional, Union, Tuple
from web3 import Web3
from eth_abi import decode

# OrderFilled 事件签名
# event OrderFilled(
#     bytes32 indexed orderHash,
#     address indexed maker,
#     address indexed taker,
#     uint256 makerAssetId,
#     uint256 takerAssetId,
#     uint256 makerAmountFilled,
#     uint256 takerAmountFilled,
#     uint256 fee
# )
ORDER_FILLED_TOPIC = Web3.keccak(
    text="OrderFilled(bytes32,address,address,uint256,uint256,uint256,uint256,uint256)"
).hex()

# USDC 精度 (6 位小数)
USDC_DECIMALS = 6

# Conditional Token 精度
CT_DECIMALS = 6


class TradeDecoder:
    """交易解码器"""

    def __init__(self):
        self.w3 = Web3()

    def decode_order_filled(self, log: Dict) -> Optional[Dict]:
        """
        解码 OrderFilled 事件

        Args:
            log: 原始日志数据

        Returns:
            解码后的交易数据，格式:
            {
                "tx_hash": str,
                "log_index": int,
                "block_number": int,
                "maker": str,
                "taker": str,
                "maker_asset_id": str,  # token_id
                "taker_asset_id": str,
                "maker_amount": Decimal,
                "taker_amount": Decimal,
                "fee": Decimal,
                "side": str,  # "BUY" / "SELL"
                "price": Decimal,
                "size": Decimal,
            }
        """
        try:
            topics = log.get("topics", [])
            if len(topics) < 4:
                return None

            # 检查是否是 OrderFilled 事件
            topic0 = topics[0].hex() if isinstance(topics[0], bytes) else topics[0]
            if topic0.lower() != ORDER_FILLED_TOPIC.lower():
                return None

            # 解析 indexed 参数
            # topics[1] = orderHash
            # topics[2] = maker (address, 需要从 bytes32 提取)
            # topics[3] = taker (address)
            maker = self._extract_address(topics[2])
            taker = self._extract_address(topics[3])

            # 解析 non-indexed 参数 (在 data 中)
            data = log.get("data", "0x")
            if isinstance(data, bytes):
                data = data.hex()
            if data.startswith("0x"):
                data = data[2:]

            # 解码 data: (uint256, uint256, uint256, uint256, uint256)
            # makerAssetId, takerAssetId, makerAmountFilled, takerAmountFilled, fee
            decoded = decode(
                ["uint256", "uint256", "uint256", "uint256", "uint256"],
                bytes.fromhex(data)
            )

            maker_asset_id = str(decoded[0])
            taker_asset_id = str(decoded[1])
            maker_amount_raw = decoded[2]
            taker_amount_raw = decoded[3]
            fee_raw = decoded[4]

            # 判断交易方向和计算价格
            # 如果 maker 给出的是 USDC (taker_asset_id 是 token)，则 maker 是买家
            # 如果 maker 给出的是 token (maker_asset_id 是 token)，则 maker 是卖家
            side, price, size, token_id = self._determine_trade_direction(
                maker_asset_id, taker_asset_id,
                maker_amount_raw, taker_amount_raw
            )

            return {
                "tx_hash": log.get("transactionHash", "").hex() if isinstance(log.get("transactionHash"), bytes) else log.get("transactionHash", ""),
                "log_index": log.get("logIndex", 0),
                "block_number": log.get("blockNumber", 0),
                "maker": maker,
                "taker": taker,
                "maker_asset_id": maker_asset_id,
                "taker_asset_id": taker_asset_id,
                "maker_amount": Decimal(maker_amount_raw) / Decimal(10 ** USDC_DECIMALS),
                "taker_amount": Decimal(taker_amount_raw) / Decimal(10 ** CT_DECIMALS),
                "fee": Decimal(fee_raw) / Decimal(10 ** USDC_DECIMALS),
                "side": side,
                "price": price,
                "size": size,
                "token_id": token_id,
            }

        except Exception as e:
            print(f"解码失败: {e}")
            return None

    def _extract_address(self, topic: bytes | str) -> str:
        """从 bytes32 topic 中提取地址"""
        if isinstance(topic, bytes):
            topic = topic.hex()
        if topic.startswith("0x"):
            topic = topic[2:]
        # 地址是最后 40 个字符
        return "0x" + topic[-40:]

    def _determine_trade_direction(
        self,
        maker_asset_id: str,
        taker_asset_id: str,
        maker_amount_raw: int,
        taker_amount_raw: int
    ) -> tuple[str, Decimal, Decimal, str]:
        """
        判断交易方向

        在 Polymarket 中:
        - asset_id = 0 表示 USDC
        - asset_id = 大数字 表示 conditional token

        Returns:
            (side, price, size, token_id)
        """
        # 判断哪个是 USDC (asset_id = 0)
        if maker_asset_id == "0":
            # Maker 给出 USDC，获得 token -> Maker 是买家
            side = "BUY"
            usdc_amount = Decimal(maker_amount_raw) / Decimal(10 ** USDC_DECIMALS)
            token_amount = Decimal(taker_amount_raw) / Decimal(10 ** CT_DECIMALS)
            token_id = taker_asset_id
        elif taker_asset_id == "0":
            # Maker 给出 token，获得 USDC -> Maker 是卖家
            side = "SELL"
            usdc_amount = Decimal(taker_amount_raw) / Decimal(10 ** USDC_DECIMALS)
            token_amount = Decimal(maker_amount_raw) / Decimal(10 ** CT_DECIMALS)
            token_id = maker_asset_id
        else:
            # 两边都是 token (可能是 token-token 交换)，默认处理
            side = "BUY"
            usdc_amount = Decimal(maker_amount_raw) / Decimal(10 ** USDC_DECIMALS)
            token_amount = Decimal(taker_amount_raw) / Decimal(10 ** CT_DECIMALS)
            token_id = taker_asset_id

        # 计算价格 (USDC per token)
        if token_amount > 0:
            price = usdc_amount / token_amount
        else:
            price = Decimal(0)

        return side, price, token_amount, token_id
