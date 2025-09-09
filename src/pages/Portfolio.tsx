
type Holding = {
  stock: any;
  quantity: number;
  totalBuy: number;
  totalSell: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  currentValue?: number;
  avgBuy?: number;
  gain?: number;
};

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getUserPortfolio, getUserOrders, getUserProfile } from '@/services/firebaseApi';
import { fetchMultipleCryptos } from '@/services/stockApi';
import { toast } from 'sonner';

const Portfolio = () => {
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalGainLoss, setTotalGainLoss] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadPortfolio = async () => {
      setLoading(true);
      try {
        // Fetch user profile for wallet and total portfolio value
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        let portfolios = await getUserPortfolio();
        // Deduplicate by stock_id (only one row per currency)
        const uniqueMap = {};
        for (const p of portfolios) {
          if (!uniqueMap[p.stock_id]) {
            uniqueMap[p.stock_id] = p;
          }
        }
        portfolios = Object.values(uniqueMap);
        // Get all unique crypto symbols/ids
        const ids = portfolios.map(p => p.stock_id).filter(Boolean);
        // Fetch all live crypto prices in one call
        const cryptos = await fetchMultipleCryptos();
        // Map for quick lookup (by id, symbol, and uppercase symbol)
        const cryptoMap = {};
        for (const c of cryptos) {
          cryptoMap[c.id] = c;
          if (c.symbol) cryptoMap[c.symbol.toLowerCase()] = c;
          if (c.symbol) cryptoMap[c.symbol.toUpperCase()] = c;
        }
        // Fallback mapping for popular cryptos
        const symbolToId = {
          BTC: 'bitcoin',
          ETH: 'ethereum',
          XRP: 'ripple',
          ADA: 'cardano',
          DOGE: 'dogecoin',
          SOL: 'solana',
          MATIC: 'matic-network',
          BNB: 'binancecoin',
          LTC: 'litecoin',
          DOT: 'polkadot',
          TRX: 'tron',
          AVAX: 'avalanche-2',
          SHIB: 'shiba-inu',
        };
        // Build holdings with live price, 7d price history
        let totalPL = 0;
        const newHoldings = portfolios.map(p => {
          // Always map symbol to CoinGecko id first
          let coingeckoId = p.stock_id;
          if (symbolToId[p.stock_id]) coingeckoId = symbolToId[p.stock_id];
          // Now lookup CoinGecko data
          let live = cryptoMap[coingeckoId]
            || cryptoMap[p.stock_id]
            || cryptoMap[p.stock_id?.toLowerCase?.()]
            || cryptoMap[p.stock_id?.toUpperCase?.()];

          // Fallback to Firestore price if not found
          const livePrice = live?.price ?? p.stock?.price ?? 0;
          const currentValue = livePrice * (p.quantity ?? 0);
          const avgBuy = p.avg_price ?? 0;
          const gain = currentValue - (avgBuy * (p.quantity ?? 0));
          totalPL += gain;
          // Use full 7-day sparkline if available
          let priceHistory = live?.price_history || p.stock?.price_history || [];
          if (live?.sparkline_in_7d?.price) priceHistory = live.sparkline_in_7d.price;
          // Show current_value as Buy At, quantity as quantity
          return {
            stock: {
              price: livePrice,
              iconUrl: live?.iconUrl || live?.image || p.stock?.iconUrl,
              stock_name: live?.name || p.stock?.stock_name || p.stock_id,
              stock_code: live?.symbol?.toUpperCase() || p.stock?.stock_code || p.stock_id?.toUpperCase() || 'N/A',
              sector: 'Crypto',
              price_history: priceHistory,
            },
            quantity: p.quantity ?? 0,
            avgBuy,
            currentValue,
            gain,
            totalBuy: p.quantity ?? 0,
            totalSell: 0,
            totalBuyAmount: p.current_value ?? 0,
            totalSellAmount: 0
          };
        });
        setHoldings(newHoldings);
        setTotalValue(userProfile?.total_portfolio_value || 0);
        setTotalGainLoss(totalPL);
      } catch (error) {
        toast.error('Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    };
    loadPortfolio();
  }, []);

  const isPositive = totalGainLoss >= 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Track your investments and performance</p>
      </div>
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(profile?.total_portfolio_value || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(profile?.wallet_balance || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{totalGainLoss >= 0 ? '+' : ''}{((totalGainLoss / ((profile?.total_portfolio_value || 1) - totalGainLoss)) * 100 || 0).toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>
      {/* Holdings Table */}
      {holdings.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">No assets found in your portfolio.</div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full rounded-xl shadow border border-gray-200 dark:border-gray-700 text-base bg-white dark:bg-gray-900">
            <thead className="bg-blue-100 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 font-bold text-gray-700 dark:text-gray-200">SR NO</th>
                <th className="px-3 py-2 font-bold text-gray-700 dark:text-gray-200">CURRENCY</th>
                <th className="px-3 py-2 font-bold text-gray-700 dark:text-gray-200">PRICE</th>
                <th className="px-3 py-2 font-bold text-gray-700 dark:text-gray-200">BUY AT</th>
                <th className="px-3 py-2 font-bold text-gray-700 dark:text-gray-200">QUANTITY</th>
                <th className="px-3 py-2 font-bold text-gray-700 dark:text-gray-200">Last 7 Days</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                  <td className="px-3 py-2 text-center font-semibold text-gray-900 dark:text-gray-100">{i + 1}</td>
                  <td className="px-3 py-2 flex items-center gap-2">
                    {h.stock.iconUrl && (
                      <img src={h.stock.iconUrl} alt={h.stock.stock_name} className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm" style={{ objectFit: 'contain' }} />
                    )}
                    <span className="font-bold uppercase text-gray-900 dark:text-gray-100">{h.stock.stock_name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">({h.stock.stock_code})</span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900 dark:text-gray-100">{h.stock.price ? h.stock.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                  <td className="px-3 py-2 text-center text-gray-900 dark:text-gray-100">{h.totalBuyAmount ? h.totalBuyAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                  <td className="px-3 py-2 text-center text-gray-900 dark:text-gray-100">{h.quantity}</td>
                  <td className="px-3 py-2 text-center min-w-[60px]">
                    {Array.isArray(h.stock.price_history) && h.stock.price_history.length > 0 ? (
                      <ChartContainer config={{ spark: { color: h.gain >= 0 ? '#22c55e' : '#ef4444' } }}>
                        <ResponsiveContainer width={60} height={28}>
                          <AreaChart data={h.stock.price_history.map((y, idx) => ({ x: idx, y }))} margin={{ top: 6, right: 0, left: 0, bottom: 6 }}>
                            <Area type="monotone" dataKey="y" stroke={h.gain >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0} strokeWidth={2} isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xl">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Portfolio;