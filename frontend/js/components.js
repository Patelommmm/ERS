function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function logo() {
    return `
        <a href="index.html" class="brand-link">
            <img src="asset/logo.svg" alt="logo" class="logo-img">
            <span class="brand">ERS Rentals</span>
        </a>`;
}

// Base class for header and footer
class Component {
    constructor(selector) {
        this.selector = selector;
    }

    html() {
        return '';
    }

    events() {}

    render() {
        this.el = document.querySelector(this.selector);
        if (!this.el) return this;
        this.el.innerHTML = this.html();
        this.events();
        return this;
    }
}

class Navbar extends Component {
    constructor({ user = loggedIn(), page = window.location.pathname.split('/').pop(), home = true, cta = false } = {}) {
        super(null);
        this.user = user;
        this.page = page || 'index.html';
        this.home = home;
        this.cta = cta;
    }

    links() {
        const links = [{ href: 'browse.html', text: 'Browse' }];
        if (this.home) links.unshift({ href: 'index.html', text: 'Home' });
        if (!this.user) {
            links.push({ href: 'login.html', text: 'Login' }, { href: 'signup.html', text: 'Sign up', cta: this.cta });
        }
        return links;
    }

    html() {
        return this.links().map(link => {
            const classes = [link.cta && 'nav-cta', link.href === this.page && 'active'].filter(Boolean).join(' ');
            return `<a href="${link.href}"${classes ? ` class="${classes}"` : ''}>${link.text}</a>`;
        }).join('');
    }
}

class Profile extends Component {
    constructor(user) {
        super(null);
        this.user = user;
    }

    name() {
        return this.user.name || String(this.user.email || '').split('@')[0];
    }

    html() {
        const name = escapeHtml(this.name());
        const letter = escapeHtml(this.name().charAt(0).toUpperCase());
        return `
            <div class="profile">
                <button type="button" class="profile-btn" aria-haspopup="true" aria-expanded="false">
                    <span class="avatar">${letter}</span>
                    <span class="profile-name">${name}</span>
                </button>
                <div class="profile-panel" hidden>
                    <div class="profile-head">
                        <span class="avatar avatar-lg">${letter}</span>
                        <strong>${name}</strong>
                    </div>
                    <dl class="facts">
                        <dt>Name</dt><dd>${name}</dd>
                        <dt>Email</dt><dd>${escapeHtml(this.user.email)}</dd>
                        <dt>Role</dt><dd>${escapeHtml(this.user.role)}</dd>
                    </dl>
                    <button type="button" class="btn btn-outline logout-btn">Logout</button>
                </div>
            </div>`;
    }

    events() {
        const btn = this.el.querySelector('.profile-btn');
        const panel = this.el.querySelector('.profile-panel');
        const toggle = open => {
            panel.hidden = !open;
            btn.setAttribute('aria-expanded', String(open));
        };
        btn.addEventListener('click', () => toggle(panel.hidden));
        document.addEventListener('click', e => {
            if (!panel.hidden && !this.el.contains(e.target)) toggle(false);
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') toggle(false);
        });
        this.el.querySelector('.logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) logout();
        });
    }
}

class Header extends Component {
    constructor(selector, options = {}) {
        super(selector);
        this.navbar = new Navbar({ ...options, home: false, cta: true });
        this.profile = this.navbar.user ? new Profile(this.navbar.user) : null;
    }

    html() {
        return `
            ${logo()}
            <nav class="nav">
                ${this.navbar.html()}
                ${this.profile ? this.profile.html() : ''}
            </nav>`;
    }

    events() {
        if (!this.profile) return;
        this.profile.el = this.el.querySelector('.profile');
        this.profile.events();
    }
}

class Footer extends Component {
    constructor(selector, options = {}) {
        super(selector);
        this.navbar = new Navbar(options);
    }

    html() {
        return `
            <div class="footer-top">
                <div>
                    ${logo()}
                    <p>Equipment rental for farming, industrial, moving and logistics work.</p>
                </div>
                <nav class="footer-links">${this.navbar.html()}</nav>
            </div>
            <p class="copyright">&copy; ${new Date().getFullYear()} ERS Rentals</p>`;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { escapeHtml, Component, Navbar, Profile, Header, Footer };
} else {
    // Show the header and footer on every page
    new Header('#topbar').render();
    new Footer('#footer').render();
}
