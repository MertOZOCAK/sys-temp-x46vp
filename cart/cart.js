import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Yapılandırması (display1.js ile birebir aynı)
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

const CART_KEY = 'zPazarCart';

// DOM Elementleri
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartCountHeader = document.getElementById("cartCountHeader");
const subtotalPriceEl = document.getElementById("subtotalPrice");
const shippingPriceEl = document.getElementById("shippingPrice");
const freeShippingRow = document.getElementById("freeShippingRow");
const freeShippingDiscountEl = document.getElementById("freeShippingDiscount");
const totalPriceEl = document.getElementById("totalPrice");
const checkoutBtn = document.getElementById("checkoutBtn");

const deleteConfirmModalElement = document.getElementById('deleteConfirmModal');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
let pendingDeleteItemId = null;

// Canlı fiyatları tutacağımız obje
let liveProductsMap = {}; 

// LocalStorage'dan sepeti oku
function getLocalCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
}

// LocalStorage'a sepeti kaydet
function saveLocalCart(cartArray) {
    localStorage.setItem(CART_KEY, JSON.stringify(cartArray));
}

// CANLI FİYATLARI DİNLEYEN FONKSİYON (Yeni Eklendi)
function listenToLiveProducts() {
    const productsRef = collection(db, "products");
    
    onSnapshot(productsRef, (snapshot) => {
        snapshot.forEach((doc) => {
            liveProductsMap[doc.id] = doc.data();
        });
        // Veritabanında (Panelde) bir fiyat değişikliği olduğunda sepeti anında tekrar çiz
        renderCart();
    }, (error) => {
        console.error("Canlı fiyatlar dinlenirken hata:", error);
        renderCart(); // Hata olsa bile en azından sepeti çiz
    });
}

