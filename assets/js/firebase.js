// assets/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js"; // novo

// cola o firebaseConfig que apareceu na tela do console:
const firebaseConfig = {
  apiKey: "AIzaSyBXKI6_aX3OH7OjZ6fRHMSR383odx06eO0",
  authDomain: "samambaiamilgraus-51dd0.firebaseapp.com",
  projectId: "samambaiamilgraus-51dd0",
  storageBucket: "samambaiamilgraus-51dd0.firebasestorage.app",
  messagingSenderId: "528953928916",
  appId: "1:528953928916:web:403311965734d43cd11f41",
  measurementId: "G-QELZQ58XKC"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // novo
