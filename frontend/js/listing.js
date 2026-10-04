// Default categories used as filters
const CATEGORIES = ['Farming', 'Industrial', 'Construction', 'Moving', 'Logistics', 'Landscaping', 'Events', 'Other'];

function sameText(a, b) {
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function categoryOptions(products = []) {
    const list = [...CATEGORIES];
    products.forEach(p => {
        if (p.category && !list.some(c => sameText(c, p.category))) list.push(p.category);
    });
    return list;
}

// Filter by category, search text and availability
function filterProducts(products, { category = 'All', search = '', availableOnly = false } = {}) {
    const term = search.trim().toLowerCase();
    return products.filter(p =>
        (category === 'All' || sameText(p.category, category)) &&
        (!availableOnly || p.availability) &&
        (!term || [p.name, p.description, p.category, p.keyFeatures]
            .some(v => String(v || '').toLowerCase().includes(term)))
    );
}

function priceText(p) {
    return `Starting at $${p.price}/${(p.schedule || '').toLowerCase()}`;
}

function statusHtml(p) {
    return `<span class="status ${p.availability ? 'available' : 'unavailable'}"><span class="dot"></span>${p.availability ? 'Available' : 'Not Available'}</span>`;
}

function productCardHtml(p) {
    return `
        <img src="asset/logo.svg" class="thumb" alt="${escapeHtml(p.name)}">
        <div class="info">
            <h3>${escapeHtml(p.name)}</h3>
            <p>${escapeHtml(p.description)}</p>
            <p class="price">${escapeHtml(priceText(p))}</p>
            <span class="pill">${escapeHtml(p.category)}</span>
            ${statusHtml(p)}
        </div>`;
}

async function fetchProducts() {
    const url = `${API}/products/`;
    const res = loggedIn() ? await apiFetch(url) : await fetch(url);
    if (!res.ok) return { ok: false, status: res.status, products: [] };
    const data = await res.json();
    return { ok: true, status: res.status, products: data.products || [] };
}

function renderProducts(listEl, products, { canManage, onOpen, onChanged, emptyText = 'No equipment found.' } = {}) {
    listEl.innerHTML = '';
    if (!products.length) {
        listEl.innerHTML = `<p>${escapeHtml(emptyText)}</p>`;
        return;
    }
    products.forEach(p => {
        const manage = canManage ? canManage(p) : false;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'link');
        card.innerHTML = productCardHtml(p) + (manage ? manageActionsHtml(p) : '');
        if (manage) bindManageActions(card, p, onChanged);
        card.addEventListener('click', e => {
            if (!e.target.closest('.actions')) onOpen(p);
        });
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.target === card) onOpen(p);
        });
        listEl.appendChild(card);
    });
}

function setupFilters(root, onChange, { category } = {}) {
    const state = { category: category || 'All', search: '', availableOnly: false };
    root.className = 'filters';
    root.innerHTML = `
        <div class="filter-row">
            <input type="search" class="search" placeholder="Search equipment..." aria-label="Search equipment">
            <label class="check"><input type="checkbox"> Available only</label>
        </div>
        <div class="chips" role="group" aria-label="Filter by category"></div>`;
    const chipsEl = root.querySelector('.chips');
    let options = categoryOptions();

    function renderChips() {
        chipsEl.innerHTML = '';
        ['All', ...options].forEach(name => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip' + (sameText(name, state.category) ? ' active' : '');
            chip.textContent = name;
            chip.addEventListener('click', () => {
                state.category = name;
                renderChips();
                onChange();
            });
            chipsEl.appendChild(chip);
        });
    }

    root.querySelector('.search').addEventListener('input', e => {
        state.search = e.target.value;
        onChange();
    });
    root.querySelector('.check input').addEventListener('change', e => {
        state.availableOnly = e.target.checked;
        onChange();
    });

    renderChips();
    return {
        state,
        setCategories(products) {
            options = categoryOptions(products);
            renderChips();
        }
    };
}

function renderCategoryTiles(container) {
    container.innerHTML = CATEGORIES.map(c =>
        `<a class="tile" href="browse.html?category=${encodeURIComponent(c)}">${escapeHtml(c)}</a>`
    ).join('');
}

// Popup asking guests to log in before they can see details
function promptLogin(next) {
    let modal = document.getElementById('loginPrompt');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loginPrompt';
        modal.className = 'modal';
        modal.hidden = true;
        modal.addEventListener('click', e => {
            if (e.target === modal || e.target.matches('[data-close]')) {
                e.preventDefault();
                modal.hidden = true;
            }
        });
        document.body.appendChild(modal);
    }
    const query = next ? `?next=${encodeURIComponent(next)}` : '';
    modal.innerHTML = `
        <div class="card">
            <h1>Login required</h1>
            <p class="lead">Please log in to see the full details of this equipment.</p>
            <a class="btn" href="login.html${query}">Login</a>
            <a class="btn btn-outline" href="signup.html${query}">Sign up</a>
            <p><a href="#" data-close>Cancel</a></p>
        </div>`;
    modal.hidden = false;
}

if (typeof module !== 'undefined') {
    module.exports = { CATEGORIES, sameText, categoryOptions, filterProducts, priceText };
}
