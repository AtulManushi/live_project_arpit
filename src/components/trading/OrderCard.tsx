
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/trading';

interface OrderCardProps {
  order: Order;
  onSellClick?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onSellClick }) => {
  const stock = order.stock;
  const isPositive = stock.change_amount >= 0;

  return (
    <Card className="rounded-2xl shadow-md border border-gray-200 bg-white hover:shadow-xl transition-shadow max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          {stock.iconUrl && (
            <img
              src={stock.iconUrl}
              alt={stock.stock_name}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm"
              style={{ objectFit: 'contain' }}
            />
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg truncate">{stock.stock_name}</span>
              <span className="text-xs text-gray-500 font-semibold">({stock.stock_code})</span>
            </div>
            <span className="text-xs text-gray-400 font-medium mt-0.5 truncate">Crypto</span>
          </div>
          <div className="bg-gray-900 text-white text-xs font-bold rounded-full px-3 py-1 ml-2">QUANTITY: {order.quantity}</div>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-extrabold text-gray-900">${stock.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? '+' : ''}${stock.change_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div className="flex gap-4 mb-2">
          <div className="text-xs text-gray-500">BUY AT: <span className="font-semibold text-gray-700">{order.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
          <div className="text-xs text-gray-500">TOTAL: <span className="font-semibold text-gray-700">{order.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
        </div>
        {/* Chart placeholder (optional) */}
        <div className="h-10 mb-4">
          {/* You can add a mini chart here if desired */}
        </div>
  {order.type === 'BUY' && order.status === 'PENDING' && onSellClick && (
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-full py-3 mt-2"
            onClick={() => onSellClick(order)}
          >
            SELL
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
