import { getUserHolding } from './userHolding';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '@/integrations/firebase/client';
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
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'profiles', user.uid));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return convertDbUserToUser(data, user.email);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'profiles', user.uid), {
      ...updates,
      updated_at: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

  // Get all orders for current user
export const getUserOrders = async (): Promise<Order[]> => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('user_id', '==', user.uid), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Ensure all required Order fields are present
        orders.push({
          id: docSnap.id,
          user_id: data.user_id,
          stock_id: data.stock_id,
          stock: data.stock || null,
          type: data.type,
          quantity: data.quantity,
          price: data.price,
          total_amount: data.total_amount,
          status: data.status,
          created_at: data.created_at,
        });
      });
      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  };
// Stock Functions
export const getStocks = async (): Promise<Stock[]> => {
  try {
    const stocksRef = collection(db, 'stocks');
    const q = query(stocksRef, orderBy('stock_code'));
    const querySnapshot = await getDocs(q);
    
    const stocks: Stock[] = [];
    querySnapshot.forEach((doc) => {
      stocks.push(convertDbStockToStock({ id: doc.id, ...doc.data() }));
    });
    
    return stocks;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return [];
  }
};

export const getStock = async (stockId: string): Promise<Stock | null> => {
  try {
    const stockDoc = await getDoc(doc(db, 'stocks', stockId));
    if (!stockDoc.exists()) return null;
    
    return convertDbStockToStock({ id: stockDoc.id, ...stockDoc.data() });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return null;
  }
};

// Portfolio Functions
export const getUserPortfolio = async (): Promise<Portfolio[]> => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const portfolioRef = collection(db, 'portfolio');
    const q = query(portfolioRef, where('user_id', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    const portfolios: Portfolio[] = [];
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      let stock = null;
      try {
        stock = await getStock(data.stock_id);
      } catch {}
      portfolios.push({
        id: docSnapshot.id,
        user_id: data.user_id,
        stock_id: data.stock_id,
        stock,
        quantity: data.quantity,
        avg_price: data.avg_price,
        current_value: data.current_value,
        profit_loss: data.profit_loss,
        profit_loss_percent: data.profit_loss_percent
      });
    }
    return portfolios;
  } catch (error) {
  }

// Trade Functions
  }
