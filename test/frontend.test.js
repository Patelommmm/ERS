const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const { CATEGORIES, categoryOptions, filterProducts, priceText } = require('../frontend/js/listing');
const { escapeHtml, Component, Navbar, Profile, Header, Footer } = require('../frontend/js/components');

const products = [
    { name: 'Tractor', description: 'Large farm tractor', category: 'Farming', keyFeatures: 'GPS, 4WD', availability: true, price: 100, schedule: 'Daily' },
    { name: 'Forklift', description: 'Warehouse forklift', category: 'industrial', keyFeatures: 'Electric', availability: false, price: 50, schedule: 'Weekly' },
    { name: 'Van', description: 'Moving van with ramp', category: 'Moving', keyFeatures: '', availability: true, price: 80, schedule: 'Monthly' },
    { name: 'Drone', description: 'Survey drone kit', category: 'Survey', availability: true, price: 30, schedule: 'Daily' }
];

describe('Frontend pages', () => {
    const pages = [
        ['/', 'Browse equipment'],
        ['/login.html', 'id="login"'],
        ['/signup.html', 'id="signup"'],
        ['/browse.html', 'id="tabs"'],
        ['/product.html', 'id="detail"']
    ];

    it('GET /welcome.html is gone', async () => {
        const res = await request(app).get('/welcome.html');
        expect(res.status).to.equal(404);
    });

    pages.forEach(([url, marker]) => {
        it(`GET ${url} is served with header and footer`, async () => {
            const res = await request(app).get(url);
            expect(res.status).to.equal(200);
            expect(res.text).to.include(marker);
            expect(res.text).to.include('id="topbar"');
            expect(res.text).to.include('id="footer"');
            expect(res.text).to.include('js/components.js');
        });
    });
});

describe('Header, Navbar and Footer', () => {
    const user = { userId: '1', role: 'Holder', email: 'sam.lee@example.com' };

    it('Navbar shows login links for guests', () => {
        const html = new Navbar({ user: null, page: 'browse.html' }).html();
        expect(html).to.include('href="login.html"');
        expect(html).to.include('href="signup.html"');
        expect(html).to.include('<a href="browse.html" class="active">');
    });

    it('Navbar hides login links for logged in users', () => {
        const html = new Navbar({ user, page: 'index.html' }).html();
        expect(html).to.include('href="browse.html"');
        expect(html).to.not.include('login.html');
        expect(html).to.not.include('signup.html');
    });

    it('Header shows the profile instead of a logout link when logged in', () => {
        const html = new Header('#topbar', { user, page: 'browse.html' }).html();
        expect(html).to.include('class="profile-name">sam.lee<');
        expect(html).to.include('logout-btn');
        expect(new Header('#topbar', { user: null, page: 'index.html' }).html()).to.not.include('profile');
    });

    it('Profile panel shows the user details with logout at the bottom', () => {
        const html = new Profile(user).html();
        expect(html).to.include('sam.lee@example.com');
        expect(html).to.include('<dd>Holder</dd>');
        expect(html.lastIndexOf('logout-btn')).to.be.greaterThan(html.indexOf('</dl>'));
    });

    it('Profile uses the real name when the token has one', () => {
        expect(new Profile({ ...user, name: 'Sam Lee' }).name()).to.equal('Sam Lee');
        expect(new Profile(user).name()).to.equal('sam.lee');
    });

    it('Profile escapes user details', () => {
        expect(new Profile({ email: '<b>x@y.com', role: 'Renter' }).html()).to.not.include('<b>');
    });

    it('Header leaves out Home and highlights sign up', () => {
        const html = new Header('#topbar', { user: null, page: 'index.html' }).html();
        expect(html).to.not.include('>Home<');
        expect(html).to.include('class="nav-cta"');
    });

    it('Footer reuses the same links and shows the year', () => {
        const html = new Footer('#footer', { user: null, page: 'index.html' }).html();
        expect(html).to.include('>Home<');
        expect(html).to.include('>Browse<');
        expect(html).to.include(String(new Date().getFullYear()));
        expect(html).to.not.include('nav-cta');
    });

    it('Header and Footer are Components', () => {
        expect(new Header('#topbar', { user: null, page: 'index.html' })).to.be.instanceOf(Component);
        expect(new Footer('#footer', { user: null, page: 'index.html' })).to.be.instanceOf(Component);
    });
});

describe('Listing helpers', () => {
    it('filters by category ignoring case', () => {
        const result = filterProducts(products, { category: 'Industrial' });
        expect(result.map(p => p.name)).to.deep.equal(['Forklift']);
    });

    it('returns everything for the All category', () => {
        expect(filterProducts(products, { category: 'All' })).to.have.length(4);
    });

    it('searches name, description, category and key features', () => {
        expect(filterProducts(products, { search: 'gps' }).map(p => p.name)).to.deep.equal(['Tractor']);
        expect(filterProducts(products, { search: 'RAMP' }).map(p => p.name)).to.deep.equal(['Van']);
        expect(filterProducts(products, { search: 'moving' }).map(p => p.name)).to.deep.equal(['Van']);
    });

    it('can show available items only', () => {
        const result = filterProducts(products, { availableOnly: true });
        expect(result.map(p => p.name)).to.not.include('Forklift');
    });

    it('combines category, search and availability', () => {
        expect(filterProducts(products, { category: 'Farming', search: 'tractor', availableOnly: true })).to.have.length(1);
        expect(filterProducts(products, { category: 'Farming', search: 'van' })).to.have.length(0);
    });

    it('keeps existing categories that are not in the default list', () => {
        const options = categoryOptions(products);
        expect(options).to.include.members(CATEGORIES);
        expect(options).to.include('Survey');
        expect(options.filter(c => c.toLowerCase() === 'industrial')).to.have.length(1);
    });

    it('escapes HTML in product text', () => {
        expect(escapeHtml('<img src=x onerror="a">')).to.equal('&lt;img src=x onerror=&quot;a&quot;&gt;');
        expect(escapeHtml(undefined)).to.equal('');
    });

    it('formats the price with the schedule', () => {
        expect(priceText(products[0])).to.equal('Starting at $100/daily');
    });
});
