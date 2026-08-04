const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    banReason: {
        type: String,
        default: '',
    },
    plan: {
        type: String,
        enum: ['free', 'weekly', 'monthly'],
        default: 'free',
    },
    planExpiresAt: {
        type: Date,
        default: null,
    },
    cloudApiAccess: {
        type: Boolean,
        default: false,
    },
    acceptedTermsAt: {
        type: Date,
        default: Date.now,
    },
    createdIp: {
        type: String,
        default: '',
    },
    lastIp: {
        type: String,
        default: '',
    },
    requestCount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
