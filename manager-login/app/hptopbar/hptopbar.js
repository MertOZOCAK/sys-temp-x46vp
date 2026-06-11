import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
const topbarForm = document.getElementById('topbarForm');
const tbList = document.getElementById('tbList');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editIdInput = document.getElementById('editId');
const statusMessage = document.getElementById('statusMessage');
const topbarCount = document.getElementById('topbarCount');
const tbIconInput = document.getElementById('tbIcon');
const iconGridContainer = document.getElementById('iconGridContainer');
const iconSearchInput = document.getElementById('iconSearchInput');
const selectIconBtn = document.getElementById('selectIconBtn');

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

// Seç Butonu Animasyon Mekanizması
if (selectIconBtn) {
    selectIconBtn.addEventListener('click', () => {
        const iconElement = selectIconBtn.querySelector('i');
        if (iconElement) {
            iconElement.classList.add('spin-animation');
            // Animasyon bittiğinde class'ı temizle ki bir sonraki tıklamada tekrar dönebilsin
            iconElement.addEventListener('animationend', () => {
                iconElement.classList.remove('spin-animation');
            }, { once: true });
        }
    });
}

// Popüler Bootstrap İkonları Listesi
const popularIcons = [
    { name: 'Kamyon', code: 'bi bi-truck' },
    { name: 'Mağaza', code: 'bi bi-shop' },
    { name: 'Sepet', code: 'bi bi-cart' },
    { name: 'Yıldız', code: 'bi bi-star' },
    { name: 'Etiket / İndirim', code: 'bi bi-tag' },
    { name: 'Bilgi / Info', code: 'bi bi-info-circle' },
    { name: 'Zil / Duyuru', code: 'bi bi-bell' },
    { name: 'Kalp', code: 'bi bi-heart' },
    { name: 'Yıldırım / Hızlı', code: 'bi bi-lightning' },
    { name: 'Yıldırım / Detaylı', code: 'bi bi-lightning-charge' },
    { name: 'Hediye', code: 'bi bi-gift' },
    { name: 'Kargo Kutusu', code: 'bi bi-box' },
    { name: 'Kargo Kutusu (Çizgili)', code: 'bi bi-box-seam' },
    { name: 'Çanta', code: 'bi bi-bag' },
    { name: 'Çanta (Kalpli)', code: 'bi bi-bag-heart' },
    { name: 'Yüzde / Fırsat', code: 'bi bi-percent' },
    { name: 'Mücevher / Premium', code: 'bi bi-gem' },
    { name: 'Ödül / Başarı', code: 'bi bi-award' },
    { name: 'Ayarlar', code: 'bi bi-gear' },
    { name: 'E-Posta / Mektup', code: 'bi bi-envelope' },
    { name: 'Telefon', code: 'bi bi-phone' },
    { name: 'Sabit Telefon', code: 'bi bi-telephone' },
    { name: 'Arama / Filtre', code: 'bi bi-search' },
    { name: 'Anasayfa', code: 'bi bi-house' },
    { name: 'Dizüstü Bilgisayar', code: 'bi bi-laptop' },
    { name: 'Televizyon', code: 'bi bi-tv' },
    { name: 'Kamera / Fotoğraf', code: 'bi bi-camera' },
    { name: 'Oyun Kolu / Konsol', code: 'bi bi-controller' },
    { name: 'Ödül (Dolu)', code: 'bi bi-award-fill' },
    { name: 'Yıldız (Dolu)', code: 'bi bi-star-fill' },
    { name: 'Kalp (Dolu)', code: 'bi bi-heart-fill' },
    { name: 'Hediye (Dolu)', code: 'bi bi-gift-fill' },
    { name: 'Yer İşareti / Favori', code: 'bi bi-bookmark-star' },
    { name: 'Güneş / Parlaklık', code: 'bi bi-brightness-high' },
    { name: 'Hedef / Odak', code: 'bi bi-bullseye' },
    { name: 'Takvim Kontrol', code: 'bi bi-calendar-check' },
    { name: 'Nakit Para', code: 'bi bi-cash-stack' },
    { name: 'Sohbet Balonları', code: 'bi bi-chat-dots' },
    { name: 'Onay İşareti', code: 'bi bi-check-circle' },
    { name: 'Geçmiş / Zaman', code: 'bi bi-clock-history' },
    { name: 'Bulut Onay', code: 'bi bi-cloud-check' },
    { name: 'Kart / Ödeme', code: 'bi bi-credit-card' },
    { name: 'Monitör / Ekran', code: 'bi bi-display' },
    { name: 'Gülücük / Emoji', code: 'bi bi-emoji-smile' },
    { name: 'Göz / İncele', code: 'bi bi-eye' },
    { name: 'Bayrak', code: 'bi bi-flag' },
    { name: 'Konum / Harita', code: 'bi bi-geo-alt' },
    { name: 'Küresel / Dünya', code: 'bi bi-globe' },
    { name: 'Beğeni / Thumbs Up', code: 'bi bi-hand-thumbs-up' },
    { name: 'Gelen Kutusu', code: 'bi bi-inbox' },
    { name: 'Anahtar / Şifre', code: 'bi bi-key' },
    { name: 'Ampul / Fikir', code: 'bi bi-lightbulb' },
    { name: 'Bağlantı / Link', code: 'bi bi-link' },
    { name: 'Görev Listesi', code: 'bi bi-list-check' },
    { name: 'Alev / Trend', code: 'bi bi-fire' },
    { name: 'Kupa / Başarı', code: 'bi bi-trophy' },
    { name: 'Cüzdan', code: 'bi bi-wallet2' }
];

