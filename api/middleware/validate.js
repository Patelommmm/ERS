// Runs a validation function on the request body before the controller
module.exports = check => (req, res, next) => {
    check(req.body || {});
    next();
};