// CANLI FIYATLARLA SEPETI EKRANA BASAN ANA FONKSIYON
function renderCart() {
    const cart = getLocalCart();

    // Sepet boşsa arayüzü temizle ve mesaj göster
    if (!cart || cart.length === 0) {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-4">
                        <i class="bi bi-bag-x" style="color: #ff6000; font-size: 4rem;"></i>
                    </div>
                    <h4 class="fw-bold text-dark">Sepetiniz Bomboş</h4>
                    <p class="text-muted mb-4">Sepetinizde henüz ürün bulunmuyor. Hemen alışverişe başlayın!</p>
                    <a href="../index.html" class="btn btn-primary rounded-pill px-5 py-2 fw-semibold shadow-sm">Alışverişe Başla</a>
                </div>
            `;
        }
        updateSummaryTotals(0, 0);
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;
    if (cartItemsContainer) cartItemsContainer.innerHTML = "";

    let subtotal = 0;
    let totalItems = 0;
    let itemsHtml = "";

    // Tüm ürünlerin güncel fiyatlarını liveProductsMap'ten sırayla çekiyoruz
    for (const item of cart) {
        let currentPrice = Number(item.price) || 0; // Eğer Firebase'den çekilemezse yedek eski fiyat

        // CANLI FİYAT KONTROLÜ
        if (liveProductsMap[item.id] && liveProductsMap[item.id].price !== undefined) {
            currentPrice = Number(liveProductsMap[item.id].price);
        }

        const itemSubtotal = currentPrice * item.quantity;
        subtotal += itemSubtotal;
        totalItems += item.quantity;

        // HTML Yapısını biriktiriyoruz (Senin orijinal tasarımın)
        itemsHtml += `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image || 'https://via.placeholder.com/90'}" class="cart-item-img" alt="${item.id}">
                <div class="cart-item-info">
                    <a href="../detay.html?id=${item.id}" class="cart-item-title">${item.title}</a>
                    <div class="cart-item-seller">Birim Fiyat: <span class="fw-semibold text-dark">${currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span></div>
                </div>
                <div class="quantity-control">
                    <button class="quantity-btn btn-qty-minus" data-id="${item.id}"><i class="bi bi-dash"></i></button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn btn-qty-plus" data-id="${item.id}"><i class="bi bi-plus"></i></button>
                </div>
                <div class="cart-item-price">${itemSubtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                <button class="remove-btn btn-remove-item" data-id="${item.id}" title="Ürünü Sil"><i class="bi bi-trash3"></i></button>
            </div>
        `;
    }

    // Listeyi ekrana bas ve toplamları güncelle
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = itemsHtml;
    }
    
    updateSummaryTotals(subtotal, totalItems);
    setupEventListeners();
}

// Sağ taraftaki fiyat özet tablosunu hesaplayan fonksiyon
function updateSummaryTotals(subtotal, totalItems) {
    if (cartCountHeader) cartCountHeader.innerText = totalItems.toString();
    if (subtotalPriceEl) subtotalPriceEl.innerText = `${subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;

    // Sizin sepet kurallarınız: 300 TL ve üzeri kargo bedava kuralı
    let shippingCost = 49.99;
    if (subtotal >= 300 || subtotal === 0) {
        shippingCost = 0;
        if (freeShippingRow) freeShippingRow.style.setProperty("display", "flex", "important");
        if (freeShippingDiscountEl) freeShippingDiscountEl.innerText = "-49,99 TL";
    } else {
        if (freeShippingRow) freeShippingRow.style.setProperty("display", "none", "important");
    }

    if (shippingPriceEl) {
        shippingPriceEl.innerText = shippingCost === 0 ? "0,00 TL" : `${shippingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
    }

    const finalTotal = subtotal + shippingCost;
    if (totalPriceEl) totalPriceEl.innerText = `${finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
}

// Buton tıklama dinleyicilerini kuran fonksiyon
function setupEventListeners() {
    document.querySelectorAll(".btn-qty-plus").forEach(btn => {
        btn.onclick = () => updateCartItemQuantity(btn.dataset.id, 1);
    });

    document.querySelectorAll(".btn-qty-minus").forEach(btn => {
        btn.onclick = () => updateCartItemQuantity(btn.dataset.id, -1);
    });

    document.querySelectorAll(".btn-remove-item").forEach(btn => {
        btn.onclick = () => {
            pendingDeleteItemId = btn.dataset.id;
            if (deleteConfirmModalElement) {
                const modal = new bootstrap.Modal(deleteConfirmModalElement);
                modal.show();
            }
        };
    });
}

// Adet artırma ve azaltma fonksiyonu
function updateCartItemQuantity(productId, delta) {
    const cart = getLocalCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity = (cart[itemIndex].quantity || 1) + delta;
    
    // Eğer adet 0 veya altına düşerse silme onay modalını aç
    if (cart[itemIndex].quantity <= 0) {
        pendingDeleteItemId = productId;
        if (deleteConfirmModalElement) {
            const modal = new bootstrap.Modal(deleteConfirmModalElement);
            modal.show();
        }
        return;
    }

    saveLocalCart(cart);
    renderCart();
}

// Ürünü sepetten tamamen çıkaran fonksiyon
function removeCartItem(productId) {
    const cart = getLocalCart().filter(item => item.id !== productId);
    saveLocalCart(cart);
    renderCart();
}

// Onay modalındaki "Sil" butonuna tıklandığında çalışacak kod
if (deleteConfirmBtn) {
    deleteConfirmBtn.onclick = () => {
        if (!pendingDeleteItemId) return;
        removeCartItem(pendingDeleteItemId);
        pendingDeleteItemId = null;
        
        if (deleteConfirmModalElement) {
            const modal = bootstrap.Modal.getInstance(deleteConfirmModalElement);
            if (modal) modal.hide();
        }
    };
}

// Sayfa ilk açıldığında canlı veritabanı dinleyicisini başlat (Bu aynı zamanda renderCart'ı tetikler)
listenToLiveProducts();

// Sepeti Onayla butonu için doğrudan modal tetikleyici
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById("checkoutBtn");
    const authAlertModalElement = document.getElementById('authAlertModal');

    if (checkoutBtn && authAlertModalElement) {
        // Bootstrap modal nesnesini oluştur
        const authModal = new bootstrap.Modal(authAlertModalElement);

        // Butona tıklandığı anda modalı aç
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Sayfanın yukarı kaymasını veya yenilenmesini engeller
            authModal.show();
        });
    }
});