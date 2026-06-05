import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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




// Elementler
const productForm = document.getElementById('productForm');
const adminProductList = document.getElementById('adminProductList');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editIdInput = document.getElementById('editId');
const statusMessage = document.getElementById('statusMessage');
const deleteModal = document.getElementById('deleteModal');
const logoutBtn = document.getElementById('logoutBtn');
let deleteId = null;

// Giriş Kontrolü: Giriş yapmamışsa index'e at
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../../index.html";
    }
});

// Çıkış İşlemi
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        try {
            await signOut(auth);
            window.location.href = "../../../index.html";
        } catch (err) {
            showToast("Çıkış yapılırken hata oluştu!", false);
        }
    };
}

// Kategori "Diğer" Dinamiği
window.toggleOtherInput = function () {
    const categorySelect = document.getElementById('pCategory');
    const otherInput = document.getElementById('otherCategoryInput');
    if (categorySelect.value === 'Diğer') {
        otherInput.classList.remove('d-none');
    } else {
        otherInput.classList.add('d-none');
        otherInput.value = "";
    }
};

// Ürünleri Listeleme
onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snapshot) => {
    adminProductList.innerHTML = "";
    const productCount = document.getElementById('productCount');
    if (productCount) {
        productCount.innerText = `${snapshot.size} Ürün Aktif`;
    }

    snapshot.forEach((docSnap, index) => {
        const p = docSnap.data();
        const row = document.createElement('tr');
        row.className = "product-row";
        row.style.animationDelay = `${index * 0.05}s`;

        row.innerHTML = `
            <td data-label="Ürün" class="ps-4">
                <div class="d-flex align-items-center">
                    <img src="${p.images[0]}" class="product-img-preview me-3 border">
                    <div class="fw-bold text-truncate">${p.title}</div>
                </div>
            </td>
            <td data-label="Kategori"><span class="badge bg-light text-dark rounded-pill">${p.category}</span></td>
            <td data-label="Fiyat" class="text-primary fw-bold">${new Intl.NumberFormat('tr-TR').format(p.price)} TL</td>
            <td data-label="İşlem" class="text-end pe-4">
                <div class="d-flex justify-content-end gap-2 action-group">
                    <button class="btn-action bg-primary-subtle text-primary edit-btn" data-id="${docSnap.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn-action bg-success-subtle text-success copy-btn" data-id="${docSnap.id}"><i class="bi bi-layers-fill"></i></button>
                    <button class="btn-action bg-danger-subtle text-danger delete-btn" data-id="${docSnap.id}"><i class="bi bi-trash3-fill"></i></button>
                </div>
            </td>
        `;
        adminProductList.appendChild(row);
    });
});

// Edit / Copy / Delete İşlemleri
adminProductList.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id;

    if (target.classList.contains('delete-btn')) {
        deleteId = id;
        deleteModal.style.display = 'flex';
    } else {
        const docSnap = await getDoc(doc(db, "products", id));
        if (docSnap.exists()) {
            const p = docSnap.data();
            document.getElementById('pName').value = p.title;
            document.getElementById('pPrice').value = p.price;
            document.getElementById('pDesc').value = p.description;
            document.getElementById('productImage1').value = p.images[0] || "";
            document.getElementById('productImage2').value = p.images[1] || "";

            const categorySelect = document.getElementById('pCategory');
            const otherInput = document.getElementById('otherCategoryInput');
            const options = Array.from(categorySelect.options).map(o => o.value);

            if (options.includes(p.category)) {
                categorySelect.value = p.category;
                otherInput.classList.add('d-none');
            } else {
                categorySelect.value = 'Diğer';
                otherInput.classList.remove('d-none');
                otherInput.value = p.category;
            }

            if (target.classList.contains('copy-btn')) {
                editIdInput.value = "";
                formTitle.innerText = "Ürünü Kopyala";
                submitBtn.innerText = "Kopyayı Yayınla";
            } else {
                editIdInput.value = id;
                formTitle.innerText = "Ürünü Düzenle";
                submitBtn.innerText = "Değişiklikleri Kaydet";
            }
            cancelEditBtn.classList.remove('d-none');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});

// Kaydet / Güncelle
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catSelect = document.getElementById('pCategory').value;
    const catOther = document.getElementById('otherCategoryInput').value;
    const finalCategory = (catSelect === 'Diğer' && catOther) ? catOther : catSelect;

    const data = {
        title: document.getElementById('pName').value,
        category: finalCategory,
        price: Number(document.getElementById('pPrice').value),
        description: document.getElementById('pDesc').value,
        images: [document.getElementById('productImage1').value, document.getElementById('productImage2').value || ""],
        updatedAt: serverTimestamp()
    };

    try {
        if (editIdInput.value) {
            await updateDoc(doc(db, "products", editIdInput.value), data);
            showToast("Ürün başarıyla güncellendi!");
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, "products"), data);
            showToast("Ürün başarıyla yayınlandı!");
        }
        resetForm();
    } catch (err) { showToast("Hata: " + err.message, false); }
});

// Sıfırlama
function resetForm() {
    productForm.reset();
    document.getElementById('otherCategoryInput').classList.add('d-none');
    editIdInput.value = "";
    formTitle.innerText = "Yeni Ürün Ekle";
    submitBtn.innerText = "Ürünü Yayınla";
    cancelEditBtn.classList.add('d-none');
}

cancelEditBtn.onclick = resetForm;

// Silme Onay
document.getElementById('confirmDelete').onclick = async () => {
    if (deleteId) {
        await deleteDoc(doc(db, "products", deleteId));
        showToast("Ürün silindi!", false);
        deleteModal.style.display = 'none';
    }
};
document.getElementById('cancelDelete').onclick = () => deleteModal.style.display = 'none';

// Toast Mesajı
function showToast(message, isSuccess = true) {
    statusMessage.textContent = message;
    statusMessage.style.backgroundColor = isSuccess ? '#198754' : '#dc3545';
    statusMessage.style.display = 'block';
    statusMessage.className = "toast-show";
    setTimeout(() => {
        statusMessage.className = "toast-hide";
        setTimeout(() => { statusMessage.style.display = 'none'; }, 400);
    }, 2500);
}
