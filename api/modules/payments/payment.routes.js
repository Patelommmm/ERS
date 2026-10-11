const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/check-auth');
const validate = require('../../middleware/validate');
const { validatePayment } = require('./payment.validation');
const PaymentController = require('./payment.controller');

router.post('/', checkAuth, validate(validatePayment), PaymentController.createPayment);

router.get('/:productId', checkAuth, PaymentController.getProductPayments);

module.exports = router;
