"""数据库模型定义"""
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, String, Integer, BigInteger, Numeric, DateTime,
    Boolean, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from .db import Base


class Market(Base):
    """市场表 - 存储 Polymarket 市场元数据"""
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    condition_id = Column(String(66), nullable=False)
    yes_token_id = Column(String(100), nullable=False)
    no_token_id = Column(String(100), nullable=False)
    category = Column(String(50), default="Politics")
    question = Column(Text)
    resolved = Column(Boolean, default=False)
    resolution_outcome = Column(String(10))  # 'YES' / 'NO' / None
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 索引
    __table_args__ = (
        Index("idx_markets_token_yes", "yes_token_id"),
        Index("idx_markets_token_no", "no_token_id"),
    )


class Trade(Base):
    """交易表 - 存储链上交易记录"""
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    tx_hash = Column(String(66), nullable=False)
    log_index = Column(Integer, nullable=False)
    block_number = Column(BigInteger, nullable=False)
    market_slug = Column(String(255), nullable=False)
    maker = Column(String(42), nullable=False)
    taker = Column(String(42))
    side = Column(String(10), nullable=False)  # 'BUY' / 'SELL'
    outcome = Column(String(50), nullable=False)  # 'YES' / 'NO' / 'Up' / 'Down' 等
    price = Column(Numeric(10, 6), nullable=False)  # 0.00 - 1.00
    size = Column(Numeric(20, 6), nullable=False)  # token 数量
    amount_usd = Column(Numeric(18, 2), nullable=False)
    is_whale = Column(Boolean, default=False)  # > 10000 USD
    timestamp = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 索引
    __table_args__ = (
        Index("idx_trades_tx_log", "tx_hash", "log_index", unique=True),
        Index("idx_trades_market", "market_slug"),
        Index("idx_trades_maker", "maker"),
        Index("idx_trades_timestamp", "timestamp"),
        Index("idx_trades_whale", "is_whale", "timestamp"),
    )


class TraderProfile(Base):
    """交易者画像表 - 存储交易者统计信息"""
    __tablename__ = "trader_profiles"

    address = Column(String(42), primary_key=True)
    total_trades = Column(Integer, default=0)
    total_volume = Column(Numeric(20, 2), default=0)
    win_count = Column(Integer, default=0)
    loss_count = Column(Integer, default=0)
    win_rate = Column(Numeric(5, 2), default=0)  # 0.00 - 100.00
    avg_trade_size = Column(Numeric(18, 2), default=0)
    trader_type = Column(String(20))  # 'smart_money' / 'dumb_money' / 'normal'

    # AI 分析字段
    label = Column(String(100))  # AI 生成的标签（如：激进型政治预测专家）
    trading_style = Column(String(50))  # 交易风格：激进/稳健/保守/投机/对冲
    risk_preference = Column(String(20))  # 风险偏好：高/中/低
    ai_analysis = Column(Text)  # AI 深度分析文本

    last_trade_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 索引
    __table_args__ = (
        Index("idx_profiles_win_rate", "win_rate"),
        Index("idx_profiles_volume", "total_volume"),
        Index("idx_profiles_type", "trader_type"),
    )


class InsiderAlert(Base):
    """内幕分析警报表 - 存储 AI 分析结果"""
    __tablename__ = "insider_alerts"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id"))
    market_slug = Column(String(255), nullable=False)
    trade_time = Column(DateTime, nullable=False)
    trade_amount = Column(Numeric(18, 2), nullable=False)
    trader_address = Column(String(42), nullable=False)
    related_news = Column(Text)
    news_source = Column(String(255))
    news_time = Column(DateTime)
    time_diff_minutes = Column(Integer)  # 交易时间 - 新闻时间 (负值表示交易在新闻之前)
    is_suspect = Column(Boolean, default=False)
    confidence = Column(Numeric(3, 2))  # 0.00 - 1.00
    reason = Column(Text)
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    # 索引
    __table_args__ = (
        Index("idx_alerts_suspect", "is_suspect", "analyzed_at"),
        Index("idx_alerts_market", "market_slug"),
    )
