// DOM Elementleri
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const rememberMe = document.getElementById('rememberMe');

// Şifre Göster/Gizle Butonu
passwordToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    const icon = passwordToggle.querySelector('i');
    icon.classList.toggle('bi-eye');
    icon.classList.toggle('bi-eye-slash');
});

// Hata Mesajını Göster
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Hata Mesajını Gizle
function hideError() {
    errorMessage.classList.remove('show');
}

// Form Gönderilmesi
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Lütfen tüm alanları doldurunuz.');
        return;
    }

    // Giriş Butonu Devre Dışı Bırak
    loginBtn.disabled = true;
    const originalButtonText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Giriş yapılıyor...';

    try {
        // Şimdilik demo - Gerçek giriş işlemi yapılacak
        console.log('Giriş Denemesi:', { email, rememberMe: rememberMe.checked });

        // Beni Hatırla İşaretlenirse
        if (rememberMe.checked) {
            localStorage.setItem('rememberEmail', email);
        } else {
            localStorage.removeItem('rememberEmail');
        }

        // Başarılı Mesajı (Demo)
        showError('Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz...');
        
        setTimeout(() => {
            window.location.href = '../index1.html';
        }, 1500);

    } catch (error) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalButtonText;
        showError('Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.');
    }
});

// Sayfa Yüklenmesinde Hatırlanmış Email'i Doldur
window.addEventListener('load', () => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMe.checked = true;
    }
});
