import { auth } from "./config";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";

// Register
export async function register(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

// Login
export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

// Logout
export async function logout() {
  return await signOut(auth);
}
