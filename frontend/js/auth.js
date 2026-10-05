const API = '';

// decoding auth token
function decodeToken(token) {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function loggedIn() {
    const token = localStorage.getItem('token');
    const payload = token && decodeToken(token);
    return payload && payload.exp * 1000 > Date.now() ? payload : null;
}

function currentPage() {
    return window.location.pathname.split('/').pop() + window.location.search;
}

function loginUrl(next) {
    return 'login.html' + (next ? `?next=${encodeURIComponent(next)}` : '');
}

function safeNext(fallback = 'browse.html') {
    const next = new URLSearchParams(window.location.search).get('next');
    return next && /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(next) ? next : fallback;
}

function logout() {
    localStorage.removeItem('token');
    window.location.replace('index.html');
}

// if they are not logged in
function requireAuth() {
    const payload = loggedIn();
    if (!payload) {
        localStorage.removeItem('token');
        window.location.replace(loginUrl(currentPage()));
        return null;
    }
    return payload;
}

// fetch token to the request
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = Object.assign({}, options.headers, token ? { Authorization: `Bearer ${token}` } : {});
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.replace(loginUrl(currentPage()));
        throw new Error('Authentication failed, try again');
    }
    return res;
}

// Disable the button while a request is running
async function buffer(btn, task) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Please Wait..';
    try {
        return await task();
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
}

if (document.getElementById('login') || document.getElementById('signup')) {
    if (loggedIn()) window.location.replace(safeNext());
    const next = new URLSearchParams(window.location.search).get('next');
    if (next) {
        document.querySelectorAll('[data-keep-next]').forEach(a => {
            a.href += `?next=${encodeURIComponent(next)}`;
        });
    }
}

window.addEventListener('pageshow', e => {
    if (e.persisted) window.location.reload();
});

// Login form
document.getElementById('login')?.addEventListener('submit', async e => {
    e.preventDefault();
    const { email, password } = e.target;
    const btn = e.target.querySelector('button');
    await buffer(btn, async () => {
        const res = await fetch(`${API}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value, password: password.value })
        });
        const data = await res.json();
        if (res.ok && data.token && decodeToken(data.token)) {
            localStorage.setItem('token', data.token);
            window.location.replace(safeNext());
        } else {
            alert(data.message || 'Login failed');
        }
    });
});

// Signup form
document.getElementById('signup')?.addEventListener('submit', async e => {
    e.preventDefault();
    const { name, email, password, role } = e.target;
    const btn = e.target.querySelector('button');
    await buffer(btn, async () => {
        const res = await fetch(`${API}/user/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.value, email: email.value, password: password.value, role: role.value })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Account created! Please log in.');
            window.location.replace(loginUrl(new URLSearchParams(window.location.search).get('next')));
        } else {
            alert(data.message || 'Signup failed');
        }
    });
});
