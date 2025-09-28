// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxv4lE5iCM-6mSnKaLhrJxYCSXt9thL48",
  authDomain: "insuaranceapp-89261.firebaseapp.com",
  projectId: "insuaranceapp-89261",
  storageBucket: "insuaranceapp-89261.firebasestorage.app",
  messagingSenderId: "243919413656",
  appId: "1:243919413656:web:66309d30ea6b3720a34bed",
  measurementId: "G-98Q5KM9XWL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Enable persistence with AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
const db = getFirestore(app);

export { auth, db };
