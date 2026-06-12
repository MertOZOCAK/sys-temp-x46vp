import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Orijinal Firebase Yapılandırman
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

const CART_KEY = 'zPazarCart';
let localProductsArray = [];
let activeCategoryFilter = "all"; 

// DOM Elementleri
const productRow = document.getElementById("productRow");
const searchInput = document.getElementById("searchInput");
const dropdownProductsContainer = document.getElementById("dropdownProductsContainer");
const smartCategoryBar = document.getElementById("smartCategoryBar");

function getLocalCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveLocalCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cartCountBadge');
    if (!badge) return;
    const totalQty = getLocalCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
    badge.innerText = totalQty;
}

const cartNotificationCloseBtn = document.getElementById('cartNotificationClose');
if (cartNotificationCloseBtn) {
    cartNotificationCloseBtn.onclick = () => {
        const modal = document.getElementById('cartNotificationModal');
        if (modal) {
            modal.classList.remove('show');
        }
        clearTimeout(cartNotificationTimeout);
    };
}

function addProductToLocalCart(product) {
    const cart = getLocalCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 0) + 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title || product.name || "İsimsiz Ürün",
            price: Math.round(parseFloat(product.price || 0) * (1 - (Number(product.discount || 0) / 100))),
            image: (product.images && product.images[0]) || product.image || product.imageUrl || "https://via.placeholder.com/120",
            quantity: 1,
            seller: product.seller || "Z-Pazar"
        });
    }

    saveLocalCart(cart);
    updateCartBadge();
}

updateCartBadge();

// Trendyol Stili Premium Canlı Gradyanlar
const trendyolGradients = [
    "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    "linear-gradient(135deg, #13547a 0%, #80d0c7 100%)"
];

// --- FIRESTORE REAL-TIME DİNLEME ---
const q = collection(db, "products");

onSnapshot(q, (snapshot) => {
    let rawProducts = [];

    if (snapshot.empty) {
        productRow.innerHTML = `<div class="w-100 text-center text-muted py-5">Henüz vitrinde ürün bulunmuyor.</div>`;
        if (smartCategoryBar) smartCategoryBar.innerHTML = "";
        return;
    }

    snapshot.forEach((doc) => {
        const product = doc.data();
        product.id = doc.id;
        rawProducts.push(product);
    });

    // Marka Önceliği Sıralaması (Samsung Üstte)
    rawProducts.sort((a, b) => {
        const aTitle = (a.title || a.name || "").toLowerCase();
        const bTitle = (b.title || b.name || "").toLowerCase();
        if (aTitle.includes('samsung') && !bTitle.includes('samsung')) return -1;
        if (!aTitle.includes('samsung') && bTitle.includes('samsung')) return 1;
        return 0;
    });

    localProductsArray = rawProducts;

    // Kategori İstatistiklerini Hesaplama
    const categoryStats = {};
    let globalMinPrice = Infinity;

    localProductsArray.forEach(p => {
        const rawPrice = parseFloat(p.price || p.productPrice || p.fiyat || 0);
        const discount = Number(p.discount || p.indirim || 0);
        const finalPrice = discount > 0 ? rawPrice * (1 - discount / 100) : rawPrice;

        if (finalPrice < globalMinPrice) globalMinPrice = finalPrice;

        if (p.category && p.category.trim() !== "") {
            const cleanCat = p.category.trim().charAt(0).toUpperCase() + p.category.trim().slice(1).toLowerCase();
            
            if (!categoryStats[cleanCat]) {
                categoryStats[cleanCat] = { count: 0, minPrice: Infinity };
            }
            categoryStats[cleanCat].count += 1;
            if (finalPrice < categoryStats[cleanCat].minPrice) {
                categoryStats[cleanCat].minPrice = finalPrice;
            }
        }
    });

    buildTrendyolCategoryBar(categoryStats, globalMinPrice);
    applyFiltersAndRender();
});

// Top bar messages (ticker) - realtime
const topbarListEl = document.getElementById('tickerList');
let topbarRotationIndex = 0;
let topbarRotationTimer = null;

function renderTopbarTicker(items) {
    if (!topbarListEl) return;

    const buildItemHtml = (it) => {
        const iconHtml = it.icon ? `<i class="${it.icon} me-2"></i>` : '';
        return `<li class="ticker-item">${iconHtml}${it.message}</li>`;
    };

    if (topbarRotationTimer) {
        clearInterval(topbarRotationTimer);
        topbarRotationTimer = null;
    }

    if (items.length === 0) {
        topbarListEl.innerHTML = `<li class="ticker-item text-muted">Güncel veri bulunamadı.</li>`;
        return;
    }

    if (items.length === 1) {
        topbarListEl.innerHTML = buildItemHtml(items[0]);
        return;
    }

    topbarRotationIndex = 0;
    topbarListEl.innerHTML = buildItemHtml(items[topbarRotationIndex]);

    topbarRotationTimer = setInterval(() => {
        topbarRotationIndex = (topbarRotationIndex + 1) % items.length;
        topbarListEl.style.opacity = '0';
        setTimeout(() => {
            topbarListEl.innerHTML = buildItemHtml(items[topbarRotationIndex]);
            topbarListEl.style.opacity = '1';
        }, 240);
    }, 3800);
}

if (topbarListEl) {
    const topQ = query(collection(db, 'topbar'), orderBy('createdAt', 'desc'));
    onSnapshot(topQ, (snap) => {
        const items = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.active) items.push(data);
        });
        renderTopbarTicker(items);
    });
}

