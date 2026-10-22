const PAYMENT_MODES = ['Card', 'Bank Transfer', 'PayPal'];

let payingBooking = null;
let afterPayment = () => {};

async function fetchPayments(productId) {
    const res = await apiFetch(`${API}/payments/${encodeURIComponent(productId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.payments || [];
}

function money(value) {
    return `$${Number(value).toFixed(2)}`;
}

// Same rule as the API: start and end day both count
function quoteFor(product, booking) {
    const toUtc = value => {
        const [day, month, year] = value.split('/').map(Number);
        return Date.UTC(year, month - 1, day);
    };
    const days = (toUtc(booking.booking_enddate) - toUtc(booking.booking_startdate)) / 86400000 + 1;
    let periods = days;
    if (product.schedule === 'Weekly') periods = Math.ceil(days / 7);
    if (product.schedule === 'Monthly') periods = Math.ceil(days / 30);
    return Math.round(product.price * periods * 100) / 100;
}

// Payment popup form
function ensurePaymentForm() {
    let modal = document.getElementById('paymentModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.className = 'modal';
    modal.hidden = true;
    modal.innerHTML = `
        <form id="paymentForm" class="card">
            <h1>Pay for booking</h1>
            <label for="payStart">Start date</label>
            <input type="text" id="payStart" name="start" readonly>
            <label for="payEnd">End date</label>
            <input type="text" id="payEnd" name="end" readonly>
            <label for="payAmount">Amount</label>
            <input type="text" id="payAmount" name="amount" readonly>
            <label for="payMode">Payment mode</label>
            <select id="payMode" name="paymentMode" required>
                <option value="" disabled selected>Choose payment mode</option>
                ${PAYMENT_MODES.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
            <button type="submit">Pay now</button>
            <p><a href="#" id="cancelPaymentForm">Cancel</a></p>
        </form>`;
    document.body.appendChild(modal);

    modal.querySelector('#cancelPaymentForm').addEventListener('click', e => {
        e.preventDefault();
        closePaymentForm();
    });
    modal.querySelector('form').addEventListener('submit', sendPayment);
    return modal;
}

function openPaymentForm(booking, amount, onPaid) {
    const modal = ensurePaymentForm();
    const form = modal.querySelector('form');
    payingBooking = { ...booking, amount };
    afterPayment = onPaid || (() => {});
    form.reset();
    form.start.value = booking.booking_startdate;
    form.end.value = booking.booking_enddate;
    form.amount.value = money(amount);
    modal.hidden = false;
}

function closePaymentForm() {
    ensurePaymentForm().hidden = true;
    payingBooking = null;
}

async function sendPayment(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    await buffer(btn, async () => {
        const res = await apiFetch(`${API}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId: payingBooking.booking_id,
                booking_startdate: payingBooking.booking_startdate,
                booking_enddate: payingBooking.booking_enddate,
                amount: payingBooking.amount,
                paymentMode: form.paymentMode.value
            })
        });
        const data = await res.json();
        if (res.ok) {
            closePaymentForm();
            alert(`Payment successful! ${money(data.amount)} paid by ${data.paymentMode}.`);
            afterPayment();
        } else {
            alert(data.message || 'Payment failed');
        }
    });
}

function paymentItemHtml(p, isHolder) {
    const who = isHolder
        ? `Renter: <strong>${escapeHtml(p.renter?.name || 'Renter')}</strong> <span>${escapeHtml(p.renter?.email || '')}</span>`
        : `Holder: <strong>${escapeHtml(p.holder?.name || 'Holder')}</strong> <span>${escapeHtml(p.holder?.email || '')}</span>`;
    return `
        <div class="booking-item">
            <div>
                ${who}
                <p><strong>${escapeHtml(money(p.amount))}</strong> by ${escapeHtml(p.paymentMode)} on ${escapeHtml(p.paymentDate)}</p>
                ${p.booking ? `<p>Booking: ${escapeHtml(p.booking.booking_startdate)} to ${escapeHtml(p.booking.booking_enddate)}</p>` : ''}
                <span class="booking-status accepted">${escapeHtml(p.paymentStatus)}</span>
            </div>
        </div>`;
}

function toPayItemHtml(b, amount) {
    return `
        <div class="booking-item" data-id="${escapeHtml(b.booking_id)}">
            <div>
                <p>${escapeHtml(b.booking_startdate)} to ${escapeHtml(b.booking_enddate)}</p>
                <p><strong>${escapeHtml(money(amount))}</strong> to pay</p>
                <span class="booking-status pending">Waiting for payment</span>
            </div>
            <div class="actions"><button class="btn" data-pay>Pay now</button></div>
        </div>`;
}

// Payment part of the product details page
async function renderPaymentSection(container, product, user) {
    const isHolder = user.role === 'Holder';
    if (isHolder && String(product.ownerId) !== String(user.userId)) {
        container.innerHTML = '';
        return;
    }
    const payments = await fetchPayments(product._id);
    const refresh = () => renderPaymentSection(container, product, user);

    if (isHolder) {
        const total = payments.reduce((sum, p) => sum + p.amount, 0);
        container.innerHTML = `
            ${payments.length ? alertHtml('accepted', `${payments.length} payment(s) received, total ${money(total)}`) : ''}
            <div class="booking-head"><h2>Payment history (${payments.length})</h2></div>
            ${payments.length ? payments.map(p => paymentItemHtml(p, true)).join('') : '<p>No payments yet.</p>'}`;
        return;
    }

    const paidIds = new Set(payments.map(p => String(p.booking?.bookingId)));
    const toPay = bookingsFor(await fetchBookings(), product._id)
        .filter(b => b.booking_status === 'Accepted' && !paidIds.has(String(b.booking_id)));
    if (!toPay.length && !payments.length) {
        container.innerHTML = '';
        return;
    }

    const banner = toPay.length
        ? alertHtml('pending', `${toPay.length} accepted booking(s) waiting for your payment`)
        : alertHtml('accepted', 'All your accepted bookings are paid');
    container.innerHTML = `
        ${banner}
        <div class="booking-head"><h2>Payments</h2></div>
        ${toPay.map(b => toPayItemHtml(b, quoteFor(product, b))).join('')}
        <h3>Your payment history (${payments.length})</h3>
        ${payments.length ? payments.map(p => paymentItemHtml(p, false)).join('') : '<p>No payments yet.</p>'}`;

    container.querySelectorAll('[data-pay]').forEach(btn => {
        const id = btn.closest('.booking-item').dataset.id;
        const booking = toPay.find(b => String(b.booking_id) === id);
        btn.addEventListener('click', () => openPaymentForm(booking, quoteFor(product, booking), refresh));
    });
}
