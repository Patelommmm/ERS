const mongoose = require('mongoose');
const {
    AppError,
    ValidationError,
    UnauthorizedError,
    NotFoundError,
    ConflictError,
    InternalServerError
} = require('../errors');

// Turns any error (ours, Mongoose, JWT, body parser) into an AppError
function toAppError(err) {
    if (err instanceof AppError) return err;

    if (err instanceof mongoose.Error.ValidationError) {
        const details = {};
        Object.values(err.errors).forEach(e => { details[e.path] = e.message; });
        return new ValidationError(details);
    }
    if (err instanceof mongoose.Error.CastError) {
        return new ValidationError({ [err.path]: `Invalid ${err.path}: ${err.value}` });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'Value';
        if (field === 'email') return new ConflictError('Email already exists, try with a new one', 'EMAIL_EXISTS');
        return new ConflictError(`${field} already exists, try a different one`, 'DUPLICATE_VALUE');
    }
    if (err.name === 'MongooseServerSelectionError' || /buffering timed out/i.test(err.message)) {
        return new AppError('Database not available, please try again later', 503, 'DATABASE_UNAVAILABLE');
    }
    if (err.name === 'TokenExpiredError') {
        return new UnauthorizedError('Session expired, please log in again', 'TOKEN_EXPIRED');
    }
    if (err.name === 'JsonWebTokenError') {
        return new UnauthorizedError('Invalid token, please log in again', 'INVALID_TOKEN');
    }
    if (err.type === 'entity.parse.failed') {
        return new AppError('Request body is not valid JSON', 400, 'INVALID_JSON');
    }
    return new InternalServerError();
}

// Unknown routes
function notFound(req, res, next) {
    next(new NotFoundError());
}

// Central error handler. Every error in the API ends up here
function errorHandler(err, req, res, next) {
    const error = toAppError(err);
    if (error.statusCode >= 500) console.error(err);
    res.status(error.statusCode).json(error.toJSON());
}

module.exports = { notFound, errorHandler };
