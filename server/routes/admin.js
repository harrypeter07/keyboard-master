const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Instance = require('../models/Instance');
const Pricing = require('../models/Pricing');
const GeminiKey = require('../models/GeminiKey');

const JWT_SECRET = process.env.JWT_SECRET || 'keyboard_master_secret_key_2026';

// Middleware to verify Admin JWT
function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Admin authentication required.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied: Admin privileges required.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid admin token.' });
    }
}

// Get Admin Stats & Users List
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
        const instances = await Instance.find().populate('userId', 'email').sort({ lastHeartbeat: -1 });
        const pricing = await Pricing.findOne() || await Pricing.create({});

        return res.json({
            success: true,
            users,
            instances,
            pricing,
        });
    } catch (err) {
        console.error('Error fetching admin users:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch admin users.' });
    }
});

// Ban / Unban User Account
router.post('/ban', adminAuth, async (req, res) => {
    try {
        const { userId, isBanned, banReason } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        user.isBanned = !!isBanned;
        user.banReason = banReason || (isBanned ? 'Banned by Administrator.' : '');
        await user.save();

        if (isBanned) {
            await Instance.updateMany({ userId: user._id }, { status: 'banned' });
        }

        return res.json({ success: true, message: `User ${user.email} ${isBanned ? 'banned' : 'unbanned'} successfully.` });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update ban status.' });
    }
});

// Upgrade / Change User Plan
router.post('/update-plan', adminAuth, async (req, res) => {
    try {
        const { userId, plan, durationDays, cloudApiAccess } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        user.plan = plan;
        if (typeof cloudApiAccess === 'boolean') {
            user.cloudApiAccess = cloudApiAccess;
        }

        if (plan === 'weekly') {
            const exp = new Date();
            exp.setDate(exp.getDate() + (durationDays || 7));
            user.planExpiresAt = exp;
        } else if (plan === 'monthly') {
            const exp = new Date();
            exp.setDate(exp.getDate() + (durationDays || 30));
            user.planExpiresAt = exp;
        } else {
            user.planExpiresAt = null;
        }

        await user.save();
        return res.json({ success: true, message: `Updated plan for ${user.email} to ${plan}.` });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update user plan.' });
    }
});

// Kill Specific Device Instance Remotely
router.post('/kill-instance', adminAuth, async (req, res) => {
    try {
        const { instanceId } = req.body;
        const instance = await Instance.findById(instanceId);
        if (!instance) {
            return res.status(404).json({ success: false, error: 'Instance not found.' });
        }

        instance.status = 'killed';
        await instance.save();
        return res.json({ success: true, message: 'Instance killed remotely.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to kill instance.' });
    }
});

// Update Plan Pricing, Server Gemini API Key, Installer URL & Version
router.post('/pricing', adminAuth, async (req, res) => {
    try {
        const { weeklyPriceUsd, monthlyPriceUsd, serverGeminiApiKey, downloadUrl, latestVersion } = req.body;
        let pricing = await Pricing.findOne();
        if (!pricing) {
            pricing = new Pricing();
        }

        if (typeof weeklyPriceUsd === 'number') pricing.weeklyPriceUsd = weeklyPriceUsd;
        if (typeof monthlyPriceUsd === 'number') pricing.monthlyPriceUsd = monthlyPriceUsd;
        if (typeof serverGeminiApiKey === 'string') pricing.serverGeminiApiKey = serverGeminiApiKey;
        if (typeof downloadUrl === 'string') pricing.downloadUrl = downloadUrl.trim();
        if (typeof latestVersion === 'string' && latestVersion.trim()) pricing.latestVersion = latestVersion.trim();

        await pricing.save();
        return res.json({ success: true, message: 'Pricing and server settings updated successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update pricing.' });
    }
});

// ==========================================
// GEMINI API KEY POOL MANAGEMENT ROUTES
// ==========================================

// Get All Gemini API Keys in Pool
router.get('/keys', adminAuth, async (req, res) => {
    try {
        const keys = await GeminiKey.find().sort({ createdAt: -1 });
        const total = keys.length;
        const active = keys.filter(k => k.isActive && !k.quotaExhausted).length;
        const exhausted = keys.filter(k => k.quotaExhausted).length;
        const disabled = keys.filter(k => !k.isActive).length;

        return res.json({
            success: true,
            keys,
            stats: { total, active, exhausted, disabled }
        });
    } catch (err) {
        console.error('Error fetching key pool:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch Gemini key pool.' });
    }
});

// Add Single or Bulk Gemini API Keys
router.post('/keys', adminAuth, async (req, res) => {
    try {
        const { rawKeys, label } = req.body;
        if (!rawKeys || typeof rawKeys !== 'string') {
            return res.status(400).json({ success: false, error: 'No keys provided.' });
        }

        // Parse keys line-by-line or by comma/whitespace
        const candidateKeys = rawKeys.split(/[\n,;\s]+/).map(k => k.trim()).filter(Boolean);
        if (candidateKeys.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid key strings found.' });
        }

        let addedCount = 0;
        let duplicateCount = 0;

        for (let i = 0; i < candidateKeys.length; i++) {
            const keyStr = candidateKeys[i];
            const exists = await GeminiKey.findOne({ key: keyStr });
            if (exists) {
                duplicateCount++;
            } else {
                const keyLabel = candidateKeys.length > 1 ? `${label || 'Gemini Key'} #${i + 1}` : (label || 'Gemini Key');
                await GeminiKey.create({
                    key: keyStr,
                    label: keyLabel,
                    addedBy: req.user.email || 'admin'
                });
                addedCount++;
            }
        }

        return res.json({
            success: true,
            message: `Successfully processed ${candidateKeys.length} keys: ${addedCount} added, ${duplicateCount} duplicates ignored.`,
            addedCount,
            duplicateCount
        });
    } catch (err) {
        console.error('Error adding keys:', err);
        return res.status(500).json({ success: false, error: 'Failed to add Gemini keys.' });
    }
});

