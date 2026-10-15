const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    renterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true },
    holderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true },
    booking_startdate: {
        type: String,
        required: [true, 'Start date is required'] },
    booking_enddate: {
        type: String,
        required: [true, 'End date is required'] },
    booking_status: {
        type: String,
        required: true,
        default: 'Requested' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
