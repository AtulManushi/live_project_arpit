import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';

export const getUserHolding = async (stockId: string): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;
    // Sum all BUY - SELL orders for this user and stock
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('user_id', '==', user.uid), where('stock_id', '==', stockId));
    const querySnapshot = await getDocs(q);
    let holding = 0;
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.type === 'BUY') holding += Number(data.quantity);
      if (data.type === 'SELL') holding -= Number(data.quantity);
    });
    return holding;
  } catch (error) {
    console.error('Error calculating user holding:', error);
    return 0;
  }
};
