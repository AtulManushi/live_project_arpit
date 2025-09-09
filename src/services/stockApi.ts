import { MarketData } from '@/types/trading';

// Using Alpha Vantage free API (5 requests per minute)
const API_KEY = 'B2EUQRN83YPOG321'; // Replace with your real Alpha Vantage API key
const BASE_URL = 'https://www.alphavantage.co/query';

// Popular stock symbols for demo
const DEMO_STOCKS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
  'META', 'NVDA', 'NFLX', 'AMD', 'INTC'
];

// Fetch top N cryptos dynamically from CoinGecko
const CRYPTO_LIST_COUNT = 80;

// Mock data generator for reliable demo experience
const generateMockData = (symbol: string): MarketData => {
  const basePrice = Math.random() * 500 + 50; // $50-$550
  const change = (Math.random() - 0.5) * 20; // -$10 to +$10
  const changePercent = (change / basePrice) * 100;
  
  return {
    symbol,
    price: Number(basePrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    high: Number((basePrice + Math.random() * 10).toFixed(2)),
    low: Number((basePrice - Math.random() * 10).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    marketCap: Math.floor(Math.random() * 1000000000000) + 100000000000,
  };
};

// Mock crypto data generator
const generateMockCryptoData = (id: string) => {
  const basePrice = Math.random() * 50000 + 1000; // $1000-$51000
  const change = (Math.random() - 0.5) * 2000; // -$1000 to +$1000
  const changePercent = (change / basePrice) * 100;
  
  return {
    id,
    symbol: id.toUpperCase(),
    name: id.charAt(0).toUpperCase() + id.slice(1),
    price: Number(basePrice.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    change: Number(change.toFixed(2)),
    price_history: generatePriceHistory(basePrice, 24), // 24 hours of data
    marketCap: Math.floor(Math.random() * 1000000000000) + 100000000000,
    volume: Math.floor(Math.random() * 1000000000) + 100000000,
    iconUrl: `https://assets.coingecko.com/coins/images/1/large/${id}.png`,
  };
};

export const fetchStockData = async (symbol: string): Promise<MarketData> => {
  try {
    // Fetch real data from Alpha Vantage
    const response = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
    const data = await response.json();
    const quote = data["Global Quote"];
    if (!quote) throw new Error('No data returned from API');
    return {
      symbol,
      price: Number(quote["05. price"]),
      change: Number(quote["09. change"]),
      changePercent: Number(quote["10. change percent"].replace('%', '')),
      high: Number(quote["03. high"]),
      low: Number(quote["04. low"]),
      volume: Number(quote["06. volume"]),
      marketCap: 0 // Alpha Vantage free API does not provide market cap
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    // Fallback to mock data if API fails
    return generateMockData(symbol);
  }
};

export const fetchMultipleStocks = async (symbols: string[] = DEMO_STOCKS): Promise<MarketData[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return Promise.all(symbols.map(symbol => fetchStockData(symbol)));
  } catch (error) {
    console.error('Error fetching multiple stocks:', error);
    return DEMO_STOCKS.map(generateMockData);
  }
};

// New function for fetching crypto data
// Fetch live crypto data from CoinGecko (top 80 by market cap)
export const fetchMultipleCryptos = async () => {
  try {
    const perPage = CRYPTO_LIST_COUNT;
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=24h`;
    const response = await fetch(url);
    const data = await response.json();
    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      changePercent: coin.price_change_percentage_24h,
      change: coin.price_change_24h,
      price_history: coin.sparkline_in_7d && coin.sparkline_in_7d.price ? coin.sparkline_in_7d.price.slice(-24) : [],
      marketCap: coin.market_cap,
      volume: coin.total_volume,
      iconUrl: coin.image,
    }));
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    // fallback: return 10 mock cryptos
    return Array.from({ length: 10 }, (_, i) => generateMockCryptoData(`crypto${i+1}`));
  }
};

export const getPopularStocks = (): string[] => {
  return DEMO_STOCKS;
};

// Generate historical data for charts
export const generatePriceHistory = (currentPrice: number, days: number = 30): number[] => {
  const history = [];
  let price = currentPrice;
  
  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.5) * (currentPrice * 0.05); // Max 5% daily change
    price = Math.max(price + change, currentPrice * 0.5); // Don't go below 50% of current
    history.push(Number(price.toFixed(2)));
  }
  
  return history;
};