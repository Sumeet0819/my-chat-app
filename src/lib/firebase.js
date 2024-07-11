// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCseGi20Gxavtl2ZDdX4eAEvJjx3-FxqHs",
  authDomain: "chat-996a2.firebaseapp.com",
  databaseURL: "https://chat-996a2-default-rtdb.firebaseio.com",
  projectId: "chat-996a2",
  storageBucket: "chat-996a2.appspot.com",
  messagingSenderId: "1023882184407",
  appId: "1:1023882184407:web:c251cb155fbf567bbb1292",
  measurementId: "G-J0DWMQS4NT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app)

// Initialize Firebase Analytics (only in the browser)
if (typeof window !== 'undefined') {
  const analytics = getAnalytics(app);
}

;

export {app,database, auth };
