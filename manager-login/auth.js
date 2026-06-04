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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById('loginForm');
const messageBox = document.getElementById('messageBox'); 

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Mesaj kutusunu sıfırla
        messageBox.classList.add('d-none');
        messageBox.className = "text-center small mb-3 fw-bold p-2 rounded d-none";

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                // BAŞARILI: Yeşil kutu
                messageBox.textContent = "Giriş başarılı! Yönlendiriliyorsunuz...";
                messageBox.classList.add('text-success', 'bg-success-subtle', 'border', 'border-success');
                messageBox.classList.remove('d-none');

                // 5 saniye sonra yönlendir
                setTimeout(() => {
                    window.location.href = "app/appmenu.html";
                }, 2500);
            })
            .catch((error) => {
                // HATA: Kırmızı kutu
                messageBox.textContent = "Hatalı e-posta veya şifre!";
                messageBox.classList.add('text-danger', 'bg-danger-subtle', 'border', 'border-danger');
                messageBox.classList.remove('d-none');
                console.error("Giriş Hatası:", error);
            });
    });
}

// Oturum kontrolü
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    if (!user && currentPath.includes("app.html")) {
        window.location.href = "../login.html";
    }
});

// Şifre göster/gizle
const toggleBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        toggleBtn.querySelector('i').classList.toggle('bi-eye-fill');
        toggleBtn.querySelector('i').classList.toggle('bi-eye-slash-fill');
    });
}