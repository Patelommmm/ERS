const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    // Product name
    name: { 
        type: String, 
        required: [true, 'Product name is required'],
        trim: true,                    // Remove whitespace
        minlength: [2, 'Name too short'],
        maxlength: [100, 'Name too long']
    },
    
    // Product price
    price: { 
        type: Number, 
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        get: v => Math.round(v * 100) / 100  // Round to 2 decimal places
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);