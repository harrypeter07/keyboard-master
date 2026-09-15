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

// Auto-cooldown and window reset helper
async function autoResetCooldownKeys() {
    try {
        const now = new Date();
        const cutoff = new Date(now.getTime() - AUTO_COOLDOWN_HOURS * 60 * 60 * 1000);
        const minuteCutoff = new Date(now.getTime() - 60 * 1000);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 1. Reset 1-hour exhausted cooldown keys
        await GeminiKey.updateMany(
            { quotaExhausted: true, exhaustedAt: { $lt: cutoff } },
            { $set: { quotaExhausted: false, exhaustedAt: null, exhaustedModels: [], healthStatus: 'UNTESTED' } }
        );

        // 2. Reset minute counters (> 60s old)
        await GeminiKey.updateMany(
            { lastMinuteReset: { $lt: minuteCutoff } },
            { $set: { queriesThisMinute: 0, lastMinuteReset: now } }
        );

        // 3. Reset daily counters (before today 00:00 UTC)
        await GeminiKey.updateMany(
            { lastDailyReset: { $lt: startOfToday } },
            { $set: { queriesToday: 0, lastDailyReset: now, quotaExhausted: false, exhaustedAt: null } }
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
        let availableKeys = await GeminiKey.find({ isActive: true, quotaExhausted: false });

        // Filter out keys that have reached per-minute rate limits (>= 15 RPM)
        let eligibleKeys = availableKeys.filter(k => (k.queriesThisMinute || 0) < 15);

        if (eligibleKeys.length === 0 && availableKeys.length > 0) {
            // Fallback to any active key if all are temporarily rate limited in the current minute
            eligibleKeys = availableKeys;
        }

        // If none found, attempt forced cooldown check on any exhausted keys
        if (eligibleKeys.length === 0) {
            const exhaustedKeys = await GeminiKey.find({ isActive: true, quotaExhausted: true }).sort({ exhaustedAt: 1 });
            if (exhaustedKeys.length > 0) {
                const oldest = exhaustedKeys[0];
                oldest.quotaExhausted = false;
                oldest.exhaustedAt = null;
                oldest.healthStatus = 'UNTESTED';
                await oldest.save();
                eligibleKeys = [oldest];
            }
        }

        if (eligibleKeys.length === 0) {
            return res.status(429).json({
                success: false,
                error: 'All server Gemini API keys in pool have reached daily quota limits. Please try again later or add your personal key in Settings.'
            });
        }

        // Sort by Highest Remaining Capacity (dailyQuotaLimit - queriesToday) descending, tie-break by least recently used
        eligibleKeys.sort((a, b) => {
            const remA = Math.max(0, (a.dailyQuotaLimit || 1500) - (a.queriesToday || 0));
            const remB = Math.max(0, (b.dailyQuotaLimit || 1500) - (b.queriesToday || 0));
            if (remB !== remA) {
                return remB - remA; // Highest capacity first
            }
            const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
            const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
            return timeA - timeB; // Least recently used first
        });

        // Pick the most efficient key with the highest remaining queries
        const selectedKey = eligibleKeys[0];
        selectedKey.usageCount = (selectedKey.usageCount || 0) + 1;
        selectedKey.queriesToday = (selectedKey.queriesToday || 0) + 1;
        selectedKey.queriesThisMinute = (selectedKey.queriesThisMinute || 0) + 1;
        selectedKey.lastUsedAt = new Date();
        await selectedKey.save();

        const queriesRemaining = Math.max(0, (selectedKey.dailyQuotaLimit || 1500) - selectedKey.queriesToday);
        const capacityPercent = Math.round((queriesRemaining / (selectedKey.dailyQuotaLimit || 1500)) * 100);

        return res.json({
            success: true,
            keyId: selectedKey._id,
            apiKey: selectedKey.key,
            queriesRemaining,
            dailyQuotaLimit: selectedKey.dailyQuotaLimit || 1500,
            capacityPercent,
            healthStatus: selectedKey.healthStatus || 'HEALTHY',
            totalAvailableKeys: eligibleKeys.length,
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
                keyToMark.healthStatus = 'EXHAUSTED';
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
        });

        if (availableKeys.length === 0) {
            return res.status(429).json({
                success: false,
                error: 'All server Gemini API keys have exhausted their quotas. Please add fresh keys in Admin Panel or enter your personal BYOK key.'
            });
        }

        // Sort by highest remaining queries
        availableKeys.sort((a, b) => {
            const remA = Math.max(0, (a.dailyQuotaLimit || 1500) - (a.queriesToday || 0));
            const remB = Math.max(0, (b.dailyQuotaLimit || 1500) - (b.queriesToday || 0));
            if (remB !== remA) return remB - remA;
            const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
            const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
            return timeA - timeB;
        });

        const newKey = availableKeys[0];
        newKey.usageCount = (newKey.usageCount || 0) + 1;
        newKey.queriesToday = (newKey.queriesToday || 0) + 1;
        newKey.queriesThisMinute = (newKey.queriesThisMinute || 0) + 1;
        newKey.lastUsedAt = new Date();
        await newKey.save();

        const queriesRemaining = Math.max(0, (newKey.dailyQuotaLimit || 1500) - newKey.queriesToday);

        return res.json({
            success: true,
            message: 'Key rotated successfully after quota error',
            newKeyId: newKey._id,
            newApiKey: newKey.key,
            queriesRemaining,
            dailyQuotaLimit: newKey.dailyQuotaLimit || 1500,
            totalAvailableKeys: availableKeys.length,
        });
    } catch (err) {
        console.error('Report quota error:', err);
        return res.status(500).json({ success: false, error: 'Server error rotating Gemini key.' });
    }
});

module.exports = router;
