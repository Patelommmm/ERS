const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/check-auth');
const validate = require('../../middleware/validate');
const { validateProduct } = require('./product.validation');
const ProductController = require('./product.controller');

router.get('/', checkAuth, ProductController.getAllProducts);

router.post('/', checkAuth, validate(validateProduct), ProductController.createProduct);

router.get('/:productId', checkAuth, ProductController.getProduct);

router.patch('/:productId', checkAuth, validate(validateProduct), ProductController.updateProduct);

router.delete('/:productId', checkAuth, ProductController.deleteProduct);

module.exports = router;
