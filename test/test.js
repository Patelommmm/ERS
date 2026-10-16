const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Product = require('../api/modules/products/product.model');
const User = require('../api/modules/user/user.model');
const Booking = require('../api/modules/bookings/booking.model');
const Comment = require('../api/modules/comments/comment.model');
const Payment = require('../api/modules/payments/payment.model');
const { getProduct } = require('../api/modules/products/product.controller');
const { login } = require('../api/modules/user/user.controller');
const { createBooking } = require('../api/modules/bookings/booking.controller');
const { createComment } = require('../api/modules/comments/comment.controller');
const { createPayment } = require('../api/modules/payments/payment.controller');
const { expect } = chai;

process.env.JWT_KEY = process.env.JWT_KEY || 'test-secret';

// mongoose query
const query = value => {
  const q = { exec: sinon.stub().resolves(value) };
  q.populate = sinon.stub().returns(q);
  return q;
};

const mockRes = () => ({ status: sinon.stub().returnsThis(), json: sinon.spy() });

const getError = async promise => {
  try { await promise; } catch (err) { return err; }
  return null;
};

const id = () => new mongoose.Types.ObjectId();
const holder = { userId: String(id()), role: 'Holder' };
const renter = { userId: String(id()), role: 'Renter' };

afterEach(() => sinon.restore());


describe('GetProduct Function Test', () => {

  it('should return the product', async () => {
    const product = { _id: id(), name: 'Tractor' };
    sinon.stub(Product, 'findById').returns(query(product));
    const res = mockRes();

    await getProduct({ params: { productId: product._id } }, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ product })).to.be.true;
  });

  it('should return 404 if product is not found', async () => {
    sinon.stub(Product, 'findById').returns(query(null));

    const err = await getError(getProduct({ params: { productId: id() } }, mockRes()));

    expect(err.statusCode).to.equal(404);
  });

});


describe('Login Function Test', () => {

  const user = { _id: id(), name: 'Sam', email: 'sam@test.com', password: 'password', role: 'Renter' };

  it('should return a token for correct details', async () => {
    sinon.stub(User, 'findOne').returns(query(user));
    sinon.stub(bcrypt, 'compare').resolves(true);
    const res = mockRes();

    await login({ body: { email: 'sam@test.com', password: 'password' } }, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.firstCall.args[0].token).to.be.a('string');
  });

  it('should return 401 if the password is wrong', async () => {
    sinon.stub(User, 'findOne').returns(query(user));
    sinon.stub(bcrypt, 'compare').resolves(false);

    const err = await getError(login({ body: { email: 'sam@test.com', password: 'wrong' } }, mockRes()));

    expect(err.statusCode).to.equal(401);
  });

});


describe('Booking Function Test', () => {

  it('should create a booking request for a Renter', async () => {
    sinon.stub(Product, 'findById').returns(query({ _id: id(), ownerId: holder.userId }));
    sinon.stub(Booking.prototype, 'save').callsFake(function () { return Promise.resolve(this); });
    sinon.stub(Booking.prototype, 'populate').callsFake(function () { return Promise.resolve(this); });
    const req = { userData: renter, body: { productId: id(), booking_startdate: '10/10/2026', booking_enddate: '12/10/2026' } };
    const res = mockRes();

    await createBooking(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.firstCall.args[0].booking_status).to.equal('Requested');
  });

  it('should return 403 if a Holder tries to book', async () => {
    const err = await getError(createBooking({ userData: holder, body: {} }, mockRes()));

    expect(err.statusCode).to.equal(403);
  });

});


describe('Comment Function Test', () => {

  it('should add a comment with today\'s date', async () => {
    sinon.stub(Product, 'findById').returns(query({ _id: id() }));
    sinon.stub(Comment.prototype, 'save').callsFake(function () { return Promise.resolve(this); });
    sinon.stub(Comment.prototype, 'populate').callsFake(function () { return Promise.resolve(this); });
    const res = mockRes();

    await createComment({ userData: renter, body: { productId: id(), comment: 'Great tractor' } }, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.firstCall.args[0].commentDate).to.match(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('should return 404 if product is not found', async () => {
    sinon.stub(Product, 'findById').returns(query(null));

    const err = await getError(createComment({ userData: renter, body: { productId: id(), comment: 'Hi' } }, mockRes()));

    expect(err.statusCode).to.equal(404);
  });

});


describe('Payment Function Test', () => {

   const booking = {
    _id: id(),
    renterId: renter.userId,
    holderId: holder.userId,
    booking_status: 'Accepted',
    booking_startdate: '10/10/2026',
    booking_enddate: '12/10/2026',
    productId: { _id: id(), price: 100, schedule: 'Daily' }
  };
  const body = amount => ({ bookingId: booking._id, booking_startdate: '10/10/2026', booking_enddate: '12/10/2026', amount, paymentMode: 'Card' });

  it('should take payment when the amount matches the booking', async () => {
    sinon.stub(Booking, 'findById').returns(query(booking));
    sinon.stub(Payment, 'exists').resolves(null);
    sinon.stub(Payment.prototype, 'save').callsFake(function () { return Promise.resolve(this); });
    sinon.stub(Payment.prototype, 'populate').callsFake(function () { return Promise.resolve(this); });
    const res = mockRes();

    await createPayment({ userData: renter, body: body(300) }, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.firstCall.args[0].amount).to.equal(300);
  });

  it('should return 400 if the amount is wrong', async () => {
    sinon.stub(Booking, 'findById').returns(query(booking));
    sinon.stub(Payment, 'exists').resolves(null);

    const err = await getError(createPayment({ userData: renter, body: body(250) }, mockRes()));

    expect(err.statusCode).to.equal(400);
  });

});
