const mongoose = require('mongoose');
const Payment = require('./payment.model');
const Booking = require('../bookings/booking.model');
const Product = require('../products/product.model');
const { AppError, NotFoundError, ConflictError, ValidationError } = require('../../errors');

const POPULATE = [
    { path: 'bookingId' },
    { path: 'renterId', select: '-password' },
    { path: 'holderId', select: '-password' },
    { path: 'productId' }
];

const DAY = 24 * 60 * 60 * 1000;

function toDate(value) {
    const [day, month, year] = value.split('/').map(Number);
    return Date.UTC(year, month - 1, day);
}

function todayDate() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
}

function quoteAmount(product, startDate, endDate) {
    const days = (toDate(endDate) - toDate(startDate)) / DAY + 1;
    let periods = days;
    if (product.schedule === 'Weekly') periods = Math.ceil(days / 7);
    if (product.schedule === 'Monthly') periods = Math.ceil(days / 30);
    return Math.round(product.price * periods * 100) / 100;
}

function paymentResponse(doc) {
    const booking = doc.bookingId;
    return {
        paymentId: doc._id,
        paymentStatus: doc.paymentStatus,
        amount: doc.amount,
        paymentMode: doc.paymentMode,
        paymentDate: doc.paymentDate,
        booking: booking && {
            bookingId: booking._id,
            booking_startdate: booking.booking_startdate,
            booking_enddate: booking.booking_enddate,
            booking_status: booking.booking_status
        },
        equipment: doc.productId,
        holder: doc.holderId,
        renter: doc.renterId
    };
}

exports.createPayment = async (req, res) => {
    if (req.userData.role !== 'Renter') {
        throw new AppError('Only Renters can make payments', 403, 'RENTER_ONLY');
    }
    const booking = await Booking.findById(req.body.bookingId).populate('productId').exec();
    if (!booking) {
        throw new NotFoundError('Booking not found', 'BOOKING_NOT_FOUND');
    }
    if (String(booking.renterId) !== String(req.userData.userId)) {
        throw new AppError('Not your booking', 403, 'NOT_OWNER');
    }
    if (booking.booking_status !== 'Accepted') {
        throw new AppError('Booking must be accepted by the holder before payment', 400, 'BOOKING_NOT_ACCEPTED');
    }
    if (await Payment.exists({ bookingId: booking._id })) {
        throw new ConflictError('This booking is already paid', 'ALREADY_PAID');
    }
    const product = booking.productId;
    if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const details = {};
    if (req.body.booking_startdate !== booking.booking_startdate) details.booking_startdate = 'Start date does not match the booking';
    if (req.body.booking_enddate !== booking.booking_enddate) details.booking_enddate = 'End date does not match the booking';
    const expected = quoteAmount(product, booking.booking_startdate, booking.booking_enddate);
    if (Number(req.body.amount) !== expected) details.amount = `Amount does not match the booking. Expected amount is ${expected}`;
    if (Object.keys(details).length) {
        throw new ValidationError(details);
    }

    const payment = new Payment({
        _id: new mongoose.Types.ObjectId(),
        bookingId: booking._id,
        renterId: booking.renterId,
        holderId: booking.holderId,
        productId: product._id,
        amount: expected,
        paymentMode: req.body.paymentMode,
        paymentDate: todayDate()
    });
    const result = await payment.save();
    const doc = await result.populate(POPULATE);
    res.status(201).json({
        message: 'Payment successful!',
        ...paymentResponse(doc)
    });
};

exports.getProductPayments = async (req, res) => {
    const product = await Product.findById(req.params.productId).exec();
    if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }
    const userId = String(req.userData.userId);
    const filter = { productId: product._id };
    if (req.userData.role === 'Holder') {
        if (String(product.ownerId) !== userId) {
            throw new AppError('Not your listing', 403, 'NOT_OWNER');
        }
    } else {
        filter.renterId = userId;
    }
    const docs = await Payment.find(filter).populate(POPULATE).exec();
    res.status(200).json({
        count: docs.length,
        totalAmount: docs.reduce((sum, p) => sum + p.amount, 0),
        payments: docs.map(paymentResponse)
    });
};
