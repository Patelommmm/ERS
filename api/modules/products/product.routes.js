const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/check-auth');
const ProductController = require('./product.controller');

router.get('/', checkAuth, ProductController.getAllProducts);

router.post('/', checkAuth, ProductController.createProduct);

router.get('/:productId', checkAuth, ProductController.getProduct);

router.patch('/:productId', checkAuth, ProductController.updateProduct);

router.delete('/:productId', checkAuth, ProductController.deleteProduct);

module.exports = router;
