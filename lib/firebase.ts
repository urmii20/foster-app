import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBatttjvVluaRLZvod4ynt9b7HaypfqwAs",
  authDomain: "foster-app-2026-ad53f.firebaseapp.com",
  projectId: "foster-app-2026-ad53f",
  storageBucket: "foster-app-2026-ad53f.firebasestorage.app",
  messagingSenderId: "666883379212",
  appId: "1:666883379212:web:2d747cc221a6b592091e29",
};

// Initializes Firebase exactly once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export everything together
export { app, db, auth, storage };