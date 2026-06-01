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

const productList = document.getElementById('productList');
const searchInput = document.getElementById('searchInput');

let allProducts = []; // Tüm ürünleri burada saklayacağız

// Ürünleri ekrana basan ana fonksiyon
function renderProducts(products) {
    productList.innerHTML = ""; // Listeyi temizle
    products.forEach((product) => {
        const cardHtml = `
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="${product.images[0]}" class="card-img-top" alt="${product.title}">
                    <div class="card-body d-flex flex-column">
                        <div class="mb-2"><span class="category-badge">${product.category}</span></div>
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text text-muted small">${product.description.substring(0, 80)}...</p>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <span class="product-price">
                                ${new Intl.NumberFormat('tr-TR').format(product.price)} TL
                            </span>
                            <button class="btn btn-outline-primary btn-sm rounded-pill">Sepete Ekle</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productList.innerHTML += cardHtml;
    });
}

// Firebase'den veriyi anlık çek
const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    allProducts = [];
    snapshot.forEach((doc) => {
        allProducts.push({ id: doc.id, ...doc.data() });
    });
    renderProducts(allProducts); // İlk yüklemede hepsini göster
});

// Arama kutusu dinleyicisi
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filtreleme: İsme veya kategoriye göre
    const filtered = allProducts.filter(p => 
        p.title.toLowerCase().includes(searchTerm) || 
        p.category.toLowerCase().includes(searchTerm)
    );
    
    renderProducts(filtered); // Filtrelenmiş listeyi ekrana bas
});