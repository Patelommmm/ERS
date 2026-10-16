const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    renterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true },
    commentDate: {
        type: String,
        required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
