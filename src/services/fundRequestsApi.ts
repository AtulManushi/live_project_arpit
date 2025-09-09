import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/integrations/firebase/client';

export interface FundRequest {
  id: string;
  user_id: string;
  amount: number;
  txn_id: string;
  screenshot_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export const createFundRequest = async (
  user_id: string,
  amount: number,
  txn_id: string,
  screenshot: File
): Promise<boolean> => {
  try {
    // Upload screenshot to Firebase Storage
    const fileName = `${user_id}_${Date.now()}_${screenshot.name}`;
    const storageRef = ref(storage, `fund-requests/${fileName}`);
    const snapshot = await uploadBytes(storageRef, screenshot);
    const screenshot_url = await getDownloadURL(snapshot.ref);

    // Insert fund request row
    const fundRequestRef = await addDoc(collection(db, 'fund_requests'), {
      user_id,
      amount,
      txn_id,
      screenshot_url,
      status: 'PENDING',
      created_at: serverTimestamp(),
    });
    // Add document id as 'id' field
    await updateDoc(fundRequestRef, { id: fundRequestRef.id });

    return true;
  } catch (error) {
    console.error('Error creating fund request:', error);
    return false;
  }
};

export const getPendingFundRequests = async (): Promise<FundRequest[]> => {
  try {
    const fundRequestsRef = collection(db, 'fund_requests');
    const q = query(
      fundRequestsRef,
      where('status', '==', 'PENDING'),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const fundRequests: FundRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.user_id && data.amount && data.txn_id && data.screenshot_url) {
        fundRequests.push({
          id: doc.id,
          user_id: data.user_id,
          amount: data.amount,
          txn_id: data.txn_id,
          screenshot_url: data.screenshot_url,
          status: data.status,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      }
    });
    
    return fundRequests;
  } catch (error) {
    console.error('Error fetching fund requests:', error);
    return [];
  }
};

export const approveFundRequest = async (
  requestId: string,
  userId: string,
  amount: number
): Promise<boolean> => {
  try {
    // Update request status
    await updateDoc(doc(db, 'fund_requests', requestId), {
      status: 'APPROVED',
      updated_at: serverTimestamp()
    });

    // Add amount to user wallet
    const userProfileRef = doc(db, 'profiles', userId);
    const userProfileDoc = await getDoc(userProfileRef);
    
    if (!userProfileDoc.exists()) {
      console.error('User profile not found');
      return false;
    }

    const currentBalance = userProfileDoc.data().wallet_balance || 0;
    const newBalance = currentBalance + amount;

    await updateDoc(userProfileRef, {
      wallet_balance: newBalance,
      updated_at: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error approving fund request:', error);
    return false;
  }
};

export const rejectFundRequest = async (requestId: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'fund_requests', requestId), {
      status: 'REJECTED',
      updated_at: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error rejecting fund request:', error);
    return false;
  }
};
