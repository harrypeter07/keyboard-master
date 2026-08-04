const mongoose = require('mongoose');

const InstanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        default: '',
    },
    platform: {
        type: String,
        default: 'win32',
    },
    status: {
        type: String,
        enum: ['active', 'killed', 'banned'],
        default: 'active',
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Instance', InstanceSchema);
