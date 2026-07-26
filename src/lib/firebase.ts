import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_JNEjKBTMzvKnjeSdx1HwL7ybO9wpo28",
  authDomain: "gen-lang-client-0474738483.firebaseapp.com",
  projectId: "gen-lang-client-0474738483",
  storageBucket: "gen-lang-client-0474738483.firebasestorage.app",
  messagingSenderId: "1018982824373",
  appId: "1:1018982824373:web:499daf9fb1a4926687c1fc"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-nightgram-b14862e2-9d77-4f26-8ef2-6ff83886e3b4");
