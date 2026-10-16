// Browse page
const user = loggedIn();
const isHolder = user?.role === 'Holder';
const params = new URLSearchParams(window.location.search);

const listEl = document.getElementById('productList');
const listTitle = document.getElementById('listTitle');
const filtersEl = document.getElementById('filters');
const addBtn = document.getElementById('addBtn');
let products = [];
let bookings = [];
const view = isHolder ? 'mine' : 'all';

const STATUSES = ['Available', 'Booking requested', 'Booking accepted'];
const filters = setupFilters(filtersEl, render, { category: params.get('category'), statuses: STATUSES });
const isMine = p => isHolder && String(p.ownerId) === String(user.userId);

if (isHolder) {
    addBtn.hidden = false;
}

addBtn.addEventListener('click', () => openForm(null, loadProducts));

function openProduct(p) {
    const target = `product.html?id=${encodeURIComponent(p._id)}`;
    if (loggedIn()) window.location.href = target;
    else promptLogin(target);
}

// Status chips: availability, or the user's own booking status for that item
function matchesStatus(p) {
    const status = filters.state.status;
    const list = bookingsFor(bookings, p._id);
    if (status === 'Available') return p.availability;
    if (status === 'Booking requested') return list.some(b => b.booking_status === 'Requested');
    if (status === 'Booking accepted') return list.some(b => b.booking_status === 'Accepted');
    return true;
}

function render() {
    const base = view === 'mine' ? products.filter(isMine) : products;
    listTitle.textContent = view === 'mine' ? 'My Listings' : 'All Equipment';
    renderProducts(listEl, filterProducts(base, filters.state).filter(matchesStatus), {
        canManage: isMine,
        onOpen: openProduct,
        onChanged: loadProducts,
        badge: p => bookingBadgeHtml(bookingsFor(bookings, p._id), isHolder),
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
    bookings = user ? await fetchBookings() : [];
    filters.setCategories(products);
    render();
}

loadProducts();
