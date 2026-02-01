"""配置管理模块"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""

    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://hunter:hunter123@localhost:5432/polymarket_db"

    # Polygon RPC
    POLYGON_RPC_URL: str = "https://polygon-rpc.com"

    # DeepSeek API
    DEEPSEEK_BASE_URL: str = "https://api.siliconflow.cn/v1"
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_MODEL: str = "deepseek-ai/DeepSeek-V3"

    # 业务配置
    WHALE_THRESHOLD: float = 10000.0  # 大单阈值 1万U
    SMART_MONEY_WIN_RATE: float = 0.9  # 聪明钱胜率阈值 90%
    SMART_MONEY_MIN_VOLUME: float = 1000.0  # 聪明钱最小交易量
    DUMB_MONEY_WIN_RATE: float = 0.3  # 笨蛋钱胜率阈值 30%

    # CTF Exchange 合约地址
    CTF_EXCHANGE_ADDRESS: str = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"

    # Gamma API
    GAMMA_API_URL: str = "https://gamma-api.polymarket.com"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
