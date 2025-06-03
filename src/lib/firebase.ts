
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore'; // Example if you need Firestore
// import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Example if you need Storage

const firebaseConfig = {
  apiKey: "AIzaSyDrSCyZX-LRSY3N2wbXKN2wS8YNl4rRtdg",
  authDomain: "joaco-barber.firebaseapp.com",
  projectId: "joaco-barber",
  storageBucket: "joaco-barber.firebasestorage.app",
  messagingSenderId: "787887364483",
  appId: "1:787887364483:web:d0ab6e60f3652cff037eb6",
  measurementId: "G-2166J95XK4"
};

let app: FirebaseApp;
let auth: Auth;
// let firestore: Firestore;
// let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
// firestore = getFirestore(app); // Initialize Firestore if needed
// storage = getStorage(app); // Initialize Storage if needed

export { app, auth /*, firestore, storage */ };
