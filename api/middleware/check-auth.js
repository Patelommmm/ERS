const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../errors');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        throw new UnauthorizedError('No token provided, please log in', 'NO_TOKEN');
    }
    // expired or invalid tokens are handled in error-handler.js
    req.userData = jwt.verify(token, process.env.JWT_KEY);
    next();
};
