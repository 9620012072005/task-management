// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore"; // For Firestore
import { getStorage } from "firebase/storage"; // Import Firebase Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJhD5oWlbGmD2Q7bxIm_noZ1MTwH33dpI",
  authDomain: "theenippetti-1ad68.firebaseapp.com",
  projectId: "theenippetti-1ad68",
  storageBucket: "theenippetti-1ad68.appspot.com",
  messagingSenderId: "34273682931",
  appId: "1:34273682931:web:b4597bf5e14a649efb1e86",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

// Export Firestore and Storage utilities
export {
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  setDoc,
  storage, // Properly export the storage instance
};
