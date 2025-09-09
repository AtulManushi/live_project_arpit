import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Stock } from '@/types/trading';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { executeTrade } from '@/services/executeTrade';
import { getUserHolding } from '@/services/userHolding';
import { getUserProfile } from '@/services/firebaseApi';

interface TradingModalProps {
  stock: Stock | null;
  type: 'BUY' | 'SELL';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userBalance?: number;
  userHolding?: number;
}

export const TradingModal = ({
  stock,
  type,
  isOpen,
  onClose,
  onSuccess,
  userBalance = 0,
  userHolding = 0,
}: TradingModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!stock) return null;

  const totalCost = quantity * stock.price;
  const canAfford = userBalance >= totalCost;
  const canSell = userHolding >= quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Get current user profile and holdings
      const profile = await getUserProfile();
      const currentHolding = await getUserHolding(stock.id);

      if (type === 'BUY') {
        if (!profile || profile.wallet_balance < totalCost) {
          toast.error('Insufficient balance');
          setLoading(false);
          return;
        }
      } else {
        if (currentHolding < quantity) {
          toast.error('Insufficient shares to sell');
          setLoading(false);
          return;
        }
      }

      // Execute the trade
      await executeTrade(stock.id, type, quantity, stock.price);
      
      toast.success(`Successfully ${type.toLowerCase()}ed ${quantity} shares of ${stock.stock_code}`);
      onSuccess();
      onClose();
      setQuantity(1);
    } catch (error: any) {
      console.error('Trade error:', error);
      toast.error(error.message || 'Failed to execute trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type} {stock.stock_code}
          </DialogTitle>
          <DialogDescription>
            {stock.stock_name} - ${stock.price.toFixed(2)} per share
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={type === 'SELL' ? userHolding : undefined}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Price per share:</span>
              <span>${stock.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-1 text-sm text-muted-foreground">
            {type === 'BUY' && (
              <>
                <div>Available balance: ${userBalance.toFixed(2)}</div>
                {!canAfford && (
                  <div className="text-destructive">Insufficient balance</div>
                )}
              </>
            )}
            {type === 'SELL' && (
              <>
                <div>Shares owned: {userHolding}</div>
                {!canSell && (
                  <div className="text-destructive">Insufficient shares</div>
                )}
              </>
            )}
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || (type === 'BUY' && !canAfford) || (type === 'SELL' && !canSell)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type} {quantity} Shares
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};