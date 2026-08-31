const API = 'http://localhost:3000';

function decodeToken(token) {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function isAuthed() {
    const token = localStorage.getItem('token');
    const payload = token && decodeToken(token);
    return payload && payload.exp * 1000 > Date.now() ? payload : null;
}

function requireAuth() {
    const payload = isAuthed();
    if (!payload) {
        localStorage.removeItem('token');
        window.location.replace('login.html');
        return null;
    }
    return payload;
}

async function withBuffer(btn, task) {
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

if (document.getElementById('loginForm') || document.getElementById('signupForm')) {
    if (isAuthed()) window.location.replace('welcome.html');
}

window.addEventListener('pageshow', e => {
    if (e.persisted) window.location.reload();
});

document.getElementById('loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const { email, password } = e.target;
    const btn = e.target.querySelector('button');
    await withBuffer(btn, async () => {
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

document.getElementById('signupForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const { name, email, password, role } = e.target;
    const btn = e.target.querySelector('button');
    await withBuffer(btn, async () => {
        const res = await fetch(`${API}/user/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.value, email: email.value, password: password.value, role: role.value })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Account created! Please log in.');
            window.location.replace('login.html');
        } else {
            alert(data.message || 'Signup failed');
        }
    });
});