// Replace the config object below with your own Firebase config from the Firebase Console.
// See README.md for step-by-step setup instructions.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBWFKDY9xJ4yrPj1HmQsw7L3n5eMuJi_A8",
    authDomain: "personal-class-calendar.firebaseapp.com",
    projectId: "personal-class-calendar",
    storageBucket: "personal-class-calendar.firebasestorage.app",
    messagingSenderId: "113792075868",
    appId: "1:113792075868:web:3e8366d1f25fcbf4e1fe99",
    measurementId: "G-2C2JY5TPTV"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const firestoreApi = {
    classesCol: () => collection(db, "classes"),
    classDoc: (id) => doc(db, "classes", id),
    setDoc,
    getDocs,
    deleteDoc,
    updateDoc,
};
