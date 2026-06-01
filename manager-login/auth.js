import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCwXYbUjJr20WCrqhuNbPhiUA1oleeUSuQ",
    authDomain: "z-pazar.firebaseapp.com",
    projectId: "z-pazar",
    storageBucket: "z-pazar.firebasestorage.app",
    messagingSenderId: "185640177672",
    appId: "1:185640177672:web:6cb085e5474291d12d01bd"
};

// Firebase'i bir kez başlatıyoruz
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Eğer bu dosya login sayfasında çalışıyorsa formu dinle
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                // Başarılı girişte yönlendirilecek sayfa
                window.location.href = "app/app.html";
            })
            .catch((error) => {
                alert("Hatalı giriş! Lütfen bilgilerinizi kontrol edin.");
                console.error("Giriş Hatası:", error);
            });
    });
}

// Oturum kontrolü: Eğer kullanıcı zaten giriş yapmışsa veya yapmamışsa yapılacaklar
onAuthStateChanged(auth, (user) => {
    // Bu kısım admin (app.html) sayfasında koruma sağlar
    const currentPath = window.location.pathname;
    if (!user && currentPath.includes("app.html")) {
        window.location.href = "../login.html"; // Giriş yapmamışsa geri gönder
    }
});

const toggleBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

toggleBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;

    // İkon değiştirme
    const icon = toggleBtn.querySelector('i');
    icon.classList.toggle('bi-eye-fill');
    icon.classList.toggle('bi-eye-slash-fill');
});