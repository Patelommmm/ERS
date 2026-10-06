const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/check-auth');
const validate = require('../../middleware/validate');
const { validateBooking, validateBookingStatus } = require('./booking.validation');
const BookingController = require('./booking.controller');

router.post('/', checkAuth, validate(validateBooking), BookingController.createBooking);

router.get('/', checkAuth, BookingController.getBookings);

router.patch('/:bookingId', checkAuth, validate(validateBookingStatus), BookingController.updateBookingStatus);

router.delete('/:bookingId', checkAuth, BookingController.deleteBooking);

module.exports = router;
