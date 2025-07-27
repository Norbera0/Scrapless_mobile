
'use client';
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, terminate } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  projectId: 'scrapless-66nyt',
  appId: '1:607204493465:web:01fc85b8c8ab4b7e99d008',
  storageBucket: 'scrapless-66nyt.firebasestorage.app',
  apiKey: 'AIzaSyDg5fap5Ezu1XX6vcCBzOFpEXF8fE0xDF8',
  authDomain: 'scrapless-66nyt.firebaseapp.com',
  measurementId: '',
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
