const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GeminiKey = require('../models/GeminiKey');

const JWT_SECRET = process.env.JWT_SECRET || 'keyboard_master_secret_key_2026';
const AUTO_COOLDOWN_HOURS = 1; // Auto-reset key quota status after 1 hour

// Middleware to verify active Paid Member or Admin JWT
async function memberAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authentication token required.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User account not found.' });
        }

        if (user.isBanned) {
            return res.status(403).json({ success: false, error: 'Account banned.' });
        }

        const isPaidOrAdmin = user.role === 'admin' || (user.plan !== 'free' && user.cloudApiAccess);
        if (!isPaidOrAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Server Cloud API keys are reserved for active Paid Members and Admins. Please upgrade your subscription.'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
    }
}

// Auto-cooldown helper: Reset keys whose exhaustedAt is older than AUTO_COOLDOWN_HOURS
async function autoResetCooldownKeys() {
    try {
        const cutoff = new Date(Date.now() - AUTO_COOLDOWN_HOURS * 60 * 60 * 1000);
        await GeminiKey.updateMany(
            { quotaExhausted: true, exhaustedAt: { $lt: cutoff } },
            { $set: { quotaExhausted: false, exhaustedAt: null, exhaustedModels: [] } }
        );
    } catch (e) {
        console.error('Auto reset keys error:', e.message);
    }
}

// Acquire an active Gemini API key for local client execution
router.post('/acquire', memberAuth, async (req, res) => {
    try {
        await autoResetCooldownKeys();

        // Get all active non-exhausted keys
        let availableKeys = await GeminiKey.find({ isActive: true, quotaExhausted: false }).sort({ usageCount: 1, lastUsedAt: 1 });

        // If none found, attempt forced cooldown check on any exhausted keys
        if (availableKeys.length === 0) {
            const exhaustedKeys = await GeminiKey.find({ isActive: true, quotaExhausted: true }).sort({ exhaustedAt: 1 });
            if (exhaustedKeys.length > 0) {
                // Reset the oldest exhausted key to give emergency availability
                const oldest = exhaustedKeys[0];
                oldest.quotaExhausted = false;
                oldest.exhaustedAt = null;
                await oldest.save();
                availableKeys = [oldest];
            }
        }

        if (availableKeys.length === 0) {
            return res.status(429).json({
                success: false,
                error: 'All server Gemini API keys in pool have reached daily quota limits. Please try again later or add your personal key in Settings.'
            });
        }

        // Pick the least-used key
        const selectedKey = availableKeys[0];
        selectedKey.usageCount = (selectedKey.usageCount || 0) + 1;
        selectedKey.lastUsedAt = new Date();
        await selectedKey.save();

        return res.json({
            success: true,
            keyId: selectedKey._id,
            apiKey: selectedKey.key,
            totalAvailableKeys: availableKeys.length,
        });
    } catch (err) {
        console.error('Key acquire error:', err);
        return res.status(500).json({ success: false, error: 'Server error acquiring Gemini key.' });
    }
});

// Report 429 Quota Exceeded and immediately obtain a replacement key
router.post('/report-quota-exceeded', memberAuth, async (req, res) => {
    try {
        const { keyId, model } = req.body;

        if (keyId) {
            const keyToMark = await GeminiKey.findById(keyId);
            if (keyToMark) {
                keyToMark.quotaExhausted = true;
                keyToMark.exhaustedAt = new Date();
                if (model && !keyToMark.exhaustedModels.includes(model)) {
                    keyToMark.exhaustedModels.push(model);
                }
                await keyToMark.save();
                console.log(`[Key Pool] Marked key ${keyToMark._id} (${keyToMark.label}) as QUOTA EXHAUSTED for model: ${model || 'all'}`);
            }
        }

        await autoResetCooldownKeys();

        // Get next available active key excluding the exhausted one
        const availableKeys = await GeminiKey.find({
            isActive: true,
            quotaExhausted: false,
            _id: { $ne: keyId }
        }).sort({ usageCount: 1, lastUsedAt: 1 });

        if (availableKeys.length === 0) {
            return res.status(429).json({
                success: false,
                error: 'All server Gemini API keys have exhausted their quotas. Please add fresh keys in Admin Panel or enter your personal BYOK key.'
            });
        }

        const newKey = availableKeys[0];
        newKey.usageCount = (newKey.usageCount || 0) + 1;
        newKey.lastUsedAt = new Date();
        await newKey.save();

        return res.json({
            success: true,
            message: 'Key rotated successfully after quota error',
            newKeyId: newKey._id,
            newApiKey: newKey.key,
            totalAvailableKeys: availableKeys.length,
        });
    } catch (err) {
        console.error('Report quota error:', err);
        return res.status(500).json({ success: false, error: 'Server error rotating Gemini key.' });
    }
});

module.exports = router;
