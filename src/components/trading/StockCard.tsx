
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Stock } from '@/types/trading';
import { AreaChart, Area, Line, ResponsiveContainer, ReferenceLine } from 'recharts';
import React from 'react';

interface StockCardProps {
  stock: Stock;
  onBuy: (stock: Stock) => void;
  onSell: (stock: Stock) => void;
  onGraphClick?: () => void;
}

export const StockCard = ({ stock, onBuy, onSell, onGraphClick }: StockCardProps) => {
  const isPositive = stock.change_percent >= 0;
  const chartData = stock.price_history.map((price, index) => ({
    index,
    price,
  }));
  const lastPrice = stock.price_history[stock.price_history.length - 1];

  return (
    <Card className="rounded-2xl shadow-md border border-gray-200 bg-white hover:shadow-xl transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          {stock.iconUrl && (
            <img
              src={stock.iconUrl}
              alt={stock.stock_name}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm"
              style={{ objectFit: 'contain' }}
            />
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg truncate">{stock.stock_name}</span>
              <span className="text-xs text-gray-500 font-semibold">({stock.stock_code})</span>
            </div>
            <span className="text-xs text-gray-400 font-medium mt-0.5 truncate">{stock.sector || 'Crypto'}</span>
          </div>
          <Badge variant={isPositive ? 'default' : 'destructive'} className="ml-2 px-2 py-1 text-xs font-bold rounded-full">
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {stock.change_percent.toFixed(2)}%
          </Badge>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-extrabold text-gray-900">${stock.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? '+' : ''}${stock.change_amount.toFixed(2)}</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">Market Cap: <span className="font-semibold text-gray-700">${stock.market_cap ? stock.market_cap.toLocaleString() : '-'}</span></div>

        <div className="h-14 mb-4 cursor-pointer" onClick={onGraphClick}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorPrice${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.25}/>
                  <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#22c55e' : '#ef4444'}
                fill={`url(#colorPrice${stock.id})`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine y={lastPrice} stroke="#e5e7eb" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onBuy(stock)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow" size="sm">
            Buy
          </Button>
          <Button onClick={() => onSell(stock)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow" size="sm">
            Sell
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};