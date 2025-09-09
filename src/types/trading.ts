export interface User {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  wallet_balance: number;
  total_portfolio_value: number;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Stock {
  id: string;
  stock_code: string;
  stock_name: string;
  price: number;
  change_percent: number;
  change_amount: number;
  price_history: number[];
  updated_at: string;
  sector?: string;
  market_cap?: number;
  volume?: number;
  iconUrl?: string; // For crypto icon
}

export interface Portfolio {
  id: string;
  user_id: string;
  stock_id: string;
  stock: Stock;
  quantity: number;
  avg_price: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
}


export interface Order {
  id: string;
  user_id: string;
  stock_id: string;
  stock: Stock;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total_amount: number;
  status: 'LIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'CLOSED';
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  created_at: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  marketCap?: number;
}