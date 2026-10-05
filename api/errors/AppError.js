// Base class for all API errors. Every error has a status code, a short code and a message
class AppError extends Error {
    constructor(message = 'Something went wrong', statusCode = 500, code = 'SERVER_ERROR', details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }

    // Same response shape for every error
    toJSON() {
        const error = { status: this.statusCode, code: this.code, message: this.message };
        if (this.details) error.details = this.details;
        return { message: this.message, error };
    }
}

module.exports = AppError;
