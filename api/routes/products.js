const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
//importing json models from models folder
const Product = require('../models/product');

router.get('/', (req, res, next) => {
    Product.find()
        .select("name price _id")
        .exec()
        .then(docs => {
            const response = {
                count: docs.length,
                products: docs.map(doc => {
                    return {
                        name: doc.name,
                        price: doc.price,
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

router.post('/', (req, res, next) => {
    /*const product = {
        name: req.body.name,
        price: req.body.price
    };*/
    //creating new model using constructer
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price
        
    });
    product.save().then(
        result => {
            console.log(result);
        }
    ).catch(err => console.log(err));
    res.status(200).json({
        message: 'Handling POST',
        createdProduct: {
            name: product.name,
            price: product.price,
            _id: product._id,
            request: {
                type: 'GET',
                url: "http://localhost:3000/products/" + product._id
            }
        }
    });
});

router.get('/:productId', (req, res, next) => {
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

router.patch('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.findByIdAndUpdate(id, { $set: req.body }, { new: true }).exec().then(doc => {
        console.log("From database", doc);
        res.status(200).json({
            message: 'Product updated!',
            product: doc
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
});

router.delete('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.findByIdAndRemove(id).exec().then(doc => {
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
});

module.exports = router;