// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBxv4lE5iCM-6mSnKaLhrJxYCSXt9thL48",
  authDomain: "insuaranceapp-89261.firebaseapp.com",
  projectId: "insuaranceapp-89261",
  storageBucket: "insuaranceapp-89261.firebasestorage.app",
  messagingSenderId: "243919413656",
  appId: "1:243919413656:web:66309d30ea6b3720a34bed",
  measurementId: "G-98Q5KM9XWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);