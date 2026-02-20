import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwWpe7nZClO7F98uGScNYi0OS-gnY2O9c",
  authDomain: "savorcue.firebaseapp.com",
  projectId: "savorcue",
  storageBucket: "savorcue.firebasestorage.app",
  messagingSenderId: "607906099746",
  appId: "1:607906099746:web:e367d284149cd8038b107b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);
