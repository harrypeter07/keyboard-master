const mongoose = require('mongoose');

const GeminiKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    label: {
        type: String,
        default: 'Gemini Key',
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    quotaExhausted: {
        type: Boolean,
        default: false,
    },
    exhaustedAt: {
        type: Date,
        default: null,
    },
    exhaustedModels: [{
        type: String,
        trim: true,
    }],
    usageCount: {
        type: Number,
        default: 0,
    },
    lastUsedAt: {
        type: Date,
        default: null,
    },
    addedBy: {
        type: String,
        default: 'admin',
    },
}, { timestamps: true });

module.exports = mongoose.model('GeminiKey', GeminiKeySchema);
