const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./user.model');
const { ValidationError, UnauthorizedError, ConflictError } = require('../../errors');

exports.signup = async (req, res) => {
    const existing = await User.findOne({ email: req.body.email }).exec();
    if (existing) {
        throw new ConflictError('Email already exists, try with a new one', 'EMAIL_EXISTS');
    }
    if (!req.body.password) {
        throw new ValidationError({ password: 'Password is required' });
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        password: hash,
        role: req.body.role
    });
    // missing fields and duplicate email are handled in error-handler.js
    const result = await user.save();
    console.log(result);
    res.status(201).json({
        message: 'User created!',
        user: result
    });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        const details = {};
        if (!email) details.email = 'Email is required';
        if (!password) details.password = 'Password is required';
        throw new ValidationError(details);
    }
    const user = await User.findOne({ email }).exec();
    if (!user) {
        throw new UnauthorizedError('No account found with this email', 'EMAIL_NOT_FOUND');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new UnauthorizedError('Incorrect password, please try again', 'WRONG_PASSWORD');
    }
    const token = jwt.sign(
        {
            name: user.name,
            email: user.email,
            userId: user._id,
            role: user.role
        },
        process.env.JWT_KEY,
        {
            expiresIn: "8760h"
        }
    );
    res.status(200).json({
        message: 'Auth successful',
        token: token
    });
};