// --- ORTALANMIŞ VE ROZETLERİ DÜZELTİLMİŞ KATEGORİ PANELİ ---
function buildTrendyolCategoryBar(stats, globalMin) {
    if (!smartCategoryBar) return;
    
    smartCategoryBar.innerHTML = "";
    smartCategoryBar.className = "d-flex gap-4 overflow-x-auto pb-3 pt-3 px-2 justify-content-start justify-content-md-center align-items-center";

    const totalProductsCount = localProductsArray.length;
    const allIsActive = activeCategoryFilter === "all";

    // 1. "Tümü" Kategorisi
    const allHTML = `
        <div class="text-center" style="min-width: 85px; cursor: pointer; padding-top: 4px;">
            <a href="#" class="cat-pill-btn d-flex flex-column align-items-center text-decoration-none" data-cat="all" style="transition: all 0.3s ease;">
                <div class="d-flex align-items-center justify-content-center text-white rounded-circle position-relative" 
                     style="width: 64px; height: 64px; font-size: 22px; background: linear-gradient(135deg, #ff6000 0%, #ff8f43 100%); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: ${allIsActive ? '0 8px 22px rgba(255,96,0,0.35), inset 0 0 0 2px #fff' : '0 4px 12px rgba(0,0,0,0.06)'}; ${allIsActive ? 'transform: scale(1.06) translateY(-4px);' : ''}">
                    <i class="bi bi-stars"></i>
                    <span class="position-absolute badge rounded-pill"
                          style="font-size: 10px; top: -8px; right: -8px; padding: 2px 7px; border: 2px solid #fff; z-index: 10; font-weight: 700; background-color: rgba(255,255,255,0.98); color: #0f172a; box-shadow: 0 4px 10px rgba(15,23,42,0.06); border-color: rgba(15,23,42,0.06); min-width: 30px; text-align: center;">
                        ${totalProductsCount}
                    </span>
                </div>
                <span class="mt-2 text-dark fw-bold" style="font-size: 12px; transition: color 0.2s; ${allIsActive ? 'color: #ff6000 !important;' : ''}">Tümü</span>
                <small class="text-muted" style="font-size: 10px; font-weight: 500;">Vitrin</small>
            </a>
        </div>
    `;
    smartCategoryBar.insertAdjacentHTML("beforeend", allHTML);

    // 2. Dinamik Firebase Kategorileri
    Object.keys(stats).forEach((cat, index) => {
        const lowerCat = cat.toLowerCase().trim();
        const isSelected = activeCategoryFilter === lowerCat;
        const shortLetters = cat.substring(0, 2).toUpperCase();
        const currentGradient = trendyolGradients[index % trendyolGradients.length];
        
        const catCount = stats[cat].count;
        const catMinPrice = Math.round(stats[cat].minPrice).toLocaleString('tr-TR');

        const catHTML = `
            <div class="text-center" style="min-width: 85px; cursor: pointer; padding-top: 4px;">
                <a href="#" class="cat-pill-btn d-flex flex-column align-items-center text-decoration-none" data-cat="${lowerCat}" style="transition: all 0.3s ease;">
                    <div class="d-flex align-items-center justify-content-center text-white rounded-circle fw-bold position-relative" 
                         style="width: 64px; height: 64px; font-size: 16px; letter-spacing: 0.5px; background: ${currentGradient}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: ${isSelected ? '0 8px 22px rgba(0,0,0,0.18), inset 0 0 0 2px #fff' : '0 4px 12px rgba(0,0,0,0.06)'}; ${isSelected ? 'transform: scale(1.06) translateY(-4px); outline: 2px solid #ff6000; outline-offset: 1px;' : ''}">
                        ${shortLetters}
                        <span class="position-absolute badge rounded-pill"
                              style="font-size: 11px; top: -8px; right: -8px; padding: 2px 7px; border: 2px solid #fff; z-index: 10; font-weight: 700; background-color: rgba(255,255,255,0.98); color: #0f172a; box-shadow: 0 4px 10px rgba(15,23,42,0.06); border-color: rgba(15,23,42,0.06); min-width: 30px; text-align:center;">
                            ${catCount > 99 ? '99+' : catCount}
                        </span>
                    </div>
                    <span class="mt-2 text-dark fw-semibold" style="font-size: 12px; white-space: nowrap; transition: color 0.2s; ${isSelected ? 'color: #ff6000 !important; font-weight: 700;' : ''}">${cat}</span>
                    <small class="text-success fw-bold d-block" style="font-size: 9px; opacity: 0.9; line-height: 1.2;">${catMinPrice} TL'den<br>Başlayan Fiyatlarla</small>
                </a>
            </div>
        `;
        smartCategoryBar.insertAdjacentHTML("beforeend", catHTML);
    });

    // Pürüzsüz Hover ve Tıklama Yönetimi
    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
        const circle = btn.querySelector("div");
        const text = btn.querySelector("span");

        btn.addEventListener("mouseenter", () => {
            if (activeCategoryFilter !== btn.getAttribute("data-cat")) {
                circle.style.transform = "translateY(-5px) scale(1.05)";
                circle.style.boxShadow = "0 8px 18px rgba(0,0,0,0.14)";
                text.style.color = "#ff6000";
            }
        });

        btn.addEventListener("mouseleave", () => {
            if (activeCategoryFilter !== btn.getAttribute("data-cat")) {
                circle.style.transform = "translateY(0px) scale(1)";
                circle.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                text.style.color = "#212529";
            }
        });

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            
            const targetBtn = e.target.closest('.cat-pill-btn');
            if (!targetBtn) return;

            activeCategoryFilter = targetBtn.getAttribute("data-cat");

            applyFiltersAndRender();
            buildTrendyolCategoryBar(stats, globalMin);

            // Geliştirilmiş Kaydırma Alanı Yönetimi
            const targetVisualRow = document.getElementById("productRow") || document.getElementById("smartCategoryBar");
            if (targetVisualRow) {
                const offset = 120; // Yapışkan navbar varsa üstte boşluk bırakmak için offset değeri
                const elementPosition = targetVisualRow.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
}

// --- FİLTRELEME VE VİTRİN YENİLEME FONKSİYONU ---
function applyFiltersAndRender() {
    productRow.innerHTML = "";

    // Vitrindeki ürünlerin arama teriminden etkilenmemesi için sadece aktif kategori filtresini uyguluyoruz:
    const filtered = localProductsArray.filter(product => {
        const productCategory = (product.category || "").toLowerCase().trim();
        return (activeCategoryFilter === "all" || productCategory === activeCategoryFilter);
    });

    if (filtered.length === 0) {
        productRow.innerHTML = `<div class="w-100 text-center text-muted py-5">Aradığınız kriterlere uygun ürün bulunamadı...</div>`;
        return;
    }

    // Ürünler üzerinde hiçbir sıralama (sort) değişikliği yapmadan doğrudan ekrana basıyoruz:
    filtered.forEach((product) => {
        const finalName = product.title || product.name || "İsimsiz Ürün";
        const rawPrice = product.price || product.productPrice || 0;
        const basePrice = parseFloat(rawPrice);
        
        const discountPercent = Number(product.discount || product.indirim) || 0;
        const safeDiscount = Math.max(0, Math.min(100, discountPercent));
        
        const currentPriceNum = safeDiscount > 0 ? basePrice * (1 - safeDiscount / 100) : basePrice;
        const oldPriceNum = safeDiscount > 0 ? basePrice : 0;

        let discountBadgeHTML = "";
        if (safeDiscount > 0) {
            discountBadgeHTML = `
                <span style="
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background-color: #fef2f2;
                    color: #ef4444;
                    font-size: 11px;
                    font-weight: 800;
                    padding: 4px 8px;
                    border-radius: 6px;
                    border: 1.5px solid #fee2e2;
                    z-index: 5;
                ">%${safeDiscount} İndirim</span>`;
        }

        let priceBoxHTML = "";
        if (oldPriceNum > 0) {
            priceBoxHTML = `
                <span class="current-price">${Math.round(currentPriceNum).toLocaleString('tr-TR')} TL</span>
                <span style="font-size: 12px; font-weight: 500; color: #94a3b8; text-decoration: line-through; margin-left: 8px;">
                    ${Math.round(oldPriceNum).toLocaleString('tr-TR')} TL
                </span>
            `;
        } else {
            priceBoxHTML = `<span class="current-price">${Math.round(currentPriceNum).toLocaleString('tr-TR')} TL</span>`;
        }

        const defaultImg = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600";
        let mainImg = defaultImg;

        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            mainImg = product.images[0];
        } else {
            mainImg = product.image || product.imageUrl || defaultImg;
        }

        let hoverImg = mainImg;
        if (product.images && Array.isArray(product.images) && product.images.length > 1) {
            hoverImg = product.images[1];
        }

        const finalBrand = product.brand || product.marka || "Z-Pazar";
        const rating = product.rating || 5;
        const reviews = product.reviewsCount || 0;

        let starsHTML = "";
        for (let i = 1; i <= 5; i++) {
            starsHTML += i <= Math.floor(parseFloat(rating)) ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
        }

        const detailLink = `detay.html?id=${product.id}`;

        const cardHTML = `
            <div class="col">
                <div class="product-card">
                    ${discountBadgeHTML}
                    <button class="fav-btn"><i class="bi bi-heart"></i></button>
                    
                    <a href="${detailLink}" class="text-decoration-none product-card-link">
                        <div class="product-img-wrapper">
                            <img src="${mainImg}" class="img-main" alt="${finalName}" onerror="this.src='${defaultImg}'">
                            <img src="${hoverImg}" class="img-hover" alt="${finalName} Detay" onerror="this.src='${defaultImg}'">
                        </div>
                    </a>
                    
                    <div class="product-info">
                        <a href="${detailLink}" class="text-decoration-none text-dark">
                            <div class="product-brand">${finalBrand}</div>
                            <div class="product-title" title="${finalName}">${finalName}</div>
                        </a>
                        <div class="rating-stars">
                            ${starsHTML}
                            <span class="rating-count">(${reviews})</span>
                        </div>
                        <div class="price-box">
                            ${priceBoxHTML}
                        </div>
                        <button class="quick-add-btn" onclick="window.addToCart('${product.id}')">
                            <i class="bi bi-cart-plus-fill"></i> Sepete Ekle
                        </button>
                    </div>
                </div>
            </div>
        `;
        productRow.insertAdjacentHTML("beforeend", cardHTML);
    });

    // Arama kutusu tamamen boş olduğunda dropdown paneline varsayılan önerileri basmak için bu kontrolü sonda tutuyoruz:
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
    if (keyword === "") {
        renderSearchDropdown(localProductsArray.slice(0, 3));
    }
}

