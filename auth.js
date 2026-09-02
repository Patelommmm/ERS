const API = 'http://localhost:3000';

function decodeToken(token) {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function loggedIn() {
    const token = localStorage.getItem('token');
    const payload = token && decodeToken(token);
    return payload && payload.exp * 1000 > Date.now() ? payload : null;
}

function requireAuth() {
    const payload = loggedIn();
    if (!payload) {
        localStorage.removeItem('token');
        window.location.replace('index.html');
        return null;
    }
    return payload;
}

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = Object.assign({}, options.headers, token ? { Authorization: `Bearer ${token}` } : {});
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.replace('index.html');
        throw new Error('Not authenticated');
    }
    return res;
}

async function buffer(btn, task) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Please wait...';
    try {
        return await task();
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
}

if (document.getElementById('login') || document.getElementById('signup')) {
    if (loggedIn()) window.location.replace('welcome.html');
}

window.addEventListener('pageshow', e => {
    if (e.persisted) window.location.reload();
});

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
            window.location.replace('welcome.html');
        } else {
            alert(data.message || 'Login failed');
        }
    });
});

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
            window.location.replace('index.html');
        } else {
            alert(data.message || 'Signup failed');
        }
    });
});
