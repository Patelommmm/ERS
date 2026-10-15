const BOOKING_STATUS_CLASS = { Requested: 'pending', Accepted: 'accepted', Declined: 'declined' };

let bookingProduct = null;
let afterBooking = () => {};

async function fetchBookings() {
    const res = await apiFetch(`${API}/bookings`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.bookings || [];
}

function bookingsFor(bookings, productId) {
    return bookings.filter(b => b.equipment && String(b.equipment._id) === String(productId));
}

// Date input gives yyyy-mm-dd, the API wants dd/mm/yyyy
function toApiDate(value) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
}

function bookingStatusHtml(b) {
    return `<span class="booking-status ${BOOKING_STATUS_CLASS[b.booking_status] || ''}">${escapeHtml(b.booking_status)}</span>`;
}

function alertHtml(type, text) {
    return `<div class="alert alert-${type}" role="alert">${escapeHtml(text)}</div>`;
}

// Booking request popup form
function ensureBookingForm() {
    let modal = document.getElementById('bookingModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'bookingModal';
    modal.className = 'modal';
    modal.hidden = true;
    modal.innerHTML = `
        <form id="bookingForm" class="card">
            <h1 id="bookingTitle">Book Equipment</h1>
            <label for="bookingStart">Start date</label>
            <input type="date" id="bookingStart" name="start" required>
            <label for="bookingEnd">End date</label>
            <input type="date" id="bookingEnd" name="end" required>
            <button type="submit">Send request</button>
            <p><a href="#" id="cancelBookingForm">Cancel</a></p>
        </form>`;
    document.body.appendChild(modal);

    modal.querySelector('#cancelBookingForm').addEventListener('click', e => {
        e.preventDefault();
        closeBookingForm();
    });
    modal.querySelector('form').addEventListener('submit', sendBooking);
    return modal;
}

function openBookingForm(product, onBooked) {
    const modal = ensureBookingForm();
    const form = modal.querySelector('form');
    const today = new Date().toISOString().split('T')[0];
    bookingProduct = product;
    afterBooking = onBooked || (() => {});
    modal.querySelector('#bookingTitle').textContent = `Book ${product.name}`;
    form.reset();
    form.start.min = today;
    form.end.min = today;
    modal.hidden = false;
}

function closeBookingForm() {
    ensureBookingForm().hidden = true;
    bookingProduct = null;
}

async function sendBooking(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    await buffer(btn, async () => {
        const res = await apiFetch(`${API}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: bookingProduct._id,
                booking_startdate: toApiDate(form.start.value),
                booking_enddate: toApiDate(form.end.value)
            })
        });
        const data = await res.json();
        if (res.ok) {
            closeBookingForm();
            alert('Booking request sent! The holder will accept or decline it.');
            afterBooking();
        } else {
            alert(data.message || 'Booking failed');
        }
    });
}

async function setBookingStatus(id, status) {
    const action = status === 'Accepted' ? 'accept' : 'decline';
    if (!confirm(`Are you sure you want to ${action} this booking request?`)) return false;
    const res = await apiFetch(`${API}/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_status: status })
    });
    const data = await res.json();
    alert(res.ok ? `Booking ${status.toLowerCase()}.` : (data.message || 'Update failed'));
    return res.ok;
}

async function cancelBooking(id) {
    if (!confirm('Cancel this booking? It will be removed and cannot be undone.')) return false;
    const res = await apiFetch(`${API}/bookings/${id}`, { method: 'DELETE' });
    const data = await res.json();
    alert(res.ok ? 'Booking cancelled.' : (data.message || 'Cancel failed'));
    return res.ok;
}

function bookingItemHtml(b, isHolder) {
    const who = isHolder
        ? `<strong>${escapeHtml(b.renter?.name || 'Renter')}</strong> <span>${escapeHtml(b.renter?.email || '')}</span>`
        : '';
    const buttons = isHolder
        ? (b.booking_status === 'Requested'
            ? '<button class="btn" data-status="Accepted">Accept</button><button class="btn btn-outline" data-status="Declined">Decline</button>'
            : '')
        : '<button class="btn btn-outline" data-cancel>Cancel booking</button>';
    return `
        <div class="booking-item" data-id="${escapeHtml(b.booking_id)}">
            <div>
                ${who}
                <p>${escapeHtml(b.booking_startdate)} to ${escapeHtml(b.booking_enddate)}</p>
                ${bookingStatusHtml(b)}
            </div>
            <div class="actions">${buttons}</div>
        </div>`;
}

// Banner at the top so users can see what still needs attention
function summaryAlert(list, isHolder) {
    const pending = list.filter(b => b.booking_status === 'Requested').length;
    if (isHolder) {
        return pending ? alertHtml('pending', `${pending} booking request(s) waiting for your answer`) : '';
    }
    if (pending) return alertHtml('pending', 'Your booking request is waiting for the holder to answer');
    if (list.some(b => b.booking_status === 'Accepted')) return alertHtml('accepted', 'Your booking is accepted');
    if (list.some(b => b.booking_status === 'Declined')) return alertHtml('declined', 'Your booking request was declined');
    return '';
}

// Booking part of the product details page
async function renderBookingSection(container, product, user) {
    const isHolder = user.role === 'Holder';
    if (isHolder && String(product.ownerId) !== String(user.userId)) {
        container.innerHTML = '';
        return;
    }
    const list = bookingsFor(await fetchBookings(), product._id);
    const refresh = () => renderBookingSection(container, product, user);
    const title = isHolder ? `Booking requests (${list.length})` : 'Your bookings';
    const bookBtn = isHolder ? '' : product.availability
        ? '<button class="btn" data-book>Book this equipment</button>'
        : '<p>This equipment is not available for booking right now.</p>';
    const emptyText = isHolder ? 'No booking requests yet.' : 'You have not booked this equipment yet.';

    container.innerHTML = `
        ${summaryAlert(list, isHolder)}
        <div class="booking-head">
            <h2>${title}</h2>
            ${bookBtn}
        </div>
        ${list.length ? list.map(b => bookingItemHtml(b, isHolder)).join('') : `<p>${emptyText}</p>`}`;

    container.querySelector('[data-book]')?.addEventListener('click', () => openBookingForm(product, refresh));
    container.querySelectorAll('.booking-item').forEach(item => {
        const id = item.dataset.id;
        item.querySelectorAll('[data-status]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await setBookingStatus(id, btn.dataset.status)) refresh();
            });
        });
        item.querySelector('[data-cancel]')?.addEventListener('click', async () => {
            if (await cancelBooking(id)) refresh();
        });
    });
}

// Small badge on browse cards with the booking count or status
function bookingBadgeHtml(list, isHolder) {
    if (!list.length) return '';
    if (isHolder) {
        const pending = list.filter(b => b.booking_status === 'Requested').length;
        return `<span class="booking-badge ${pending ? 'pending' : ''}">${list.length} booking request(s)${pending ? `, ${pending} waiting` : ''}</span>`;
    }
    const latest = list[list.length - 1];
    return `<span class="booking-badge ${BOOKING_STATUS_CLASS[latest.booking_status] || ''}">Booking: ${escapeHtml(latest.booking_status)}</span>`;
}