// Arama Çubuğu İkon ve Dönüşüm Yönetimi
const searchIcon = document.getElementById("searchIcon");
const clearIcon = document.getElementById("clearIcon");
const searchIconContainer = document.getElementById("searchIconContainer");

if (searchInput && searchIcon && clearIcon && searchIconContainer) {
    // Giriş alanına yazı yazıldıkça tetiklenen animasyonlar
    searchInput.addEventListener("input", () => {
        if (searchInput.value.trim().length > 0) {
            // Büyüteç kendi ekseninde dönerek küçülür ve gizlenir
            searchIcon.style.opacity = "0";
            searchIcon.style.transform = "rotate(90deg) scale(0)";
            
            // X ikonu dönerek görünür hale gelir ve tıklanabilir olur
            clearIcon.style.opacity = "1";
            clearIcon.style.transform = "rotate(0deg) scale(1)";
            clearIcon.style.pointerEvents = "auto";
        } else {
            // Alan boşaldığında büyüteç geri gelir
            searchIcon.style.opacity = "1";
            searchIcon.style.transform = "rotate(0deg) scale(1)";
            
            // X ikonu tersine dönerek gizlenir
            clearIcon.style.opacity = "0";
            clearIcon.style.transform = "rotate(-90deg) scale(0)";
            clearIcon.style.pointerEvents = "none";
        }
    });

    // Turuncu X ikonuna tıklandığında alanı temizleme mantığı
    searchIconContainer.addEventListener("click", () => {
        if (searchInput.value.length > 0) {
            searchInput.value = ""; // Metni temizle
            
            // İkonları ilk konumlarına ve animasyonlarına geri döndür
            searchIcon.style.opacity = "1";
            searchIcon.style.transform = "rotate(0deg) scale(1)";
            
            clearIcon.style.opacity = "0";
            clearIcon.style.transform = "rotate(-90deg) scale(0)";
            clearIcon.style.pointerEvents = "none";
            
            // Firebase filtrelemesini sıfırlamak için input olayını tetikle
            searchInput.dispatchEvent(new Event("input"));
            
            // Kullanıcının yazmaya devam edebilmesi için odağı inputta tut
            searchInput.focus();
        }
    });
}

