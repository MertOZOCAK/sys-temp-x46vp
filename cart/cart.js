import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// DOM Elementleri
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartCountHeader = document.getElementById("cartCountHeader");
const subtotalPriceEl = document.getElementById("subtotalPrice");
const shippingPriceEl = document.getElementById("shippingPrice");
const freeShippingRow = document.getElementById("freeShippingRow");
const freeShippingDiscountEl = document.getElementById("freeShippingDiscount");
const totalPriceEl = document.getElementById("totalPrice");
const checkoutBtn = document.getElementById("checkoutBtn");

let activeUserId = "test_user"; // Varsayılan test kullanıcısı

// Kullanıcı Oturum Kontrolü
onAuthStateChanged(auth, (user) => {
    if (user) {
        activeUserId = user.uid;
    } else {
        activeUserId = "test_user"; // Giriş yoksa test sepetini dinle
    }
    initCartListener(activeUserId);
});

// Sepeti Gerçek Zamanlı Dinleyen Fonksiyon
function initCartListener(userId) {
    const cartItemsRef = collection(db, "carts", userId, "items");

    onSnapshot(cartItemsRef, (snapshot) => {
        cartItemsContainer.innerHTML = "";
        let subtotal = 0;
        let totalItemsCount = 0;

        if (snapshot.empty) {
            cartItemsContainer.innerHTML = `<div class="text-center py-5 text-muted">Sepetinizde ürün bulunmamaktadır.</div>`;
            updateSummaryTotals(0, 0);
            cartCountHeader.innerText = "0";
            return;
        }

        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            totalItemsCount += item.quantity;

            const itemHTML = `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image || 'https://via.placeholder.com/90'}" class="cart-item-img" alt="${item.title}">
                    <div class="cart-item-info">
                        <a href="#" class="cart-item-title">${item.title}</a>
                        <div class="cart-item-seller">Satıcı: <span class="fw-semibold text-dark">${item.seller}</span></div>
                    </div>
                    <div class="quantity-control">
                        <button class="quantity-btn btn-decrease"><i class="bi bi-dash"></i></button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn btn-increase"><i class="bi bi-plus"></i></button>
                    </div>
                    <div class="cart-item-price">${itemTotal.toLocaleString('tr-TR')} TL</div>
                    <button class="remove-btn btn-delete" title="Ürünü Sil"><i class="bi bi-trash3"></i></button>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML("beforeend", itemHTML);
        });

        cartCountHeader.innerText = totalItemsCount;
        calculateBasket(subtotal);
        bindCartEvents(userId);
    });
}

// Fiyatlandırma ve Kargo Kuralları Hesaplaması
function calculateBasket(subtotal) {
    let shippingFee = 49.99;
    let finalTotal = subtotal;

    subtotalPriceEl.innerText = `${subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;

    if (subtotal >= 300 || subtotal === 0) {
        // 300 TL ve üzeri kargo bedava
        shippingPriceEl.innerText = `${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
        freeShippingRow.classList.remove("d-none");
        freeShippingDiscountEl.innerText = `-${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
        finalTotal = subtotal;
    } else {
        // 300 TL altı kargo ücretli
        shippingPriceEl.innerText = `${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
        freeShippingRow.classList.add("d-none");
        finalTotal = subtotal + shippingFee;
    }

    totalPriceEl.innerText = `${finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
}

// Buton Olaylarını Bağlama (Arttır, Azalt, Sil)
function bindCartEvents(userId) {
    document.querySelectorAll(".cart-item").forEach(itemEl => {
        const productId = itemEl.getAttribute("data-id");
        const itemRef = doc(db, "carts", userId, "items", productId);
        const qtyValue = parseInt(itemEl.querySelector(".quantity-value").innerText);

        itemEl.querySelector(".btn-increase").onclick = async () => {
            await updateDoc(itemRef, { quantity: qtyValue + 1 });
        };

        itemEl.querySelector(".btn-decrease").onclick = async () => {
            if (qtyValue > 1) {
                await updateDoc(itemRef, { quantity: qtyValue - 1 });
            } else {
                await deleteDoc(itemRef);
            }
        };

        itemEl.querySelector(".btn-delete").onclick = async () => {
            if (confirm("Bu ürünü sepetinizden silmek istediğinize emin misiniz?")) {
                await deleteDoc(itemRef);
            }
        };
    });
}

// --- SEPETİ ONAYLA VE GİRİŞ KONTROLÜ (MODAL) ---
checkoutBtn.onclick = () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        // Eğer giriş yapmış kullanıcı yoksa modalı tetikle
        const authModal = new bootstrap.Modal(document.getElementById('authAlertModal'));
        authModal.show();
    } else {
        // Giriş yapılmışsa yönlendir
        window.location.href = "checkout.html";
    }
};