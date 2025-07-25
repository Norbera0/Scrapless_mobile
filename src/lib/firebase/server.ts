
import { initializeServerApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    projectId: 'scrapless-66nyt',
    appId: '1:607204493465:web:01fc85b8c8ab4b7e99d008',
    storageBucket: 'scrapless-66nyt.firebasestorage.app',
    apiKey: 'AIzaSyDg5fap5Ezu1XX6vcCBzOFpEXF8fE0xDF8',
    authDomain: 'scrapless-66nyt.firebaseapp.com',
    measurementId: '',
    messagingSenderId: '607204493465',
};

// This is a server-only file.
// Using experimental feature of firebase/app to get a server-side instance of firebase
// This is to avoid using the client-side SDK on the server.
const app = initializeServerApp(firebaseConfig, {
    auth: {
        credential: {
            getAccessToken: () => {
                return {
                    expirationTime: -1,
                    accessToken: '',
                }
            }
        }
    }
});
const auth = getAuth(app);

export { auth };
