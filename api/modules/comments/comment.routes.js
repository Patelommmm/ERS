const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/check-auth');
const validate = require('../../middleware/validate');
const { validateComment } = require('./comment.validation');
const CommentController = require('./comment.controller');

router.post('/', checkAuth, validate(validateComment), CommentController.createComment);

router.get('/:productId', checkAuth, CommentController.getProductComments);

module.exports = router;
