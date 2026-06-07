import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // Importlara ekledik
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Yapılandırması (Kendi bilgilerini buraya da eklemelisin)
const firebaseConfig = {
    apiKey: "AIzaSyCwXYbUjJr20WCrqhuNbPhiUA1oleeUSuQ",
    authDomain: "z-pazar.firebaseapp.com",
    projectId: "z-pazar",
    storageBucket: "z-pazar.firebasestorage.app",
    messagingSenderId: "185640177672",
    appId: "1:185640177672:web:6cb085e5474291d12d01bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // BU EKSİKTİ
const auth = getAuth(app);

// Giriş Kontrolü: Giriş yapmamışsa index'e at
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? "Giriş yapılı" : "Giriş yapılmadı");
    if (!user) {
        console.log("Redirecting to index...");
        window.location.href = window.location.origin + "/index.html";
    }
});