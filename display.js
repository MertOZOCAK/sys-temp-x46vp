import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('productList');
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const resetBtn = document.getElementById('resetFilters');

    // 1. Ürünleri Ekrana Basma
    function renderProducts(products) {
        if (!productList) return;
        productList.innerHTML = "";

        if (products.length === 0) {
            productList.innerHTML = `<div class="col-12 text-center mt-5"><p class="text-muted">Ürün bulunamadı.</p></div>`;
            return;
        }

        products.forEach((product) => {
            const cardHtml = `
                <div class="col">
                    <div class="card h-100 shadow-sm border-0">
                        <img src="${product.images[0] || 'https://via.placeholder.com/300'}" class="card-img-top p-3" alt="${product.title}" style="height: 200px; object-fit: contain;">
                        <div class="card-body d-flex flex-column">
                            <span class="badge bg-light text-primary rounded-pill mb-2 align-self-start border">${product.category}</span>
                            <h6 class="card-title fw-bold">${product.title}</h6>
                            <p class="card-text text-muted small flex-grow-1">${product.description ? product.description.substring(0, 60) + '...' : ''}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="product-price text-primary fw-bold">${new Intl.NumberFormat('tr-TR').format(product.price)} TL</span>
                                <button class="btn btn-primary btn-sm rounded-pill px-3">Sepete Ekle</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            productList.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    // 2. Kategorileri Otomatik Güncelleme
    function updateCategoryDropdown(products) {
        if (!categoryFilter) return;
        const currentSelection = categoryFilter.value;
        const categories = [...new Set(products.map(p => p.category).filter(c => c))];
        
        categoryFilter.innerHTML = `<option value="all">Tüm Kategoriler</option>`;
        categories.forEach(cat => {
            categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
        categoryFilter.value = currentSelection;
    }

    // 3. ANA ALGORİTMA: Filtreleme + Samsung Önceliği
    function applyLogic() {
        const term = (searchInput?.value || mobileSearchInput?.value || "").toLowerCase();
        const selectedCat = categoryFilter?.value || "all";
        const minP = parseFloat(minPriceInput?.value) || 0;
        const maxP = parseFloat(maxPriceInput?.value) || Infinity;

        let results = allProducts.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(term) || (p.category && p.category.toLowerCase().includes(term));
            const matchesCategory = selectedCat === "all" || p.category === selectedCat;
            const matchesPrice = p.price >= minP && p.price <= maxP;
            return matchesSearch && matchesCategory && matchesPrice;
        });

        // Samsung olanları en üste taşıyan sıralama
        results.sort((a, b) => {
            const aIsSamsung = a.title.toLowerCase().includes('samsung');
            const bIsSamsung = b.title.toLowerCase().includes('samsung');
            if (aIsSamsung && !bIsSamsung) return -1;
            if (!aIsSamsung && bIsSamsung) return 1;
            return 0;
        });

        renderProducts(results);
    }

    // 4. Firebase Veri Akışı
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        allProducts = [];
        snapshot.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        updateCategoryDropdown(allProducts);
        applyLogic();
    });

    // 5. Dinleyiciler (Event Listeners)
    const handleInput = (e) => {
        const val = e.target.value;
        if(searchInput) searchInput.value = val;
        if(mobileSearchInput) mobileSearchInput.value = val;
        applyLogic();
    };

    if (searchInput) searchInput.addEventListener('input', handleInput);
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', handleInput);
    if (categoryFilter) categoryFilter.addEventListener('change', applyLogic);
    if (minPriceInput) minPriceInput.addEventListener('input', applyLogic);
    if (maxPriceInput) maxPriceInput.addEventListener('input', applyLogic);

    // Sıfırla Butonu Düzenlendi
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if(categoryFilter) categoryFilter.value = "all";
            if(minPriceInput) minPriceInput.value = "";
            if(maxPriceInput) maxPriceInput.value = "";
            if(searchInput) searchInput.value = "";
            if(mobileSearchInput) mobileSearchInput.value = "";
            applyLogic(); // Sıfırladıktan sonra listeyi tekrar hesapla
        });
    }
});