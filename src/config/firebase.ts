import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCOf6P6z8ugr1bzZ4yms-YZuXROX05zg9w",
  authDomain: "poderoso-burguer.firebaseapp.com",
  projectId: "poderoso-burguer",
  storageBucket: "poderoso-burguer.firebasestorage.app",
  messagingSenderId: "242336340138",
  appId: "1:242336340138:web:1f8ced99f4bdc354d9d8d3",
  measurementId: "G-PRRT6K35Z9"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const analytics = typeof window !== 'undefined'
  ? isSupported().then((yes) => (yes ? getAnalytics(app) : null)).catch(() => null)
  : null;

