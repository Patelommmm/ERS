const Validator = require('../../validators/Validator');

exports.validateSignup = body => {
    const v = new Validator(body);
    v.field('name', 'Name').string().length(2, 50);
    v.field('email', 'Email').email();
    v.field('password', 'Password').string().length(6, 100);
    v.field('role', 'Role').oneOf(['Holder', 'Renter']);
    v.validate();
};

exports.validateLogin = body => {
    const v = new Validator(body);
    v.field('email', 'Email').email();
    v.field('password', 'Password').string();
    v.validate();
};
