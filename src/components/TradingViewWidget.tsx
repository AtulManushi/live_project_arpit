import React from 'react';

export const TradingViewWidget: React.FC<{ symbol: string }> = ({ symbol }) => {
  // Use TradingView's free widget via iframe
  // For crypto, use format: BINANCE:{symbol}USDT
  const tvSymbol = `BINANCE:${symbol}USDT`;
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <iframe
        title="TradingView Chart"
        src={`https://s.tradingview.com/widgetembed/?symbol=${tvSymbol}&interval=1D&theme=dark&style=1&toolbarbg=f1f3f6&studies=[]&hideideas=1`}
        width="100%"
        height="500"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
};
