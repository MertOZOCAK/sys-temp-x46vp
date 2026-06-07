import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // Importlara ekledik
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
        // Güvenli yönlendirme: eğer URL içinde 'manager-login' varsa onun üstüne
        // çıkıp site kökündeki index.html'e git; yoksa GitHub Pages repo köküne git.
        const getSiteIndexPath = () => {
            const parts = window.location.pathname.split('/').filter(Boolean);
            const adminIndex = parts.indexOf('manager-login');
            if (adminIndex > -1) {
                const baseParts = parts.slice(0, adminIndex);
                if (baseParts.length === 0) return '/index.html';
                return '/' + baseParts.join('/') + '/index.html';
            }
            if (parts.length === 0) return '/index.html';
            return '/' + parts[0] + '/index.html';
        };
        const indexPath = getSiteIndexPath();
        window.location.href = window.location.origin + indexPath;
    }
});