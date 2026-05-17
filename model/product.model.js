const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    category: {
        type: String,
        enum: ['interior', 'exterior', 'waterproofing', 'primers'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number
    },
    image: {
        type: String,
        default: ''
    },
    colors: [{
        type: String
    }],
    finish: {
        type: String,
        enum: ['matte', 'satin', 'semi-gloss', 'gloss'],
        required: true
    },
    coverage: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: 0
    },
    reviews: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ''
    },
    features: [{
        type: String
    }],
    usage: {
        type: String,
        default: ''
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Number,
        default: 100
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
