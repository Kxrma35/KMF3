import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAvFGbE9JA_KHGRe274zzrCGX2I9Jpmz6s",
  authDomain: "bulking-tracker-5dfea.firebaseapp.com",
  projectId: "bulking-tracker-5dfea",
  storageBucket: "bulking-tracker-5dfea.firebasestorage.app",
  messagingSenderId: "807412003211",
  appId: "1:807412003211:web:1aaf42d8abdac30dcfff8e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Offline-first: cache reads + queue writes when offline.
// If multiple tabs are open, Firestore will reject persistence for one of them.
enableIndexedDbPersistence(db).catch(() => {});