const payload = requireAuth();
const isHolder = payload?.role === 'Holder';

const listEl = document.getElementById('productList');
const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('formModal');
const form = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const listTitle = document.getElementById('listTitle');
let editingId = null;

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.replace('login.html');
});

if (isHolder) {
    addBtn.hidden = false;
    listTitle.textContent = 'My Listings';
}

addBtn?.addEventListener('click', () => openForm());
document.getElementById('cancelForm').addEventListener('click', e => {
    e.preventDefault();
    closeForm();
});

function openForm(product) {
    editingId = product?._id || null;
    formTitle.textContent = editingId ? 'Edit Equipment' : 'Add Equipment';
    form.reset();
    if (product) {
        form.name.value = product.name;
        form.price.value = product.price;
        form.description.value = product.description;
        form.category.value = product.category;
        form.keyFeatures.value = product.keyFeatures || '';
        form.schedule.value = product.schedule;
    }
    modal.hidden = false;
}

function closeForm() {
    modal.hidden = true;
    editingId = null;
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const body = {
        name: form.name.value,
        price: Number(form.price.value),
        description: form.description.value,
        category: form.category.value,
        keyFeatures: form.keyFeatures.value,
        schedule: form.schedule.value
    };
    if (!editingId) {
        body.availability = true;
        body.ownerId = payload.userId;
    }
    await withBuffer(btn, async () => {
        const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
        const res = await fetch(url, {
            method: editingId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            closeForm();
            loadProducts();
        } else {
            alert(data.message || 'Save failed');
        }
    });
});

async function toggleAvailability(id, current) {
    await fetch(`${API}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: !current })
    });
    loadProducts();
}

async function deleteProduct(id) {
    if (!confirm('Delete this equipment?')) return;
    await fetch(`${API}/products/${id}`, { method: 'DELETE' });
    loadProducts();
}

async function loadProducts() {
    const res = await fetch(`${API}/products/`);
    const data = await res.json();
    let products = data.products || [];
    if (isHolder) products = products.filter(p => String(p.ownerId) === String(payload.userId));
    renderList(products);
}

function renderList(products) {
    listEl.innerHTML = '';
    if (!products.length) {
        listEl.innerHTML = '<p>Not listed anything yet.</p>';
        return;
    }
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="asset/logo.svg" class="thumb" alt="${p.name}">
            <div class="info">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p class="price">Starting at $${p.price}/${(p.schedule || '').toLowerCase()}</p>
                <span class="pill">${p.category}</span>
                <span class="status ${p.availability ? 'available' : 'unavailable'}"><span class="dot"></span>${p.availability ? 'Available' : 'Not Available'}</span>
            </div>
            ${isHolder ? `
            <div class="actions">
                <label class="switch">
                    <input type="checkbox" ${p.availability ? 'checked' : ''} data-id="${p._id}" data-current="${p.availability}">
                    <span class="slider"></span>
                </label>
                <button class="icon-btn edit" data-id="${p._id}">&#9998;</button>
                <button class="icon-btn delete" data-id="${p._id}">&#128465;</button>
            </div>` : ''}
        `;
        listEl.appendChild(card);
    });

    if (isHolder) {
        listEl.querySelectorAll('.switch input').forEach(input => {
            input.addEventListener('change', () => toggleAvailability(input.dataset.id, input.dataset.current === 'true'));
        });
        listEl.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', () => openForm(products.find(p => p._id === btn.dataset.id)));
        });
        listEl.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
    }
}

loadProducts();