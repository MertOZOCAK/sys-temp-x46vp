import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Yapılandırması (Orijinal config bilgilerin korundu)
const firebaseConfig = {
    apiKey: "AIzaSyCwXYbUjJr20WCrqhuNbPhiUA1oleeUSuQ",
    authDomain: "z-pazar.firebaseapp.com",
    projectId: "z-pazar",
    storageBucket: "z-pazar.firebasestorage.app",
    messagingSenderId: "185640177672",
    appId: "1:185640177672:web:6cb085e5474291d12d01bd"
};

// Firebase Servislerini Başlatma
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const adminsCol = collection(db, "admins");

// Giriş Kontrolü: Giriş yapmamışsa index'e at
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? "Giriş yapılı" : "Giriş yapılmadı");
    if (!user) {
        console.log("Redirecting to index...");
        window.location.href = window.location.origin + "/index.html";
    }
});

let editId = null;
let deleteId = null;

// HTML Elemanlarını Seçme
const adminForm = document.getElementById('adminForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const adminUserList = document.getElementById('adminUserList');
const adminCount = document.getElementById('adminCount');
const statusMessage = document.getElementById('statusMessage');
const deleteModal = document.getElementById('deleteModal');
const formTitle = document.getElementById('formTitle');
const addAdminBtn = document.getElementById('addAdminBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// --- BİLDİRİM (TOAST) FONKSİYONU ---
function showToast(msg, success = true) {
    statusMessage.textContent = msg;
    statusMessage.style.display = 'block';
    statusMessage.style.backgroundColor = success ? '#2ecc71' : '#dc3545';
    statusMessage.className = "toast-show";

    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

// --- VERİLERİ ANLIK ÇEKME VE LİSTELEME ---
onSnapshot(adminsCol, (snapshot) => {
    adminUserList.innerHTML = "";
    let count = 0;

    snapshot.forEach((doc) => {
        const adminData = doc.data();
        const adminId = doc.id;
        count++;

        const tr = document.createElement('tr');
        tr.className = 'user-row';
        tr.innerHTML = `
            <td class="ps-4 fw-semibold text-secondary">${adminData.email}</td>
            <td><span class="status-badge"><i class="bi bi-check-circle-fill"></i> Aktif</span></td>
            <td class="pe-4">
                <div class="action-group">
                    <button class="btn-action btn-light text-warning" title="Şifre Düzenle" onclick="editAdmin('${adminId}', '${adminData.email}')">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn-action btn-action-delete" title="Yöneticiyi Sil" onclick="promptDelete('${adminId}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        adminUserList.appendChild(tr);
    });

    adminCount.textContent = `${count} Aktif`;
});

// --- YÖNETİCİ EKLEME VE DÜZENLEME (AUTH + FIRESTORE) ---
adminForm.onsubmit = async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showToast("Lütfen alanları eksiksiz doldurun!", false);
        return;
    }

    try {
        if (editId) {
            // --- DÜZENLEME MODU (Sadece Şifre Güncelleme) ---
            // Parantezler burada tamamen ayrıldı ve setDoc'un doğru çalışması sağlandı
            await setDoc(doc(db, "admins", editId), {
                email: email,
                password: password,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            showToast("Yönetici bilgileri güncellendi!");
            resetForm();
        } else {
            // --- EKLEME MODU (AUTH KULLANICI OLUŞTURMA) ---
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "admins", user.uid), {
                email: email,
                password: password,
                createdAt: new Date().toISOString()
            });

            showToast("Yönetici Firebase Auth sistemine başarıyla kaydedildi!");
            adminForm.reset();
        }
    } catch (error) {
        console.error("Hata:", error);
        if (error.code === "auth/email-already-in-use") {
            showToast("Bu e-posta adresi zaten kullanımda!", false);
        } else if (error.code === "auth/weak-password") {
            showToast("Şifre en az 6 karakter olmalıdır!", false);
        } else {
            showToast("İşlem sırasında bir hata oluştu!", false);
        }
    }
};

// --- DÜZENLEME MODUNU TETİKLEME ---
window.editAdmin = (id, email) => {
    editId = id;
    emailInput.value = email;
    emailInput.disabled = true;
    passwordInput.placeholder = "Yeni Şifre Giriniz";
    formTitle.textContent = "Şifreyi Düzenle";
    addAdminBtn.textContent = "Şifreyi Güncelle";
    cancelEditBtn.classList.remove('d-none');
};

// --- DÜZENLEME İPTAL ---
cancelEditBtn.onclick = () => {
    resetForm();
};

function resetForm() {
    editId = null;
    adminForm.reset();
    emailInput.disabled = false;
    passwordInput.placeholder = "••••••••";
    formTitle.textContent = "Yeni Yönetici Ekle";
    addAdminBtn.textContent = "Yöneticiyi Kaydet";
    cancelEditBtn.classList.add('d-none');
}

// --- SİLME MODALINI AÇMA ---
window.promptDelete = (id) => {
    deleteId = id;
    deleteModal.style.display = 'flex';
};

// --- SİLME İPTAL ---
document.getElementById('cancelDelete').onclick = () => {
    deleteId = null;
    deleteModal.style.display = 'none';
};

// --- SİLME ONAYI ---
document.getElementById('confirmDelete').onclick = async () => {
    if (!deleteId) return;

    try {
        const docRef = doc(db, "admins", deleteId);
        await deleteDoc(docRef);
        
        deleteModal.style.display = 'none';
        deleteId = null;
        showToast("Yönetici kaydı kaldırıldı! (Auth panelinden manuel silmeniz gerekebilir)", true);
    } catch (error) {
        console.error("Hata:", error);
        deleteModal.style.display = 'none';
        showToast("Silme işlemi başarısız oldu!", false);
    }
};