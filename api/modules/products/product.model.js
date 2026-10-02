const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
  
    name: { 
        type: String, 
        required: [true, 'Product name is required'],
        trim: true,                    
        minlength: [2, 'Name too short'],
        maxlength: [100, 'Name too long']
    },
    
    price: { 
        type: Number, 
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        get: v => Math.round(v * 100) / 100  
    },

    description: { 
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        minlength: [10, 'Description too short'],
        maxlength: [200, 'Description too long']
    },

    category: {
        type: String,
        required: [true, 'Category is required']
    },
  
    keyFeatures: {
        type: String,
        trim: true,
        maxlength: [500, 'Key features too long']
    },

    schedule: { 
        type: String, 
        enum: ['Daily', 'Weekly', 'Monthly'], 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    availability: { 
        type: Boolean, 
        required: true,
        default: true },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);