// /home/user/studio/src/lib/firebase-admin.ts

import { initializeApp, getApps, App, deleteApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_APP_NAME = 'firebase-admin-app-singleton';

// This ensures we have a single, memoized admin app instance.
let adminApp: App;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // If other apps exist, find our specific one.
  if (getApps().length) {
    const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
    if (existingApp) {
      adminApp = existingApp;
      return adminApp;
    }
  }
  
  console.log('[Firebase Admin] Initializing new admin app singleton...');
  adminApp = initializeApp({
    storageBucket: 'scrapless-bzy61',
    // The SDK will automatically use the project's default service account
    // when running in a Google Cloud environment.
  }, ADMIN_APP_NAME);

  return adminApp;
}

adminApp = getAdminApp();
const adminStorage = getStorage(adminApp);
const adminDb = getFirestore(adminApp);

// Graceful shutdown for development hot-reloading
if (process.env.NODE_ENV === 'development') {
    process.on('SIGTERM', async () => {
        console.log('[Firebase Admin] SIGTERM received. Deleting admin app.');
        if (adminApp) {
            await deleteApp(adminApp);
        }
        process.exit(0);
    });
}


export { adminApp, adminStorage, adminDb };
