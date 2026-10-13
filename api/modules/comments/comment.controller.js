const mongoose = require('mongoose');
const Comment = require('./comment.model');
const Product = require('../products/product.model');
const { AppError, NotFoundError } = require('../../errors');

const POPULATE = { path: 'renterId', select: '-password' };

function todayDate() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
}

function commentResponse(doc) {
    return {
        commentId: doc._id,
        renter: doc.renterId,
        productId: doc.productId,
        comment: doc.comment,
        commentDate: doc.commentDate
    };
}

function renterOnly(req) {
    if (req.userData.role !== 'Renter') {
        throw new AppError('Only Renters can use comments', 403, 'RENTER_ONLY');
    }
}

async function findProduct(id) {
    const product = await Product.findById(id).exec();
    if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }
    return product;
}

exports.createComment = async (req, res) => {
    renterOnly(req);
    const product = await findProduct(req.body.productId);
    const comment = new Comment({
        _id: new mongoose.Types.ObjectId(),
        renterId: req.userData.userId,
        productId: product._id,
        comment: req.body.comment,
        commentDate: todayDate()
    });
    const result = await comment.save();
    const doc = await result.populate(POPULATE);
    res.status(201).json({
        message: 'Comment added!',
        ...commentResponse(doc)
    });
};

exports.getProductComments = async (req, res) => {
    renterOnly(req);
    const product = await findProduct(req.params.productId);
    const docs = await Comment.find({ productId: product._id }).populate(POPULATE).exec();
    res.status(200).json({
        count: docs.length,
        comments: docs.map(commentResponse)
    });
};