// --- CANLI ARAMA TAKİPÇİSİ ---
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        applyFiltersAndRender();

        if (keyword === "") return;

        const filtered = localProductsArray.filter(p => {
            const nameVal = (p.title || p.name || "").toLowerCase();
            const catVal = (p.category || "").toLowerCase();
            const brandVal = (p.brand || p.marka || "").toLowerCase();
            return nameVal.includes(keyword) || catVal.includes(keyword) || brandVal.includes(keyword);
        });

        // Açılır kutu (Dropdown) için akıllı sıralama mantığı:
        if (keyword.length > 0) {
            filtered.sort((a, b) => {
                const titleA = (a.title || a.name || "").toLowerCase().trim();
                const titleB = (b.title || b.name || "").toLowerCase().trim();

                const isExactA = (titleA === keyword);
                const isExactB = (titleB === keyword);
                if (isExactA && !isExactB) return -1;
                if (!isExactA && isExactB) return 1;

                if (titleA.length !== titleB.length) {
                    return titleA.length - titleB.length;
                }

                return titleA.localeCompare(titleB, "tr", { sensitivity: "base" });
            });
        }

        renderSearchDropdown(filtered.slice(0, 4));
    });
}

// Dropdown Öneri Paneli
function renderSearchDropdown(products) {
    if (!dropdownProductsContainer) return;
    dropdownProductsContainer.innerHTML = "";
    
    if (products.length === 0) {
        dropdownProductsContainer.innerHTML = `<div class="text-muted small ps-2">Eşleşen ürün bulunamadı.</div>`;
        return;
    }

    const defaultImg = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=100";

    products.forEach(p => {
        const nameVal = p.title || p.name || "İsimsiz Ürün";
        const basePrice = parseFloat(p.price || 0);
        
        // Hem 'discount' hem de 'indirim' alanlarını desteklemek için kontrolü genişletiyoruz:
        const discountPercent = Number(p.discount || p.indirim || 0);
        const currentPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;

        let imgVal = defaultImg;
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            imgVal = p.images[0];
        } else {
            imgVal = p.image || p.imageUrl || defaultImg;
        }

        // İndirim durumuna göre yan yana listelenecek fiyat yapısı:
        let priceDisplayHTML = "";
        if (discountPercent > 0) {
            priceDisplayHTML = `
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <small class="fw-bold" style="color: #ff6000;">${Math.round(currentPrice).toLocaleString('tr-TR')} TL</small>
                    <small style="text-decoration: line-through; color: #94a3b8; font-size: 11px;">${Math.round(basePrice).toLocaleString('tr-TR')} TL</small>
                    <small style="color: #ef4444; font-weight: 800; font-size: 11px;">%${discountPercent} İndirim</small>
                </div>
            `;
        } else {
            priceDisplayHTML = `
                <small class="fw-bold" style="color: #ff6000;">${Math.round(currentPrice).toLocaleString('tr-TR')} TL</small>
            `;
        }

        const itemHTML = `
            <a href="detay.html?id=${p.id}" class="suggested-item text-decoration-none">
                <img src="${imgVal}" alt="${nameVal}" onerror="this.src='${defaultImg}'">
                <div class="d-flex flex-column">
                    <span>${nameVal}</span>
                    ${priceDisplayHTML}
                </div>
            </a>
        `;
        dropdownProductsContainer.insertAdjacentHTML("beforeend", itemHTML);
    });
}