// İkon Listesini Render Etme Fonksiyonu
function renderIconGrid(searchTerm = '') {
    iconGridContainer.innerHTML = '';
    const filteredIcons = popularIcons.filter(icon =>
        icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        icon.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredIcons.length === 0) {
        iconGridContainer.innerHTML = '<div class="text-center text-muted w-100 py-3">İkon bulunamadı.</div>';
        return;
    }

    filteredIcons.forEach(icon => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        item.innerHTML = `
            <i class="${icon.code}"></i>
            <span>${icon.name}</span>
        `;
        item.addEventListener('click', () => {
            tbIconInput.value = icon.code;
            const modalEl = document.getElementById('iconPickerModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        });
        iconGridContainer.appendChild(item);
    });
}

// İkon Arama Event Listener
iconSearchInput.addEventListener('input', (e) => {
    renderIconGrid(e.target.value);
});

// Sayfa yüklendiğinde ilk gridi doldur
renderIconGrid();

// Realtime Data Fetching
const q = query(collection(db, 'topbar'), orderBy('createdAt', 'desc'));
onSnapshot(q, (snapshot) => {
    tbList.innerHTML = '';
    let activeCount = 0;

    snapshot.forEach((doc) => {
        const d = doc.data();
        if (d.active) activeCount++;

        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        tr.innerHTML = `
            <td class="ps-4 fw-semibold">${d.message}</td>
            <td><i class="${d.icon || 'bi bi-chat-left-text'} text-muted fs-5"></i></td>
            <td>
                <span class="badge ${d.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} rounded-pill px-2.5 py-1">
                    ${d.active ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td class="text-end pe-4">
                <div class="d-flex justify-content-end gap-1 gap-md-2">
                    <button class="btn-action toggle-btn btn ${d.active ? 'btn-light text-warning' : 'btn-light text-success'}" data-id="${doc.id}" data-active="${d.active}" title="${d.active ? 'Pasife Al' : 'Aktife Al'}">
                        <i class="bi ${d.active ? 'bi-eye-slash-fill' : 'bi-eye-fill'}"></i>
                    </button>
                    <button class="btn-action edit-btn btn btn-light text-primary" data-id="${doc.id}" title="Düzenle">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn-action delete-btn btn btn-light text-danger" data-id="${doc.id}" title="Sil">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </td>
        `;
        tbList.appendChild(tr);
    });

    topbarCount.textContent = `${activeCount} Aktif`;
});

// Form Submit (Ekleme / Güncelleme)
topbarForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageVal = document.getElementById('tbMessage').value.trim();
    if (!messageVal) { showToast('Mesaj metni gerekli', false); return; }

    const data = {
        message: messageVal,
        icon: document.getElementById('tbIcon').value.trim(),
        active: document.getElementById('tbActive').checked,
        updatedAt: serverTimestamp()
    };
    try {
        if (editIdInput.value) {
            await updateDoc(doc(db, 'topbar', editIdInput.value), data);
            showToast('Mesaj güncellendi');
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, 'topbar'), data);
            showToast('Mesaj eklendi');
        }
        resetForm();
    } catch (err) { showToast('Hata: ' + err.message, false); }
});

// Liste içi tıklama aksiyonları
tbList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;

    if (btn.classList.contains('delete-btn')) {
        if (confirm('Bu mesajı silmek istediğinize emin misiniz?')) {
            try {
                await deleteDoc(doc(db, 'topbar', id));
                showToast('Mesaj silindi');
            } catch (err) { showToast('Hata: ' + err.message, false); }
        }
    } else if (btn.classList.contains('edit-btn')) {
        try {
            const snap = await getDoc(doc(db, 'topbar', id));
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById('tbMessage').value = d.message;
                tbIconInput.value = d.icon || '';
                document.getElementById('tbActive').checked = d.active;
                editIdInput.value = id;

                formTitle.innerText = 'Mesajı Düzenle';
                submitBtn.innerText = 'Güncelle';
                cancelEditBtn.classList.remove('d-none');
            }
        } catch (err) { showToast('Hata: ' + err.message, false); }
    } else if (btn.classList.contains('toggle-btn')) {
        try {
            const currentActive = btn.dataset.active === 'true';
            await updateDoc(doc(db, 'topbar', id), {
                active: !currentActive,
                updatedAt: serverTimestamp()
            });
            showToast(!currentActive ? 'Mesaj aktif edildi' : 'Mesaj deaktif edildi');
        } catch (err) { showToast('Hata: ' + err.message, false); }
    }
});

cancelEditBtn.onclick = () => resetForm();

function resetForm() {
    topbarForm.reset();
    editIdInput.value = '';
    formTitle.innerText = 'Yeni Mesaj Ekle';
    submitBtn.innerText = 'Kaydet';
    cancelEditBtn.classList.add('d-none');
}

function showToast(message, isSuccess = true) {
    statusMessage.textContent = message;
    statusMessage.style.backgroundColor = isSuccess ? '#198754' : '#dc3545';
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 2500);
}