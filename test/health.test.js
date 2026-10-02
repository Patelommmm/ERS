const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');

describe('Health check and error handling', () => {
    it('GET /health returns 200 with status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).to.equal(200);
        expect(res.body.status).to.equal('ok');
    });

    it('GET / returns the login page', async () => {
        const res = await request(app).get('/');
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Login');
    });

    it('unknown route returns 404 with a JSON error', async () => {
        const res = await request(app).get('/does-not-exist');
        expect(res.status).to.equal(404);
        expect(res.body.error.message).to.equal('Not Found');
    });
});