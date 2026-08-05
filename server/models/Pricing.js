const mongoose = require('mongoose');

const PricingSchema = new mongoose.Schema({
    weeklyPriceUsd: {
        type: Number,
        default: 499,
    },
    monthlyPriceUsd: {
        type: Number,
        default: 1499,
    },
    serverGeminiApiKey: {
        type: String,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('Pricing', PricingSchema);
