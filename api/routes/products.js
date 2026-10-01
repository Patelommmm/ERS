const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');
const checkAuth = require('../middleware/check-auth');

router.get('/', checkAuth, (req, res, next) => {
    Product.find()
        .select("name price category availability schedule description keyFeatures ownerId _id")
        .exec()
        .then(docs => {
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
                            url: "http://localhost:3000/products/" + doc._id
                        }
                    };
                })
            };
            res.status(200).json(response);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.post('/', checkAuth, (req, res, next) => {
    if (req.userData.role !== 'Holder') {
        return res.status(403).json({
            message: 'Only Holders can list equipment'
        });
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
    product.save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                message: 'Handling POST',
                createdProduct: {
                    name: result.name,
                    price: result.price,
                    _id: result._id,
                    request: {
                        type: 'GET',
                        url: "http://localhost:3000/products/" + result._id
                    }
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.get('/:productId', checkAuth, (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id).exec().then(doc => {
        console.log("From database", doc);
        res.status(200).json({
            product: doc
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.patch('/:productId', checkAuth, (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id).exec().then(product => {
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (String(product.ownerId) !== String(req.userData.userId)) {
            return res.status(403).json({ message: 'Not your listing' });
        }
        const updates = { ...req.body };
        delete updates.ownerId; 

        Product.findByIdAndUpdate(id, { $set: updates }, { new: true }).exec().then(doc => {
            console.log("From database", doc);
            res.status(200).json({
                message: 'Product updated!',
                product: doc,
                request: {
                    type: 'GET',
                    url: "http://localhost:3000/products/" + doc._id
                }
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.delete('/:productId', checkAuth, (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id).exec().then(product => {
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (String(product.ownerId) !== String(req.userData.userId)) {
            return res.status(403).json({ message: 'Not your listing' });
        }
        Product.findByIdAndDelete(id).exec().then(doc => {
            console.log("From database", doc);
            res.status(200).json({
                message: 'Product deleted!',
                product: doc
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

module.exports = router;
