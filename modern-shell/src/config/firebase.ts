import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAdENYvQg1gI_1pONInILcbQNX_Ji4Bss8',
  authDomain: 'expense-tracker-e0028.firebaseapp.com',
  databaseURL: 'https://expense-tracker-e0028.firebaseio.com',
  projectId: 'expense-tracker-e0028',
  storageBucket: 'expense-tracker-e0028.appspot.com',
  messagingSenderId: '927113629451',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
