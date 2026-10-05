const AppError = require('./AppError');

// one or more fields failed validation
class ValidationError extends AppError {
    constructor(details = {}) {
        super(Object.values(details).join('. ') || 'Validation failed', 400, 'VALIDATION_FAILED', details);
    }
}

// not logged in
class UnauthorizedError extends AppError {
    constructor(message = 'Auth failed', code = 'AUTH_FAILED') {
        super(message, 401, code);
    }
}

// record not found
class NotFoundError extends AppError {
    constructor(message = 'Not Found', code = 'NOT_FOUND') {
        super(message, 404, code);
    }
}

// record already exists
class ConflictError extends AppError {
    constructor(message = 'Already exists', code = 'CONFLICT') {
        super(message, 409, code);
    }
}

// server error
class InternalServerError extends AppError {
    constructor(message = 'Something went wrong on the server, please try again later', code = 'SERVER_ERROR') {
        super(message, 500, code);
    }
}

module.exports = {
    ValidationError,
    UnauthorizedError,
    NotFoundError,
    ConflictError,
    InternalServerError
};