// --- SEPET SAYAÇ ANİMASYONU ---
window.animateCartBump = function() {
    const badge = document.getElementById('cartCountBadge');
    if (!badge) return;

    badge.classList.add('bump');
    setTimeout(() => {
        badge.classList.remove('bump');
    }, 200);
};

// =========================================================================
// SEPET VE SAYAÇ ENTEGRASYONU (LOCALSTORAGE)
// =========================================================================

let cartNotificationTimeout = null;

function showCartNotification(message, status = 'success') {
    const modal = document.getElementById('cartNotificationModal');
    const title = document.getElementById('cartNotificationTitle');
    const body = document.getElementById('cartNotificationMessage');
    const icon = document.getElementById('cartNotificationIcon');
    const card = modal ? modal.querySelector('.cart-notification-card') : null;

    if (!modal || !title || !body || !icon || !card) {
        console.warn('Bildirim modalı bulunamadı, fallback alert kullanılıyor.');
        alert(message);
        return;
    }

    title.textContent = status === 'success' ? 'Başarılı' : 'Hata';
    body.textContent = message;
    icon.textContent = status === 'success' ? '✓' : '⚠';
    card.classList.toggle('error', status !== 'success');
    modal.classList.add('show');

    clearTimeout(cartNotificationTimeout);
    cartNotificationTimeout = setTimeout(() => {
        modal.classList.remove('show');
    }, 2600);
}

window.addToCart = function(productId) {
    const product = localProductsArray.find(p => p.id === productId);
    if (!product) {
        console.error("Ürün yerel dizide bulunamadı:", productId);
        showCartNotification("Ürün sepete eklenemedi. Lütfen sayfayı yenileyin ve tekrar deneyin.", 'error');
        return;
    }

    addProductToLocalCart(product);

    if (typeof window.animateCartBump === "function") {
        window.animateCartBump();
    }

    showCartNotification("Ürün başarıyla sepetinize eklendi!", 'success');
};