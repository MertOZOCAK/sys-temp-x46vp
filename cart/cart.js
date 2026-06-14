import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyCwXYbUjJr20WCrqhuNbPhiUA1oleeUSuQ",
    authDomain: "z-pazar.firebaseapp.com",
    projectId: "z-pazar",
    storageBucket: "z-pazar.firebasestorage.app",
    messagingSenderId: "185640177672",
    appId: "1:185640177672:web:6cb085e5474291d12d01bd"
};

const app = initializeApp(firebaseConfig);
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
const deleteConfirmModalElement = document.getElementById("deleteConfirmModal");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
let pendingDeleteItemId = null;

function getLocalCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveLocalCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function renderCart() {
    const cart = getLocalCart();
    cartItemsContainer.innerHTML = "";

    if (!cart.length) {
        cartItemsContainer.innerHTML = `<div class="text-center py-5 text-muted">Sepetinizde ürün bulunmamaktadır.</div>`;
        cartCountHeader.innerText = "0";
        updateSummaryTotals(0, 0);
        return;
    }

    let subtotal = 0;
    let totalItemsCount = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        totalItemsCount += item.quantity;

        const sellerLabel = (item.seller || 'Z-Pazar').replace(/\s*Mağaza$/i, '').trim() || 'Z-Pazar';
        const itemHTML = `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image || 'https://via.placeholder.com/90'}" class="cart-item-img" alt="${item.title}">
                <div class="cart-item-info">
                    <a href="#" class="cart-item-title">${item.title}</a>
                    <div class="cart-item-seller">Satıcı: <span class="fw-semibold text-dark">${sellerLabel}</span></div>
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
    bindCartEvents();
}

function calculateBasket(subtotal) {
    let shippingFee = 49.99;
    let finalTotal = subtotal;

    subtotalPriceEl.innerText = `${subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;

    if (subtotal >= 300 || subtotal === 0) {
        shippingPriceEl.innerText = `${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
        freeShippingRow.classList.remove("d-none");
        freeShippingDiscountEl.innerText = `-${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
        finalTotal = subtotal;
    } else {
        shippingPriceEl.innerText = `${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
        freeShippingRow.classList.add("d-none");
        finalTotal = subtotal + shippingFee;
    }

    totalPriceEl.innerText = `${finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
}

function bindCartEvents() {
    document.querySelectorAll(".cart-item").forEach(itemEl => {
        const productId = itemEl.getAttribute("data-id");
        const qtyEl = itemEl.querySelector(".quantity-value");

        itemEl.querySelector(".btn-increase").onclick = () => {
            updateCartItemQuantity(productId, 1);
        };

        itemEl.querySelector(".btn-decrease").onclick = () => {
            updateCartItemQuantity(productId, -1);
        };

        itemEl.querySelector(".btn-delete").onclick = () => {
            pendingDeleteItemId = productId;
            if (deleteConfirmModalElement) {
                const modal = new bootstrap.Modal(deleteConfirmModalElement);
                modal.show();
            }
        };
    });
}

function updateCartItemQuantity(productId, delta) {
    const cart = getLocalCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity = Math.max(1, (cart[itemIndex].quantity || 1) + delta);
    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }

    saveLocalCart(cart);
    renderCart();
}

function removeCartItem(productId) {
    const cart = getLocalCart().filter(item => item.id !== productId);
    saveLocalCart(cart);
    renderCart();
}

function updateSummaryTotals(subtotal, totalItems) {
    cartCountHeader.innerText = totalItems.toString();
    subtotalPriceEl.innerText = `${subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
    shippingPriceEl.innerText = "0,00 TL";
    totalPriceEl.innerText = "0,00 TL";
}

if (deleteConfirmBtn) {
    deleteConfirmBtn.onclick = () => {
        if (!pendingDeleteItemId) return;
        removeCartItem(pendingDeleteItemId);
        pendingDeleteItemId = null;
        const modal = bootstrap.Modal.getInstance(deleteConfirmModalElement);
        if (modal) modal.hide();
    };
}

renderCart();

checkoutBtn.onclick = () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        const authModal = new bootstrap.Modal(document.getElementById('authAlertModal'));
        authModal.show();
    } else {
        window.location.href = "checkout.html";
    }
};