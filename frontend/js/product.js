// Product details page
const payload = requireAuth();
const productId = new URLSearchParams(window.location.search).get('id');
const detailEl = document.getElementById('detail');

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : '';
}

function featureList(text) {
    return String(text || '').split(/[,\n]/).map(f => f.trim()).filter(Boolean);
}

function showNotFound() {
    detailEl.innerHTML = '<div class="notice"><p>Equipment not found.</p><a class="btn" href="browse.html">Browse equipment</a></div>';
}

function renderDetail(p) {
    const mine = payload.role === 'Holder' && String(p.ownerId) === String(payload.userId);
    const features = featureList(p.keyFeatures);
    document.title = `${p.name} | ERS Rentals`;
    detailEl.innerHTML = `
        <div class="detail">
            <div class="detail-media"><img src="asset/logo.svg" alt="${escapeHtml(p.name)}"></div>
            <div class="detail-body">
                <span class="pill">${escapeHtml(p.category)}</span>
                ${mine ? '<span class="pill pill-outline">Your listing</span>' : ''}
                <h1>${escapeHtml(p.name)}</h1>
                <p class="price">${escapeHtml(priceText(p))}</p>
                ${statusHtml(p)}
                <h3>Description</h3>
                <p>${escapeHtml(p.description)}</p>
                ${features.length ? `<h3>Key features</h3><ul>${features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : ''}
                <dl class="facts">
                    <dt>Rental schedule</dt><dd>${escapeHtml(p.schedule)}</dd>
                    ${p.createdAt ? `<dt>Listed on</dt><dd>${escapeHtml(formatDate(p.createdAt))}</dd>` : ''}
                    ${p.updatedAt ? `<dt>Last updated</dt><dd>${escapeHtml(formatDate(p.updatedAt))}</dd>` : ''}
                </dl>
                ${mine ? manageActionsHtml(p) : ''}
            </div>
        </div>`;
    if (mine) {
        bindManageActions(detailEl, p, change => {
            if (change === 'deleted') window.location.replace('browse.html');
            else loadProduct();
        });
    }
}

async function loadProduct() {
    const res = await apiFetch(`${API}/products/${encodeURIComponent(productId)}`);
    const data = res.ok ? await res.json() : {};
    if (data.product) renderDetail(data.product);
    else showNotFound();
}

if (payload) {
    if (productId) loadProduct();
    else showNotFound();
}
