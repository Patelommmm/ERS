const Validator = require('../../validators/Validator');

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function toDate(value) {
    const match = DATE_PATTERN.exec(value);
    if (!match) return null;
    const [, day, month, year] = match.map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 ? date : null;
}

exports.validateBooking = body => {
    const v = new Validator(body);
    v.field('productId', 'Product id').string();
    const start = v.field('booking_startdate', 'Start date').string();
    const end = v.field('booking_enddate', 'End date').string();
    [start, end].forEach(check => {
        if (!check.stopped() && !toDate(check.value)) check.fail(`${check.label} must be in dd/mm/yyyy format`);
    });
    if (!start.stopped() && !end.stopped() && toDate(end.value) < toDate(start.value)) {
        end.fail('End date cannot be before start date');
    }
    v.validate();
};

exports.validateBookingStatus = body => {
    const v = new Validator(body);
    v.field('booking_status', 'Booking status').oneOf(['Accepted', 'Declined']);
    v.validate();
};
