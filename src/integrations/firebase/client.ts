import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBk-AFPBzncrCqR77Em_jK8OU5NK6rSrio",
  authDomain: "trading-project-d842e.firebaseapp.com",
  databaseURL: "https://trading-project-d842e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "trading-project-d842e",
  storageBucket: "trading-project-d842e.firebasestorage.app",
  messagingSenderId: "934975528270",
  appId: "1:934975528270:web:073c1fa218530bc3e9121f",
  measurementId: "G-R633CPXX1J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
