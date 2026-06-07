import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

const updatesDocRef = doc(db, "appgunnot", "version_control");

// Giriş Kontrolü: Giriş yapmamışsa index'e at
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? "Giriş yapılı" : "Giriş yapılmadı");
    if (!user) {
        console.log("Redirecting to index...");
        window.location.href = window.location.origin + "/index.html";
    }
});

let globalActiveVersion = "";
let localNotesData = {};
let editOldNoteText = null; // Düzenlenen notun eski halini tutar

// Eleman Tanımlamaları
const formTitle = document.getElementById('formTitle');
const noteInput = document.getElementById('noteInput');
const addNoteBtn = document.getElementById('addNoteBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const statusMessage = document.getElementById('statusMessage');
const deleteModal = document.getElementById('deleteModal');
let deleteNoteTarget = null;


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

// Verileri Canlı Dinleme
onSnapshot(updatesDocRef, (docSnap) => {
    const tbody = document.getElementById('notesProductList');

    if (docSnap.exists()) {
        localNotesData = JSON.parse(JSON.stringify(docSnap.data()));
        globalActiveVersion = localNotesData.currentVersion || "v1.0";

        document.getElementById('versionInput').value = globalActiveVersion;
        document.getElementById('currentVersionBadge').innerText = globalActiveVersion + " Aktif";

        const safeVersionKey = "notes_" + globalActiveVersion.replace(/\./g, '_');
        const currentNotes = localNotesData[safeVersionKey] || [];

        tbody.innerHTML = '';

        if (currentNotes.length > 0) {
            currentNotes.forEach((noteText) => {
                const tr = document.createElement('tr');
                tr.className = 'note-row';
                tr.innerHTML = `
                            <td class="ps-4 fw-semibold text-secondary" style="font-size: 0.9rem;">${noteText}</td>
                            <td class="text-end pe-4">
                                <div class="action-group">
                                    <button class="btn-action btn-action-edit btn-edit-note" data-note="${noteText}" title="Düzenle">
                                        <i class="bi bi-pencil-fill"></i>
                                    </button>
                                    <button class="btn-action btn-action-delete btn-delete-note" data-note="${noteText}" title="Sil">
                                        <i class="bi bi-trash3-fill"></i>
                                    </button>
                                </div>
                            </td>
                        `;
                tbody.appendChild(tr);
            });

            // Silme Butonları Olay Tetikleyicisi
            document.querySelectorAll('.btn-delete-note').forEach(btn => {
                btn.onclick = function () {
                    const noteText = this.getAttribute('data-note');
                    deleteNote(noteText);
                };
            });

            // Düzenleme Butonları Olay Tetikleyicisi (Birinci Resimdeki Mantık)
            document.querySelectorAll('.btn-edit-note').forEach(btn => {
                btn.onclick = function () {
                    const noteText = this.getAttribute('data-note');
                    startEditMode(noteText);
                };
            });
        } else {
            tbody.innerHTML = `
                        <tr>
                            <td colspan="2" class="text-center text-muted py-4">
                                <i class="bi bi-info-circle me-1"></i> ${globalActiveVersion} sürümüne ait kayıtlı not bulunamadı.
                            </td>
                        </tr>`;
        }
    } else {
        globalActiveVersion = "v1.0";
        localNotesData = { currentVersion: "v1.0" };
        document.getElementById('versionInput').value = "v1.0";
        document.getElementById('currentVersionBadge').innerText = "v1.0 Sürümü Aktif";
        tbody.innerHTML = `
                    <tr>
                        <td colspan="2" class="text-center text-muted py-4">
                            Henüz bu sürüme ait not eklenmedi. İlk notu soldan ekleyebilirsiniz!
                        </td>
                    </tr>`;
    }
}, (error) => {
    console.error("Dinleme Hatası:", error);
});

// Düzenleme Modunu Sol Panelde Başlatma (Birinci Resimdeki Yapı)
function startEditMode(noteText) {
    editOldNoteText = noteText;
    noteInput.value = noteText; // Metni panele yazdır

    formTitle.innerText = "Notu Düzenle";
    addNoteBtn.innerHTML = `<i class="bi bi-save me-1"></i> Değişiklikleri Kaydet`;
    cancelEditBtn.classList.remove('d-none'); // Vazgeç butonunu göster
    noteInput.focus();
}

// Düzenleme Modundan Çıkış ve Formu Sıfırlama
function resetForm() {
    editOldNoteText = null;
    noteInput.value = "";
    formTitle.innerText = "Yeni Not Ekle";
    addNoteBtn.innerHTML = `<i class="bi bi-plus-lg me-1"></i> Notu Yayına Al`;
    cancelEditBtn.classList.add('d-none'); // Vazgeç butonunu gizle
}

cancelEditBtn.onclick = resetForm;

// Ekleme ve Düzenleme İşleminin Tetikleyicisi
addNoteBtn.onclick = async () => {
    const noteValue = noteInput.value.trim();

    if (noteValue === '') {
        alert('Lütfen güncelleme açıklamasını boş bırakmayın!');
        return;
    }

    if (!globalActiveVersion) {
        alert('Aktif sürüm bilgisi alınamadı.');
        return;
    }

    const safeVersionKey = "notes_" + globalActiveVersion.replace(/\./g, '_');

    try {
        if (!localNotesData[safeVersionKey]) {
            localNotesData[safeVersionKey] = [];
        }

        // --- DÜZENLENMİŞ VE ÇALIŞAN BLOK ---
        if (editOldNoteText !== null) {
            // DÜZENLEME MODU AKTİFSE
            localNotesData[safeVersionKey] = localNotesData[safeVersionKey].map(item =>
                item === editOldNoteText ? noteValue : item
            );
            await setDoc(updatesDocRef, localNotesData, { merge: true });

            showToast("Not başarıyla güncellendi!"); // Bildirim
            resetForm();
        } else {
            // YENİ NOT EKLEME MODU AKTİFSE
            if (!localNotesData[safeVersionKey]) localNotesData[safeVersionKey] = [];
            localNotesData[safeVersionKey].push(noteValue);

            await setDoc(updatesDocRef, localNotesData, { merge: true });

            showToast("Not başarıyla eklendi!"); // Bildirim
            noteInput.value = '';
        }
    } catch (err) {
        console.error("Hata:", err);
        alert("İşlem yapılırken bir hata oluştu: " + err.message);
    }
};

// Not Silme İşlemi
async function deleteNote(noteText) {
    deleteNoteTarget = noteText;
    deleteModal.style.display = 'flex';
}

document.getElementById('cancelDelete').onclick = () => deleteModal.style.display = 'none';

document.getElementById('confirmDelete').onclick = async () => {
    const safeVersionKey = "notes_" + globalActiveVersion.replace(/\./g, '_');
    localNotesData[safeVersionKey] = localNotesData[safeVersionKey].filter(item => item !== deleteNoteTarget);
    await setDoc(updatesDocRef, localNotesData, { merge: true });
    deleteModal.style.display = 'none';
    showToast("Not silindi!", false);
    if (editOldNoteText === deleteNoteTarget) resetForm();
};

// Sürüm Numarasını Kaydetme
document.getElementById('saveVersionBtn').onclick = async () => {
    const versionInput = document.getElementById('versionInput').value.trim();
    if (versionInput === '') {
        alert('Lütfen geçerli bir sürüm numarası yazın!');
        return;
    }

    try {
        localNotesData.currentVersion = versionInput;
        await setDoc(updatesDocRef, localNotesData, { merge: true });
        showToast('Sistem sürümü başarıyla güncellendi!', true);
    } catch (err) {
        console.error("Hata:", err);
        alert("Sürüm güncellenirken hata oluştu: " + err.message);
    }
};