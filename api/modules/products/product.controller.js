const mongoose = require('mongoose');
const Product = require('./product.model');
const { AppError, NotFoundError } = require('../../errors');

// Finds a product and checks the logged in user owns it
async function findOwnedProduct(id, userId) {
    const product = await Product.findById(id).exec();
    if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }
    if (String(product.ownerId) !== String(userId)) {
        throw new AppError('Not your listing', 403, 'NOT_OWNER');
    }
    return product;
}

exports.getAllProducts = async (req, res) => {
    const docs = await Product.find()
        .select("name price category availability schedule description keyFeatures ownerId _id")
        .exec();
    const response = {
        count: docs.length,
        products: docs.map(doc => {
            return {
                name: doc.name,
                price: doc.price,
                category: doc.category,
                availability: doc.availability,
                schedule: doc.schedule,
                description: doc.description,
                keyFeatures: doc.keyFeatures,
                ownerId: doc.ownerId,
                _id: doc._id,
                request: {
                    type: "GET",
                    url: req.protocol + "://" + req.get("host") + "/products/" + doc._id
                }
            };
        })
    };
    res.status(200).json(response);
};

exports.createProduct = async (req, res) => {
    if (req.userData.role !== 'Holder') {
        throw new AppError('Only Holders can list equipment', 403, 'HOLDER_ONLY');
    }
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        category: req.body.category,
        keyFeatures: req.body.keyFeatures,
        schedule: req.body.schedule,
        availability: req.body.availability,
        ownerId: req.userData.userId
    });
    const result = await product.save();
    console.log(result);
    res.status(201).json({
        message: 'Handling POST',
        createdProduct: {
            name: result.name,
            price: result.price,
            _id: result._id,
            request: {
                type: 'GET',
                url: req.protocol + "://" + req.get("host") + "/products/" + result._id
            }
        }
    });
};

exports.getProduct = async (req, res) => {
    const doc = await Product.findById(req.params.productId).exec();
    if (!doc) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }
    res.status(200).json({
        product: doc
    });
};

exports.updateProduct = async (req, res) => {
    const id = req.params.productId;
    await findOwnedProduct(id, req.userData.userId);
    const updates = { ...req.body };
    delete updates.ownerId;

    const doc = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).exec();
    res.status(200).json({
        message: 'Product updated!',
        product: doc,
        request: {
            type: 'GET',
            url: req.protocol + "://" + req.get("host") + "/products/" + doc._id
        }
    });
};

exports.deleteProduct = async (req, res) => {
    const id = req.params.productId;
    await findOwnedProduct(id, req.userData.userId);
    const doc = await Product.findByIdAndDelete(id).exec();
    res.status(200).json({
        message: 'Product deleted!',
        product: doc
    });
};
