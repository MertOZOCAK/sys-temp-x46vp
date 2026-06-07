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

// Elements
const topbarForm = document.getElementById('topbarForm');
const tbList = document.getElementById('tbList');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editIdInput = document.getElementById('editId');
const statusMessage = document.getElementById('statusMessage');

// Giriş Kontrolü: Giriş yapmamışsa index'e at
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

// Real-time list rendered as table rows
const q = query(collection(db, 'topbar'), orderBy('createdAt', 'desc'));
onSnapshot(q, (snapshot) => {
    tbList.innerHTML = '';
    let activeCount = 0;
    snapshot.forEach(docSnap => {
        const d = { id: docSnap.id, ...docSnap.data() };
        if (d.active) activeCount++;
        const tr = document.createElement('tr');
        tr.className = 'product-row';

        const iconHtml = d.icon ? `<i class="${d.icon} text-primary" style="font-size:18px"></i>` : `<i class="bi bi-info-circle text-muted" style="font-size:18px"></i>`;

        tr.innerHTML = `
            <td class="ps-4" data-label="MESAJ">
                <div class="d-flex align-items-center">
                    <div style="width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#f8fafc;border:1px solid #eef2f6;">${iconHtml}</div>
                    <div class="fw-bold text-truncate ms-3">${d.message}</div>
                </div>
            </td>
            <td data-label="İKON"><span class="badge bg-white text-dark rounded-pill border border-1 border-light py-2 px-3">${d.icon || '-'}</span></td>
            <td data-label="DURUM"><span class="${d.active ? 'badge bg-success' : 'badge bg-secondary'}">${d.active ? 'Aktif' : 'Pasif'}</span></td>
            <td class="text-end pe-4" data-label="İŞLEM">
                <div class="d-flex justify-content-end gap-2 action-group">
                    <button class="btn-action btn-toggle ${d.active ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}" data-id="${d.id}" data-action="toggle">${d.active ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>'}</button>
                    <button class="btn-action bg-primary-subtle text-primary edit-btn" data-id="${d.id}" data-action="edit"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn-action bg-danger-subtle text-danger delete-btn" data-id="${d.id}" data-action="delete"><i class="bi bi-trash3-fill"></i></button>
                </div>
            </td>
        `;

        tbList.appendChild(tr);
    });
    const topbarCount = document.getElementById('topbarCount');
    if (topbarCount) topbarCount.textContent = `${activeCount} Aktif`;
});

// Inline controls: toggle active / edit / delete
tbList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
        if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return;
        await deleteDoc(doc(db, 'topbar', id));
        showToast('Mesaj silindi', false);
    } else if (action === 'edit') {
        const docSnap = await getDoc(doc(db, 'topbar', id));
        if (docSnap.exists()) {
            const d = docSnap.data();
            document.getElementById('tbMessage').value = d.message || '';
            document.getElementById('tbIcon').value = d.icon || '';
            document.getElementById('tbActive').checked = !!d.active;
            editIdInput.value = id;
            formTitle.innerText = 'Mesajı Düzenle';
            submitBtn.innerText = 'Güncelle';
            cancelEditBtn.classList.remove('d-none');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else if (action === 'toggle') {
        const docRef = doc(db, 'topbar', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;
        const current = docSnap.data().active;
        await updateDoc(docRef, { active: !current, updatedAt: serverTimestamp() });
        showToast(!current ? 'Mesaj aktif edildi' : 'Mesaj pasif edildi');
    }
});

// Submit
topbarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Validation
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
    statusMessage.className = 'toast-show';
    setTimeout(() => {
        statusMessage.className = 'toast-hide';
        setTimeout(() => { statusMessage.style.display = 'none'; }, 400);
    }, 2000);
}
