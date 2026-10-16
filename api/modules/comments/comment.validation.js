const Validator = require('../../validators/Validator');

exports.validateComment = body => {
    const v = new Validator(body);
    v.field('productId', 'Product id').string();
    v.field('comment', 'Comment').string().length(1, 500);
    v.validate();
};
