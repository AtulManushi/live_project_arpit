import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { getUserProfile, updateUserProfile } from './firebaseApi';

export const executeTrade = async (
  stockId: string,
  type: 'BUY' | 'SELL',
  quantity: number,
  price: number
): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const profile = await getUserProfile();
    if (!profile) throw new Error('User profile not found');

    const totalAmount = quantity * price;

    // Create order
    // Set status: 'LIVE' for BUY, 'CLOSED' for SELL
    const orderData = {
      user_id: user.uid,
      stock_id: stockId,
      type,
      quantity,
      price,
      total_amount: totalAmount,
      status: type === 'BUY' ? 'LIVE' : 'CLOSED',
      created_at: serverTimestamp()
    };
  const orderRef = await addDoc(collection(db, 'orders'), orderData);
  await updateDoc(orderRef, { id: orderRef.id });

    // Update user balance
    const newBalance = type === 'BUY' 
      ? profile.wallet_balance - totalAmount 
      : profile.wallet_balance + totalAmount;
    await updateUserProfile({ wallet_balance: newBalance });

    // Update portfolio
    const portfolioRef = collection(db, 'portfolio');
    const q = query(
      portfolioRef,
      where('user_id', '==', user.uid),
      where('stock_id', '==', stockId)
    );
    const querySnapshot = await getDocs(q);

    if (type === 'BUY') {
      if (querySnapshot.empty) {
        // Create new portfolio entry
        await addDoc(portfolioRef, {
          user_id: user.uid,
          stock_id: stockId,
          quantity,
          avg_price: price,
          current_value: totalAmount,
          profit_loss: 0,
          profit_loss_percent: 0,
          created_at: serverTimestamp()
        });
      } else {
        // Update existing portfolio entry
        const docRef = doc(db, 'portfolio', querySnapshot.docs[0].id);
        const currentData = querySnapshot.docs[0].data();
        const newQuantity = currentData.quantity + quantity;
        const newAvgPrice = ((currentData.avg_price * currentData.quantity) + totalAmount) / newQuantity;
        await updateDoc(docRef, {
          quantity: newQuantity,
          avg_price: newAvgPrice,
          current_value: newQuantity * price,
          updated_at: serverTimestamp()
        });
      }
    } else {
      // Sell - update portfolio
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'portfolio', querySnapshot.docs[0].id);
        const currentData = querySnapshot.docs[0].data();
        const newQuantity = currentData.quantity - quantity;
        if (newQuantity <= 0) {
          // Remove portfolio entry if quantity becomes 0
          await deleteDoc(docRef);
        } else {
          // Update portfolio entry
          await updateDoc(docRef, {
            quantity: newQuantity,
            current_value: newQuantity * price,
            updated_at: serverTimestamp()
          });
        }
      }
    }

    // Update total_portfolio_value in profiles
    // Sum all current_value from portfolio
    const allPortfolioQ = query(collection(db, 'portfolio'), where('user_id', '==', user.uid));
    const allPortfolioSnap = await getDocs(allPortfolioQ);
    let totalPortfolioValue = 0;
    allPortfolioSnap.forEach(docSnap => {
      const data = docSnap.data();
      totalPortfolioValue += Number(data.current_value) || 0;
    });
    await updateUserProfile({ total_portfolio_value: totalPortfolioValue });

    return true;
  } catch (error) {
    console.error('Error executing trade:', error);
    throw error;
  }
};
