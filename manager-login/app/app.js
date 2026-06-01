import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Yapılandırması
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

// HTML Elementleri
const productForm = document.getElementById('productForm');
const adminProductList = document.getElementById('adminProductList');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEdit');
const editIdInput = document.getElementById('editId');

// 1. Oturum Kontrolü
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "../../index.html";
});

// 2. Ürünleri Listeleme (Kopyala Butonu Eklendi)
const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    adminProductList.innerHTML = "";
    document.getElementById('productCount').innerText = `${snapshot.size} Ürün Aktif`;
    
    snapshot.forEach((doc) => {
        const product = doc.data();
        const row = `
            <tr class="product-row">
                <td data-label="Ürün" class="ps-4">
                    <div class="d-flex align-items-center">
                        <img src="${product.images[0]}" class="product-img-preview me-3 border">
                        <div class="fw-bold">${product.title}</div>
                    </div>
                </td>
                <td data-label="Kategori">
                    <span class="badge bg-light text-dark rounded-pill">${product.category}</span>
                </td>
                <td data-label="Fiyat" class="text-primary fw-bold">
                    ${new Intl.NumberFormat('tr-TR').format(product.price)} TL
                </td>
                <td class="text-end pe-4">
                    <div class="d-flex justify-content-end gap-2">
                        <button class="btn-action bg-primary-subtle text-primary edit-btn" data-id="${doc.id}" title="Düzenle">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn-action bg-success-subtle text-success copy-btn" data-id="${doc.id}" title="Kopyala">
                            <i class="bi bi-layers-fill"></i>
                        </button>
                        <button class="btn-action bg-danger-subtle text-danger delete-btn" data-id="${doc.id}" title="Sil">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        adminProductList.innerHTML += row;
    });
});

// 3. İşlem Butonlarını Yönetme (Sil, Düzenle, Kopyala)
adminProductList.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;

    // SİLME İŞLEMİ
    if (target.classList.contains('delete-btn')) {
        if (confirm("Bu ürünü silmek istediğine emin misin?")) {
            await deleteDoc(doc(db, "products", id));
        }
    }

    // DÜZENLEME VE KOPYALAMA İŞLEMİ (Ortak Veri Çekme)
    if (target.classList.contains('edit-btn') || target.classList.contains('copy-btn')) {
        const isCopy = target.classList.contains('copy-btn');
        
        try {
            const docRef = doc(db, "products", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const product = docSnap.data();

                // Formu doldur
                document.getElementById('pName').value = product.title;
                document.getElementById('pCategory').value = product.category;
                document.getElementById('pPrice').value = product.price;
                document.getElementById('pDesc').value = product.description;
                document.getElementById('productImage1').value = product.images[0] || "";
                document.getElementById('productImage2').value = product.images[1] || "";

                if (isCopy) {
                    // KOPYALAMA MODU: ID'yi boş bırak ki yeni ürün olarak kaydedilsin
                    editIdInput.value = "";
                    formTitle.innerText = "Ürünü Kopyala (Yeni Olarak Ekle)";
                    submitBtn.innerText = "Kopyayı Yayınla";
                } else {
                    // DÜZENLEME MODU
                    editIdInput.value = id;
                    formTitle.innerText = "Ürünü Düzenle";
                    submitBtn.innerText = "Değişiklikleri Kaydet";
                }
                
                cancelEditBtn.classList.remove('d-none');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error("Veri çekme hatası:", error);
        }
    }
});

// 4. Ekleme veya Güncelleme İşlemi
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = editIdInput.value;
    const data = {
        title: document.getElementById('pName').value,
        category: document.getElementById('pCategory').value,
        price: Number(document.getElementById('pPrice').value),
        description: document.getElementById('pDesc').value,
        images: [document.getElementById('productImage1').value, document.getElementById('productImage2').value || ""],
        updatedAt: serverTimestamp()
    };

    try {
        if (editId) {
            // Düzenleme
            await updateDoc(doc(db, "products", editId), data);
            alert("Ürün güncellendi!");
        } else {
            // Yeni Ekleme (veya Kopyalama)
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, "products"), data);
            alert("Ürün başarıyla yayınlandı!");
        }
        resetForm();
    } catch (err) { console.error(err); }
});

// 5. Form Sıfırlama
function resetForm() {
    productForm.reset();
    editIdInput.value = "";
    formTitle.innerText = "Yeni Ürün Ekle";
    submitBtn.innerText = "Ürünü Yayınla";
    cancelEditBtn.classList.add('d-none');
}

cancelEditBtn.onclick = resetForm;
document.getElementById('logoutBtn').onclick = () => signOut(auth);