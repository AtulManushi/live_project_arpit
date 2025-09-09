import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

export const getMerchantUpi = async (): Promise<string | null> => {
  try {
    const merchantRef = collection(db, 'merchant');
    const qSnap = await getDocs(query(merchantRef, limit(1)));
    if (!qSnap.empty) {
      const doc = qSnap.docs[0];
      const data = doc.data();
      return data.upi || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching merchant UPI:', error);
    return null;
  }
};
