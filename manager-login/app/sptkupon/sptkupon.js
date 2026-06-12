import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCwXYbUjJr20WCrqhuNbPhiUA1oleeUSuQ",
    authDomain: "z-pazar.firebaseapp.com",
    projectId: "z-pazar",
    storageBucket: "z-pazar.firebasestorage.app",
    messagingSenderId: "185640177672",
    appId: "1:185640177672:web:6cb085e5474291d12d01bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? "Giriş yapılı" : "Giriş yapılmadı");
    if (!user) {
        console.log("Redirecting to index...");
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

const couponForm = document.getElementById('couponForm');
const adminCouponList = document.getElementById('adminCouponList');
const cTargetProduct = document.getElementById('cTargetProduct');
const editIdInput = document.getElementById('editId');
const statusMessage = document.getElementById('statusMessage');
const deleteModal = document.getElementById('deleteModal');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let deleteId = null;
let allProducts = {};

// Ürünleri Listeye Çekme (Dinamik Select)
onSnapshot(collection(db, "products"), (snapshot) => {
    cTargetProduct.innerHTML = '<option value="all">Tüm Ürünlerde Geçerli</option>';
    allProducts = {};
    snapshot.forEach((doc) => {
        const product = doc.data();
        allProducts[doc.id] = product.title;
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = product.title;
        cTargetProduct.appendChild(option);
    });
});

// Kuponları Listeleme
onSnapshot(collection(db, "coupons"), (snapshot) => {
    adminCouponList.innerHTML = "";
    document.getElementById('couponCount').innerText = `${snapshot.size} Kupon Aktif`;
    
    if(snapshot.empty) {
        adminCouponList.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Henüz oluşturulmuş kupon bulunmuyor.</td></tr>`;
        return;
    }

    let couponArray = [];
    snapshot.forEach((docSnap) => {
        couponArray.push({ id: docSnap.id, ...docSnap.data() });
    });

    couponArray.sort((a, b) => (a.code || "").localeCompare(b.code || ""));

    couponArray.forEach((c) => {
        const targetName = c.targetProduct === "all" ? "Tüm Ürünler" : (allProducts[c.targetProduct] || "Ürün Silinmiş");
        const couponName = c.name || "İsimsiz Kupon";
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="ps-4 fw-semibold text-dark">${couponName}</td>
            <td class="fw-bold text-primary">${c.code}</td>
            <td>%${c.discount}</td>
            <td><span class="badge bg-light text-dark rounded-pill">${targetName}</span></td>
            <td class="text-end pe-4">
                <div class="action-group">
                    <button type="button" class="btn-action bg-success-subtle text-success clone-btn" data-id="${c.id}" title="Kuponu Klonla"><i class="bi bi-copy"></i></button>
                    <button type="button" class="btn-action bg-primary-subtle text-primary edit-btn" data-id="${c.id}" title="Düzenle"><i class="bi bi-pencil-fill"></i></button>
                    <button type="button" class="btn-action bg-danger-subtle text-danger delete-btn" data-id="${c.id}" title="Sil"><i class="bi bi-trash3-fill"></i></button>
                </div>
            </td>
        `;
        adminCouponList.appendChild(row);
    });
});

// Kaydet / Güncelle Form Gönderimi
couponForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('cName').value.trim(),
        code: document.getElementById('cCode').value.trim().toUpperCase(),
        discount: Number(document.getElementById('cDiscount').value),
        targetProduct: cTargetProduct.value
    };

    try {
        if (editIdInput.value) {
            await updateDoc(doc(db, "coupons", editIdInput.value), data);
            showToast("Kupon başarıyla güncellendi!");
        } else {
            await addDoc(collection(db, "coupons"), data);
            showToast("Kupon başarıyla eklendi!");
        }
        resetForm();
    } catch (err) { 
        showToast("Hata oluştu: " + err.message, false); 
    }
});

// Aksiyon Tıklamaları (Düzenle, Sil ve Klonla)
adminCouponList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-action');
    if (!btn) return;
    const id = btn.getAttribute('data-id');

    if (btn.classList.contains('delete-btn')) {
        deleteId = id;
        deleteModal.style.display = 'flex';
    } else if (btn.classList.contains('edit-btn')) {
        const snap = await getDoc(doc(db, "coupons", id));
        if (snap.exists()) {
            const c = snap.data();
            document.getElementById('cName').value = c.name || "";
            document.getElementById('cCode').value = c.code;
            document.getElementById('cDiscount').value = c.discount;
            cTargetProduct.value = c.targetProduct;
            editIdInput.value = id;
            
            formTitle.innerText = "Kuponu Düzenle";
            submitBtn.innerText = "Değişiklikleri Kaydet";
            cancelEditBtn.classList.remove('d-none');
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Form yukarıda olduğu için mobilde yukarı kaydırır
        }
    } else if (btn.classList.contains('clone-btn')) {
        const snap = await getDoc(doc(db, "coupons", id));
        if (snap.exists()) {
            const c = snap.data();
            document.getElementById('cName').value = (c.name || "") + " (Kopya)";
            document.getElementById('cCode').value = c.code + "2";
            document.getElementById('cDiscount').value = c.discount;
            cTargetProduct.value = c.targetProduct;
            editIdInput.value = ""; 
            
            formTitle.innerText = "Kuponu Klonla / Yeni Kupon";
            submitBtn.innerText = "Klon Olarak Yayınla";
            cancelEditBtn.classList.remove('d-none');
            showToast("Kupon forma aktarıldı.");
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Form yukarıda olduğu için mobilde yukarı kaydırır
        }
    }
});

// Form Sıfırlama
function resetForm() {
    couponForm.reset();
    editIdInput.value = "";
    formTitle.innerText = "Yeni Kupon Oluştur";
    submitBtn.innerText = "Kuponu Yayınla";
    cancelEditBtn.classList.add('d-none');
}

cancelEditBtn.onclick = resetForm;

// Toast Bildirimi
function showToast(msg, success = true) {
    statusMessage.innerText = msg;
    statusMessage.style.backgroundColor = success ? '#198754' : '#dc3545';
    statusMessage.style.display = 'block';
    setTimeout(() => { statusMessage.style.display = 'none'; }, 2500);
}

// Silme Onayları
document.getElementById('confirmDelete').onclick = async () => {
    if (deleteId) {
        await deleteDoc(doc(db, "coupons", deleteId));
        deleteModal.style.display = 'none';
        showToast("Kupon başarıyla silindi!", false);
        deleteId = null;
    }
};
document.getElementById('cancelDelete').onclick = () => {
    deleteModal.style.display = 'none';
    deleteId = null;
};