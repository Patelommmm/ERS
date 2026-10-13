const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true },
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
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'] },
    paymentMode: {
        type: String,
        enum: ['Card', 'Bank Transfer', 'PayPal'],
        required: [true, 'Payment mode is required'] },
    paymentStatus: {
        type: String,
        required: true,
        default: 'Success' },
    paymentDate: {
        type: String,
        required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
