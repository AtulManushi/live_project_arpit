
import React from 'react';
import { useParams } from 'react-router-dom';
import { TradingViewWidget } from '../components/TradingViewWidget';
import { getStock } from '@/services/firebaseApi';
import { fetchMultipleCryptos } from '@/services/stockApi';

const DetailPage: React.FC = () => {
  const { id } = useParams();
  const [stock, setStock] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let found = null;
      if (id) {
        // Try Firestore first
        found = await getStock(id);
        if (!found) {
          // Try CoinGecko data
          const cryptos = await fetchMultipleCryptos();
          found = cryptos.find((c: any) => c.id === id || c.symbol.toLowerCase() === id.toLowerCase());
        }
      }
      if (found) {
        setStock(found);
      } else {
        setError('Currency not found.');
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !stock) return <div className="min-h-screen flex items-center justify-center">{error || 'Currency not found.'}</div>;

  return (
  <div className="min-h-screen bg-background p-2 sm:p-4 w-full max-w-none">
      <h1 className="text-2xl font-bold mb-4">{stock.name || stock.stock_name} ({stock.symbol || stock.stock_code})</h1>
      <div className="mb-6 w-full">
        <TradingViewWidget symbol={(stock.symbol || stock.stock_code).toUpperCase()} />
      </div>
      <div className="bg-card p-4 rounded shadow w-full">
        <h2 className="text-lg font-semibold mb-2">Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base">
          <p><span className="font-semibold">Current Price:</span> ${stock.price}</p>
          <p><span className="font-semibold">Market Cap:</span> ${stock.marketCap || stock.market_cap}</p>
          <p><span className="font-semibold">Volume:</span> ${stock.volume}</p>
          <p><span className="font-semibold">Change (24h):</span> {stock.changePercent || stock.change_percent}%</p>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
