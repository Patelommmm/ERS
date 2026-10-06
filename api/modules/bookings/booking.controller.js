const mongoose = require('mongoose');
const Booking = require('./booking.model');
const Product = require('../products/product.model');
const { AppError, NotFoundError, ValidationError } = require('../../errors');

const POPULATE = [
    { path: 'renterId', select: '-password' },
    { path: 'holderId', select: '-password' },
    { path: 'productId' }
];

function bookingResponse(doc) {
    return {
        booking_id: doc._id,
        renter: doc.renterId,
        holder: doc.holderId,
        equipment: doc.productId,
        booking_startdate: doc.booking_startdate,
        booking_enddate: doc.booking_enddate,
        booking_status: doc.booking_status
    };
}

async function findBooking(id) {
    const booking = await Booking.findById(id).exec();
    if (!booking) {
        throw new NotFoundError('Booking not found', 'BOOKING_NOT_FOUND');
    }
    return booking;
}

exports.createBooking = async (req, res) => {
    if (req.userData.role !== 'Renter') {
        throw new AppError('Only Renters can request bookings', 403, 'RENTER_ONLY');
    }
    const product = await Product.findById(req.body.productId).exec();
    if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }
    const booking = new Booking({
        _id: new mongoose.Types.ObjectId(),
        renterId: req.userData.userId,
        holderId: product.ownerId,
        productId: product._id,
        booking_startdate: req.body.booking_startdate,
        booking_enddate: req.body.booking_enddate
    });
    const result = await booking.save();
    const doc = await result.populate(POPULATE);
    res.status(201).json({
        message: 'Booking requested!',
        ...bookingResponse(doc)
    });
};

exports.getBookings = async (req, res) => {
    const userId = req.userData.userId;
    const filter = req.userData.role === 'Holder' ? { holderId: userId } : { renterId: userId };
    const docs = await Booking.find(filter).populate(POPULATE).exec();
    res.status(200).json({
        count: docs.length,
        bookings: docs.map(bookingResponse)
    });
};

exports.updateBookingStatus = async (req, res) => {
    if (req.userData.role !== 'Holder') {
        throw new AppError('Only Holders can change booking status', 403, 'HOLDER_ONLY');
    }
    if (!req.body.booking_status) {
        throw new ValidationError({ booking_status: 'Booking status is required' });
    }
    const id = req.params.bookingId;
    const booking = await findBooking(id);
    if (String(booking.holderId) !== String(req.userData.userId)) {
        throw new AppError('Not your booking', 403, 'NOT_OWNER');
    }
    const doc = await Booking.findByIdAndUpdate(id, { $set: { booking_status: req.body.booking_status } }, { new: true, runValidators: true })
        .populate(POPULATE)
        .exec();
    res.status(200).json({
        message: 'Booking updated!',
        ...bookingResponse(doc)
    });
};

exports.deleteBooking = async (req, res) => {
    const id = req.params.bookingId;
    const booking = await findBooking(id);
    const userId = String(req.userData.userId);
    if (String(booking.renterId) !== userId && String(booking.holderId) !== userId) {
        throw new AppError('Not your booking', 403, 'NOT_OWNER');
    }
    const doc = await Booking.findByIdAndDelete(id).exec();
    res.status(200).json({
        message: 'Booking deleted!',
        booking_id: doc._id
    });
};
