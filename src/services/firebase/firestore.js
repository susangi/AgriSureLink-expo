import { db } from "./config";
import { 
  collection, addDoc, getDocs, query, where 
} from "firebase/firestore";

// Add claim
export async function addClaim(userId, data) {
  return await addDoc(collection(db, "claims"), {
    userId,
    ...data,
    createdAt: new Date(),
  });
}

// Get user claims
export async function getClaims(userId) {
  const q = query(collection(db, "claims"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
