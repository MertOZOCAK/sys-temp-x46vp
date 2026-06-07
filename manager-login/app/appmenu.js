import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);

const logoutBtn = document.getElementById('logoutBtn');

// Çıkış İşlemi
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        try {
            await signOut(auth);
            window.location.href = "../../index.html";
        } catch (err) {
            console.error("Çıkış hatası:", err);
            alert("Çıkış yapılırken hata oluştu!");
        }
    };
}

// Oturum durumu kontrol (sayfaya her erişimde kontrol et)
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Oturumu kapalı ise login sayfasına yönlendir
        window.location.href = "../../index.html";
    } else {
        // Oturumu açık ise devam et (isteğe bağlı: konsola yazdır)
        console.log("Kullanıcı oturumu açık:", user.email);
        // Sayfa yüklenmesini serbest bırak
        document.body.style.display = "block";
    }
});

// Sayfa yükleme sırasında beklet (oturum kontrolü yapılana kadar)
document.body.style.display = "none";
