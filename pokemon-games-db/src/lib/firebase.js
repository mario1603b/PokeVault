import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Sustituye estos valores por los de tu proyecto de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyACEM1AzlJBLBb9W4F4FqtpSyUZu51UMLg",
  authDomain: "pokedex-juegos.firebaseapp.com",
  projectId: "pokedex-juegos",
  storageBucket: "pokedex-juegos.firebasestorage.app",
  messagingSenderId: "456022624146",
  appId: "1:456022624146:web:02684c7ff2bb10fed7634b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);