// Toggle Active / Disabled Status of Key
router.post('/keys/toggle-status', adminAuth, async (req, res) => {
    try {
        const { keyId, isActive } = req.body;
        const keyItem = await GeminiKey.findById(keyId);
        if (!keyItem) {
            return res.status(404).json({ success: false, error: 'Key not found.' });
        }

        keyItem.isActive = !!isActive;
        await keyItem.save();

        return res.json({
            success: true,
            message: `Key "${keyItem.label}" is now ${keyItem.isActive ? 'Active' : 'Disabled'}.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to toggle key status.' });
    }
});

// Delete Key from Pool
router.delete('/keys/:id', adminAuth, async (req, res) => {
    try {
        const keyId = req.params.id;
        const deleted = await GeminiKey.findByIdAndDelete(keyId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Key not found.' });
        }

        return res.json({ success: true, message: `Key "${deleted.label}" removed from pool.` });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to delete key.' });
    }
});

// Helper function to probe a single Gemini Key health and latency
const https = require('https');

async function probeKey(keyItem) {
    const startTime = Date.now();
    return new Promise((resolve) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${keyItem.key}`;
        const postData = JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] });

        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, async (res) => {
            const latencyMs = Date.now() - startTime;
            keyItem.latencyMs = latencyMs;
            keyItem.lastTestedAt = new Date();

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                if (res.statusCode === 200) {
                    keyItem.healthStatus = 'HEALTHY';
                    keyItem.quotaExhausted = false;
                    keyItem.exhaustedAt = null;
                } else if (res.statusCode === 429) {
                    keyItem.healthStatus = 'EXHAUSTED';
                    keyItem.quotaExhausted = true;
                    keyItem.exhaustedAt = new Date();
                } else if (res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 403) {
                    keyItem.healthStatus = 'INVALID';
                    keyItem.isActive = false; // Disable dead keys
                }
                await keyItem.save();
                resolve(keyItem);
            });
        });

        req.on('error', async (err) => {
            keyItem.healthStatus = 'INVALID';
            keyItem.lastTestedAt = new Date();
            await keyItem.save();
            resolve(keyItem);
        });

        req.write(postData);
        req.end();
    });
}

// Reset Quota Limits for All Keys in Pool
router.post('/keys/reset-quotas', adminAuth, async (req, res) => {
    try {
        const result = await GeminiKey.updateMany(
            { quotaExhausted: true },
            { $set: { quotaExhausted: false, exhaustedAt: null, exhaustedModels: [], healthStatus: 'UNTESTED' } }
        );

        return res.json({
            success: true,
            message: `Quota limits reset for ${result.modifiedCount} keys in pool.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to reset key quotas.' });
    }
});

// Live Health Probe Single Key
router.post('/keys/probe', adminAuth, async (req, res) => {
    try {
        const { keyId } = req.body;
        const keyItem = await GeminiKey.findById(keyId);
        if (!keyItem) {
            return res.status(404).json({ success: false, error: 'Key not found.' });
        }

        const updated = await probeKey(keyItem);
        return res.json({
            success: true,
            message: `Key "${updated.label}" probed: ${updated.healthStatus} (${updated.latencyMs}ms)`,
            key: updated
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to probe key.' });
    }
});

// Live Health & Quota Probe ALL Keys in Pool Concurrently
router.post('/keys/probe-all', adminAuth, async (req, res) => {
    try {
        const allKeys = await GeminiKey.find();
        if (allKeys.length === 0) {
            return res.json({ success: true, message: 'No keys in pool to probe.', keys: [] });
        }

        const probePromises = allKeys.map(k => probeKey(k));
        const probedResults = await Promise.all(probePromises);

        const healthyCount = probedResults.filter(k => k.healthStatus === 'HEALTHY').length;
        const exhaustedCount = probedResults.filter(k => k.healthStatus === 'EXHAUSTED').length;
        const invalidCount = probedResults.filter(k => k.healthStatus === 'INVALID').length;

        return res.json({
            success: true,
            message: `Probed ${probedResults.length} keys: ${healthyCount} Healthy, ${exhaustedCount} Exhausted, ${invalidCount} Invalid.`,
            stats: { healthyCount, exhaustedCount, invalidCount, total: probedResults.length },
            keys: probedResults
        });
    } catch (err) {
        console.error('Probe all error:', err);
        return res.status(500).json({ success: false, error: 'Failed to probe key pool.' });
    }
});

// Update Key Quota Limits or Label
router.put('/keys/:id', adminAuth, async (req, res) => {
    try {
        const keyId = req.params.id;
        const { label, dailyQuotaLimit } = req.body;

        const keyItem = await GeminiKey.findById(keyId);
        if (!keyItem) {
            return res.status(404).json({ success: false, error: 'Key not found.' });
        }

        if (typeof label === 'string' && label.trim()) {
            keyItem.label = label.trim();
        }

        if (typeof dailyQuotaLimit === 'number' && dailyQuotaLimit > 0) {
            keyItem.dailyQuotaLimit = dailyQuotaLimit;
        }

        await keyItem.save();
        return res.json({ success: true, message: `Updated key "${keyItem.label}" settings.`, key: keyItem });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update key settings.' });
    }
});

module.exports = router;
