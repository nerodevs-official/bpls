// resources/js/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

console.log('Initializing Firebase...'); // 🔍 DEBUG

const firebaseConfig = {
  apiKey: "AIzaSyC-g4pxZXP2fxHy_kk02HUikUJyRnMu4vg",
  authDomain: "subayapp.firebaseapp.com",
  databaseURL: "https://subayapp-default-rtdb.firebaseio.com",
  projectId: "subayapp",

};

const app = initializeApp(firebaseConfig);
console.log('Firebase initialized:', app?.options?.projectId); // 🔍 DEBUG

export const auth = getAuth(app);
export const database = getDatabase(app);