/**
 * YUMCRAFT KITCHEN — FIREBASE CONFIGURATION TEMPLATE
 * Sao chép file này thành js/firebase-config.js và điền thông số từ Firebase Console của bạn.
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  updateDoc,
  runTransaction,
  orderBy,
  limit,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Điền thông số Firebase Project của bạn vào đây
export const defaultFirebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

export function getActiveFirebaseConfig() {
  return defaultFirebaseConfig;
}

export function isFirebaseConfigured() {
  const cfg = getActiveFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.apiKey !== "YOUR_API_KEY" && cfg.projectId);
}

let appInstance = null;
let authInstance = null;
let dbInstance = null;

try {
  const config = getActiveFirebaseConfig();
  if (isFirebaseConfigured()) {
    appInstance = !getApps().length ? initializeApp(config) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    console.log("🔥 Firebase đã được khởi tạo thành công!");
  } else {
    console.info("ℹ️ Firebase đang ở chế độ chờ cấu hình (Local Mock Mode).");
  }
} catch (error) {
  console.error("Lỗi khởi tạo Firebase SDK:", error);
}

export {
  appInstance as app,
  authInstance as auth,
  dbInstance as db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  runTransaction,
  orderBy,
  limit,
  serverTimestamp
};
