import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUserOrders, getUserProfile, getStock } from '@/services/firebaseApi';
import { fetchMultipleCryptos } from '@/services/stockApi';
import { getUserHolding } from '@/services/userHolding';
import { TradingModal } from '@/components/trading/TradingModal';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const Orders = () => {
  // Error boundary state
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState([]);
  const [stocksMap, setStocksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userHolding, setUserHolding] = useState(0);

  useEffect(() => {
    loadOrders();
    loadProfile();
  }, []);

  // After loading orders, fetch missing stock details if needed
  useEffect(() => {
    const fetchMissingStocks = async () => {
      const missingIds = orders
        .filter(order => !order.stock && order.stock_id)
        .map(order => order.stock_id)
        .filter((id, idx, arr) => arr.indexOf(id) === idx);
      if (missingIds.length === 0) return;
      const newStocks = { ...stocksMap };
      // Try Firestore first, then CoinGecko
      const cryptos = await fetchMultipleCryptos();
      for (const id of missingIds) {
        if (!newStocks[id]) {
          let stock = await getStock(id);
          if (!stock) {
            // Try CoinGecko by id or symbol
            stock = cryptos.find((c) => c.id === id || c.symbol.toLowerCase() === id.toLowerCase());
            if (stock) {
              // Map CoinGecko fields to Stock shape (use correct Stock type fields)
              stock = {
                stock_name: stock.name,
                stock_code: stock.symbol?.toUpperCase() || '',
                sector: 'Crypto',
                iconUrl: stock.iconUrl,
                price: stock.price,
                id: stock.id,
                change_percent: stock.changePercent ?? stock.change_percent ?? 0,
                change_amount: stock.change ?? stock.change_amount ?? 0,
                price_history: stock.price_history || [],
                updated_at: new Date().toISOString(),
                market_cap: stock.marketCap ?? stock.market_cap ?? 0,
                volume: stock.volume,
              };
            }
          }
          if (stock) newStocks[id] = stock;
        }
      }
      setStocksMap(newStocks);
    };
    if (orders.length > 0) fetchMissingStocks();
    // eslint-disable-next-line
  }, [orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getUserOrders();
      console.log('Orders loaded:', data);
      setOrders(data);
    } catch (err) {
      setError(err?.message || 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch {}
  };


  const handleSell = async (order) => {
    if (order.type !== 'BUY') return;
    setSelectedOrder(order);
    // Always use string for stock_id
    const holding = await getUserHolding(String(order.stock_id));
    setUserHolding(holding);
    setShowSellModal(true);
  };

  // After a trade, reload orders and holdings
  const handleTradeSuccess = async () => {
    await loadOrders();
    if (selectedOrder) {
      const holding = await getUserHolding(String(selectedOrder.stock_id));
      setUserHolding(holding);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Always render fallback UI if orders fail to load
  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-2 space-y-6">
        <h1 className="text-3xl font-bold mb-4">My Orders</h1>
        <div className="flex flex-col items-center justify-center h-64 text-red-600">
          <div className="text-xl font-bold mb-2">Error loading orders</div>
          <div className="text-base">{error}</div>
        </div>
      </div>
    );
  }

  return (
  <div className="w-full max-w-none py-8 px-2 space-y-6">
      <h1 className="text-3xl font-bold mb-4">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">No orders found.</div>
      ) : (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          {orders.map((order) => {
            let stock = order.stock;
            if (!stock && stocksMap[order.stock_id]) {
              stock = stocksMap[order.stock_id];
            }
            stock = stock || {
              stock_name: 'Unknown',
              stock_code: 'N/A',
              sector: 'Crypto',
              iconUrl: '',
              price: 0
            };
            return (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4 flex flex-col mb-2 border border-gray-100 dark:border-gray-700 min-h-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  {stock.iconUrl && <img src={stock.iconUrl} alt={stock.stock_name} className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm" style={{ objectFit: 'contain' }} />}
                  <span className="font-bold text-lg lowercase text-gray-900 dark:text-gray-100">{stock.stock_name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold lowercase">({stock.stock_code})</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-2">Crypto</span>
                <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">BUY AT:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{order.price ? order.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">TOTAL:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{order.total_amount ? order.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold rounded-full px-4 py-1">QUANTITY: {order.quantity}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sell Modal */}
      {selectedOrder && (
        <TradingModal
          stock={selectedOrder.stock}
          type="SELL"
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          onSuccess={handleTradeSuccess}
          userBalance={userProfile?.wallet_balance || 0}
          userHolding={userHolding}
        />
      )}
    </div>
  );
};

export default Orders;