import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvb2sT6Rh3Q7mBMD_b4Ol-agBZZaqpys8",
  authDomain: "nursery-project-98588.firebaseapp.com",
  projectId: "nursery-project-98588",
  storageBucket: "nursery-project-98588.firebasestorage.app",
  messagingSenderId: "757648103510",
  appId: "1:757648103510:web:e8357c85f7bb1ddf4383f7",
  measurementId: "G-HNH58YYQWW"
};

// Initialize Firebase
// Using getApps() check to prevent re-initialization during hot-reloads
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Iterate analytics only if supported (client-side)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.error("Firebase Analytics failed to initialize", e);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };
export default app;
