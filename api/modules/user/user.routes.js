const express = require('express');
const router = express.Router();
const validate = require('../../middleware/validate');
const { validateSignup, validateLogin } = require('./user.validation');
const UserController = require('./user.controller');

router.post('/signup', validate(validateSignup), UserController.signup);

router.post('/login', validate(validateLogin), UserController.login);

module.exports = router;
