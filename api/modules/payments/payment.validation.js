const Validator = require('../../validators/Validator');

const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

exports.validatePayment = body => {
    const v = new Validator(body);
    v.field('bookingId', 'Booking id').string();
    [
        v.field('booking_startdate', 'Start date').string(),
        v.field('booking_enddate', 'End date').string()
    ].forEach(check => {
        if (!check.stopped() && !DATE_PATTERN.test(check.value)) check.fail(`${check.label} must be in dd/mm/yyyy format`);
    });
    v.field('amount', 'Amount').number({ min: 0 });
    v.field('paymentMode', 'Payment mode').oneOf(['Card', 'Bank Transfer', 'PayPal']);
    v.validate();
};
