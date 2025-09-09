import { supabase } from '@/integrations/supabase/client';
import { Stock, Portfolio, Order, User, Notification } from '@/types/trading';

// Type helpers for database to app type conversion
const convertDbStockToStock = (dbStock: any): Stock => ({
  ...dbStock,
  price_history: Array.isArray(dbStock.price_history) ? dbStock.price_history : []
});

const convertDbUserToUser = (dbUser: any, email?: string): User => ({
  ...dbUser,
  email: email || ''
});

const convertDbNotificationToNotification = (dbNotification: any): Notification => ({
  ...dbNotification,
  type: dbNotification.type as 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
});

// User Profile Functions
export const getUserProfile = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return convertDbUserToUser(data, user.email);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Stock Functions
export const getStocks = async (): Promise<Stock[]> => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('stock_code');

    if (error) throw error;
    return (data || []).map(convertDbStockToStock);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return [];
  }
};

export const getStock = async (stockId: string): Promise<Stock | null> => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('id', stockId)
      .single();

    if (error) throw error;
    return convertDbStockToStock(data);
  } catch (error) {
    console.error('Error fetching stock:', error);
    return null;
  }
};

// Portfolio Functions
export const getUserPortfolio = async (): Promise<Portfolio[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('portfolio')
      .select(`
        *,
        stock:stocks(*)
      `)
      .eq('user_id', user.id);

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      stock: convertDbStockToStock(item.stock),
      current_value: item.quantity * item.stock.price,
      profit_loss: (item.quantity * item.stock.price) - (item.quantity * item.avg_price),
      profit_loss_percent: ((item.stock.price - item.avg_price) / item.avg_price) * 100
    }));
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return [];
  }
};

export const getUserHolding = async (stockId: string): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('portfolio')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('stock_id', stockId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.quantity || 0;
  } catch (error) {
    console.error('Error fetching user holding:', error);
    return 0;
  }
};

// Trading Functions
export const executeTrade = async (
  stockId: string,
  type: 'BUY' | 'SELL',
  quantity: number,
  price: number
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const totalAmount = quantity * price;

    // Get current user profile
    const profile = await getUserProfile();
    if (!profile) throw new Error('User profile not found');

    // Execute the trade transaction
    if (type === 'BUY') {
      // Check if user has enough balance
      if (profile.wallet_balance < totalAmount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from wallet
      await supabase
        .from('profiles')
        .update({ 
          wallet_balance: profile.wallet_balance - totalAmount 
        })
        .eq('user_id', user.id);

      // Update or create portfolio entry
      const { data: existingHolding } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .eq('stock_id', stockId)
        .single();

      if (existingHolding) {
        // Update existing holding
        const newQuantity = existingHolding.quantity + quantity;
        const newAvgPrice = ((existingHolding.quantity * existingHolding.avg_price) + totalAmount) / newQuantity;
        
        await supabase
          .from('portfolio')
          .update({
            quantity: newQuantity,
            avg_price: newAvgPrice
          })
          .eq('user_id', user.id)
          .eq('stock_id', stockId);
      } else {
        // Create new holding
        await supabase
          .from('portfolio')
          .insert({
            user_id: user.id,
            stock_id: stockId,
            quantity: quantity,
            avg_price: price
          });
      }
    } else { // SELL
      // Check if user has enough shares
      const currentHolding = await getUserHolding(stockId);
      if (currentHolding < quantity) {
        throw new Error('Insufficient shares');
      }

      // Add to wallet
      await supabase
        .from('profiles')
        .update({ 
          wallet_balance: profile.wallet_balance + totalAmount 
        })
        .eq('user_id', user.id);

      // Update portfolio
      if (currentHolding === quantity) {
        // Remove holding completely
        await supabase
          .from('portfolio')
          .delete()
          .eq('user_id', user.id)
          .eq('stock_id', stockId);
      } else {
        // Reduce quantity
        await supabase
          .from('portfolio')
          .update({
            quantity: currentHolding - quantity
          })
          .eq('user_id', user.id)
          .eq('stock_id', stockId);
      }
    }

    // Create order record
    await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        stock_id: stockId,
        type: type,
        quantity: quantity,
        price: price,
        total_amount: totalAmount,
        status: 'COMPLETED'
      });

    return true;
  } catch (error) {
    console.error('Error executing trade:', error);
    throw error;
  }
};

// Orders Functions
export const getUserOrders = async (): Promise<Order[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        stock:stocks(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      type: item.type as 'BUY' | 'SELL',
      status: item.status as 'COMPLETED' | 'PENDING' | 'CANCELLED',
      stock: convertDbStockToStock(item.stock)
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

// Notifications Functions
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data || []).map(convertDbNotificationToNotification);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Leaderboard Functions
export const getLeaderboard = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('total_portfolio_value', { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data || []).map(item => convertDbUserToUser(item));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

// Admin Functions
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => convertDbUserToUser(item));
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export const updateStock = async (stockId: string, updates: Partial<Stock>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stocks')
      .update(updates)
      .eq('id', stockId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating stock:', error);
    return false;
  }
};

export const createStock = async (stock: Omit<Stock, 'id' | 'updated_at'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stocks')
      .insert([stock]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating stock:', error);
    return false;
  }
};

export const deleteStock = async (stockId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stocks')
      .delete()
      .eq('id', stockId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting stock:', error);
    return false;
  }
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        stock:stocks(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      type: item.type as 'BUY' | 'SELL',
      status: item.status as 'COMPLETED' | 'PENDING' | 'CANCELLED',
      stock: convertDbStockToStock(item.stock)
    }));
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
};