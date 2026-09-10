import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  CollectionReference,
  Query,
  DocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyD_JNEjKBTMzvKnjeSdx1HwL7ybO9wpo28',
  authDomain: 'gen-lang-client-0474738483.firebaseapp.com',
  projectId: 'gen-lang-client-0474738483',
  storageBucket: 'gen-lang-client-0474738483.firebasestorage.app',
  messagingSenderId: '1018982824373',
  appId: '1:1018982824373:web:499daf9fb1a4926687c1fc',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  'ai-studio-nightgram-b14862e2-9d77-4f26-8ef2-6ff83886e3b4'
);

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
};

export type { DocumentReference, CollectionReference, Query, DocumentSnapshot, QuerySnapshot, FirebaseUser };
