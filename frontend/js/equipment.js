let editingId = null;
let afterSave = () => {};

//add and edit popup form
function ensureForm() {
    let modal = document.getElementById('formModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'formModal';
    modal.className = 'modal';
    modal.hidden = true;
    modal.innerHTML = `
        <form id="productForm" class="card">
            <h1 id="formTitle">Add Equipment</h1>
            <input type="text" name="name" placeholder="Name" required>
            <input type="number" name="price" placeholder="Price per period" required min="0">
            <input type="text" name="description" placeholder="Description" required minlength="10">
            <select name="category" required></select>
            <input type="text" name="keyFeatures" placeholder="Key Features">
            <select name="schedule" required>
                <option value="" disabled selected>Rental Schedule</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
            </select>
            <button type="submit">Save</button>
            <p><a href="#" id="cancelForm">Cancel</a></p>
        </form>`;
    document.body.appendChild(modal);

    modal.querySelector('#cancelForm').addEventListener('click', e => {
        e.preventDefault();
        closeForm();
    });
    modal.querySelector('form').addEventListener('submit', saveForm);
    return modal;
}

function fillCategorySelect(select, current) {
    const options = categoryOptions(current ? [{ category: current }] : []);
    select.innerHTML = '<option value="" disabled selected>Category</option>' +
        options.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (current) select.value = options.find(c => sameText(c, current));
}

function openForm(product, onSaved) {
    const modal = ensureForm();
    const form = modal.querySelector('form');
    editingId = product?._id || null;
    afterSave = onSaved || (() => {});
    modal.querySelector('#formTitle').textContent = editingId ? 'Edit Equipment' : 'Add Equipment';
    form.reset();
    fillCategorySelect(form.category, product?.category);
    if (product) {
        form.name.value = product.name;
        form.price.value = product.price;
        form.description.value = product.description;
        form.keyFeatures.value = product.keyFeatures || '';
        form.schedule.value = product.schedule;
    }
    modal.hidden = false;
}

function closeForm() {
    ensureForm().hidden = true;
    editingId = null;
}

// Add new or update it when editing
async function saveForm(e) {
    e.preventDefault();
    const form = e.target;
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
    }
    await buffer(btn, async () => {
        const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
        const res = await apiFetch(url, {
            method: editingId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            closeForm();
            afterSave();
        } else {
            alert(data.message || 'Save failed');
        }
    });
}

async function toggleAvailability(id, current) {
    await apiFetch(`${API}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: !current })
    });
}

async function deleteProduct(id) {
    if (!confirm('Delete this equipment?')) return false;
    const res = await apiFetch(`${API}/products/${id}`, { method: 'DELETE' });
    return res.ok;
}

// Toggle, edit and delete buttons
function manageActionsHtml(p) {
    return `
        <div class="actions">
            <label class="switch" title="Availability">
                <input type="checkbox" ${p.availability ? 'checked' : ''} aria-label="Available">
                <span class="slider"></span>
            </label>
            <button class="icon-btn edit" title="Edit">&#9998;</button>
            <button class="icon-btn delete" title="Delete">&#128465;</button>
        </div>`;
}

function bindManageActions(root, product, onChanged = () => {}) {
    root.querySelector('.switch input').addEventListener('change', async () => {
        await toggleAvailability(product._id, product.availability);
        onChanged('updated');
    });
    root.querySelector('.edit').addEventListener('click', () => openForm(product, () => onChanged('updated')));
    root.querySelector('.delete').addEventListener('click', async () => {
        if (await deleteProduct(product._id)) onChanged('deleted');
    });
}
