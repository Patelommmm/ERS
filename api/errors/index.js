const AppError = require('./AppError');
const httpErrors = require('./http-errors');

module.exports = { AppError, ...httpErrors };
