// data/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBfRzndvKIe5ujxWXlghdi2MJ2A06elVZg",
  authDomain: "god-is-in-the-numbers.firebaseapp.com",
  projectId: "god-is-in-the-numbers",
  storageBucket: "god-is-in-the-numbers.firebasestorage.app",
  messagingSenderId: "194811808379",
  appId: "1:194811808379:web:2a5d7f71818916f58570de",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});
export const googleProvider = new GoogleAuthProvider();
