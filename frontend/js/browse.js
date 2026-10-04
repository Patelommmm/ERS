// Browse page
const user = loggedIn();
const isHolder = user?.role === 'Holder';
const params = new URLSearchParams(window.location.search);

const listEl = document.getElementById('productList');
const listTitle = document.getElementById('listTitle');
const filtersEl = document.getElementById('filters');
const addBtn = document.getElementById('addBtn');
const tabsEl = document.getElementById('tabs');
let products = [];
let view = isHolder && !params.get('category') ? 'mine' : 'all';

const filters = setupFilters(filtersEl, render, { category: params.get('category') });
const isMine = p => isHolder && String(p.ownerId) === String(user.userId);

if (isHolder) {
    addBtn.hidden = false;
    tabsEl.hidden = false;
}

addBtn.addEventListener('click', () => openForm(null, loadProducts));

tabsEl.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
    btn.addEventListener('click', () => {
        view = btn.dataset.view;
        tabsEl.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
        render();
    });
});

function openProduct(p) {
    const target = `product.html?id=${encodeURIComponent(p._id)}`;
    if (loggedIn()) window.location.href = target;
    else promptLogin(target);
}

function render() {
    const base = view === 'mine' ? products.filter(isMine) : products;
    listTitle.textContent = view === 'mine' ? 'My Listings' : 'All Equipment';
    renderProducts(listEl, filterProducts(base, filters.state), {
        canManage: isMine,
        onOpen: openProduct,
        onChanged: loadProducts,
        emptyText: view === 'mine' && !base.length ? 'Not listed anything yet.' : 'No equipment matches your search.'
    });
}

// Get products from the API
async function loadProducts() {
    const result = await fetchProducts();
    if (!result.ok) {
        filtersEl.hidden = true;
        listEl.innerHTML = `
            <div class="notice">
                <p>Log in to view the equipment listings.</p>
                <a class="btn" href="${loginUrl('browse.html')}">Login</a>
            </div>`;
        return;
    }
    products = result.products;
    filters.setCategories(products);
    render();
}

loadProducts();
