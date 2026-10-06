require('dotenv').config();

const express = require('express');
const app = express();

const morgan = require('morgan');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const path = require('path');
const os = require('os');

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

const productRoutes = require('./api/modules/products/product.routes');
const userRoutes = require('./api/modules/user/user.routes');
const bookingRoutes = require('./api/modules/bookings/booking.routes');
const { notFound, errorHandler } = require('./api/middleware/error-handler');

mongoose.connect('mongodb+srv://admin:'+ 
    process.env.MONGO_ATLAS_PW +
    '@omclusterforlearning.du4qd.mongodb.net/')
    .then(() => {
        console.log('Connected to MongoDB ');
    })
    .catch(err => {
        console.error('Connection failed:', err);
    });

//routes   
// frontend (only the frontend folder is public, so .env and app.js stay hidden)
app.use(express.static(path.join(__dirname, 'frontend')));

// health check (used later by the load balancer)
app.get('/health', (req, res) => res.json({ status: 'ok', host: os.hostname() }));
app.use('/products', productRoutes);
app.use('/user', userRoutes);
app.use('/bookings', bookingRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;