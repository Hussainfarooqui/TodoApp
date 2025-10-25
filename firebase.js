import {
  getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, where, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";

// --- CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBMz3ARLuyIvk4sZJOijU2htWUtJAMgiLU",
  authDomain: "todoapp-e1a80.firebaseapp.com",
  projectId: "todoapp-e1a80",
  storageBucket: "todoapp-e1a80.firebasestorage.app",
  messagingSenderId: "732481125245",
  appId: "1:732481125245:web:36ba27cb75b3c08c1a6a14",
  measurementId: "G-WH8GRBHFPW"
};

// --- INIT ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- FUNCTIONS ---
function initFirebase() {
  console.log("✅ Firebase initialized");
}

// ✅ SIGN-IN (ANONYMOUS)
async function signInAnon() {
  await signInAnonymously(auth);
}

// ✅ SIGN-OUT
async function signOutUser() {
  await signOut(auth);
}

// ✅ WATCH AUTH CHANGES
function onAuthChange(callback) {
  onAuthStateChanged(auth, (user) => callback(user));
}

// ✅ ADD TODO
async function addTodo(text) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not signed in");
  if (!text || typeof text !== "string") throw new Error("Text must be a non-empty string");

  await addDoc(collection(db, "todos"), {
    userId: user.uid,
    text: text,
    completed: false,
    createdAt: serverTimestamp()
  });
}

// ✅ UPDATE TODO
async function updateTodo(id, data) {
  await updateDoc(doc(db, "todos", id), data);
}

// ✅ DELETE TODO
async function deleteTodo(id) {
  await deleteDoc(doc(db, "todos", id));
}

// ✅ SUBSCRIBE TO TODOS
function subscribeTodos(callback) {
  const user = auth.currentUser;
  if (!user) return;
  const q = query(collection(db, "todos"), where("userId", "==", user.uid));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      data: d.data()
    }));
    callback(items);
  });
}

// ✅ EXPORT EVERYTHING
export {
  db,
  auth,
  initFirebase,
  signInAnon,
  signOutUser,
  onAuthChange,
  addTodo,
  subscribeTodos,
  updateTodo,
  deleteTodo
};
