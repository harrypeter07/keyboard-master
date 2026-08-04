const mongoose = require('mongoose');

const PricingSchema = new mongoose.Schema({
    weeklyPriceUsd: {
        type: Number,
        default: 9.99,
    },
    monthlyPriceUsd: {
        type: Number,
        default: 29.99,
    },
    serverGeminiApiKey: {
        type: String,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('Pricing', PricingSchema);
