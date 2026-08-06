const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Instance = require('../models/Instance');
const Pricing = require('../models/Pricing');

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

// Update Plan Pricing, Server Gemini API Key & Direct Installer Download URL
router.post('/pricing', adminAuth, async (req, res) => {
    try {
        const { weeklyPriceUsd, monthlyPriceUsd, serverGeminiApiKey, downloadUrl } = req.body;
        let pricing = await Pricing.findOne();
        if (!pricing) {
            pricing = new Pricing();
        }

        if (typeof weeklyPriceUsd === 'number') pricing.weeklyPriceUsd = weeklyPriceUsd;
        if (typeof monthlyPriceUsd === 'number') pricing.monthlyPriceUsd = monthlyPriceUsd;
        if (typeof serverGeminiApiKey === 'string') pricing.serverGeminiApiKey = serverGeminiApiKey;
        if (typeof downloadUrl === 'string') pricing.downloadUrl = downloadUrl.trim();

        await pricing.save();
        return res.json({ success: true, message: 'Pricing and server settings updated successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update pricing.' });
    }
});

module.exports = router;
