const Validator = require('../../validators/Validator');

exports.validateProduct = body => {
    const v = new Validator(body);
    v.field('name', 'Name').string().length(2, 100);
    v.field('price', 'Price').number({ min: 0 });
    v.field('description', 'Description').string().length(10, 200);
    v.field('category', 'Category').string();
    v.field('keyFeatures', 'Key features').string().length(0, 500);
    v.field('schedule', 'Schedule').oneOf(['Daily', 'Weekly', 'Monthly']);
    v.field('availability', 'Availability').boolean();
    v.validate();
};
