const { ValidationError } = require('../errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class FieldCheck {
    constructor(validator, name, label) {
        this.validator = validator;
        this.name = name;
        this.label = label;
        this.skip = false;
    }

    get value() {
        return this.validator.data[this.name];
    }

    isEmpty() {
        const v = this.value;
        return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    }

    //skip optional fields that are empty
    stopped() {
        return this.skip || this.isEmpty();
    }

    fail(message) {
        this.validator.errors[this.name] = message;
        this.skip = true;
        return this;
    }



    string() {
        if (!this.stopped() && typeof this.value !== 'string') this.fail(`${this.label} must be text`);
        return this;
    }

    email() {
        this.string();
        if (!this.stopped() && !EMAIL_PATTERN.test(this.value.trim())) {
            this.fail(`${this.label} is not a valid email address`);
        }
        return this;
    }

    length(min, max) {
        if (this.stopped()) return this;
        const len = String(this.value).trim().length;
        if (min !== undefined && len < min) return this.fail(`${this.label} must be at least ${min} characters`);
        if (max !== undefined && len > max) return this.fail(`${this.label} must be at most ${max} characters`);
        return this;
    }

    number({ min, max } = {}) {
        if (this.stopped()) return this;
        const n = typeof this.value === 'number' || typeof this.value === 'string' ? Number(this.value) : NaN;
        if (!Number.isFinite(n)) return this.fail(`${this.label} must be a number`);
        if (min !== undefined && n < min) return this.fail(`${this.label} cannot be less than ${min}`);
        if (max !== undefined && n > max) return this.fail(`${this.label} cannot be more than ${max}`);
        return this;
    }

    boolean() {
        if (!this.stopped() && typeof this.value !== 'boolean') this.fail(`${this.label} must be true or false`);
        return this;
    }

    oneOf(list) {
        if (!this.stopped() && !list.includes(this.value)) {
            this.fail(`${this.label} must be one of: ${list.join(', ')}`);
        }
        return this;
    }
}

// Collects errors for all fields, then throws one ValidationError with all of them
class Validator {
    constructor(data, { partial = false } = {}) {
        this.data = data || {};
        this.partial = partial;
        this.errors = {};
    }

    field(name, label = name) {
        return new FieldCheck(this, name, label);
    }

    validate() {
        if (Object.keys(this.errors).length) throw new ValidationError(this.errors);
    }
}

module.exports = Validator;
