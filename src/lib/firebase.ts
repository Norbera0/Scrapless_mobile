
'use client';
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, terminate } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  projectId: 'scrapless-bzy61',
  appId: '1:866902679735:web:09651336c25cad07412d32',
  storageBucket: 'scrapless-bzy61.firebasestorage.app',
  apiKey: 'AIzaSyADKNT7geO88EM0tytBrFH8DcATT_lpP9E',
  authDomain: 'scrapless-bzy61.firebasestorage.app',
  measurementId: '866902679735',
  messagingSenderId: '607204493465',
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open. Offline persistence will only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
      }
    });
}

// Function to terminate Firestore connection, e.g., on logout
const cleanupFirestore = async () => {
  await terminate(db);
}

export { app, auth, db, cleanupFirestore };
