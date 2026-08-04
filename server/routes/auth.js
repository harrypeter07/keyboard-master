const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Instance = require('../models/Instance');
const Pricing = require('../models/Pricing');

const JWT_SECRET = process.env.JWT_SECRET || 'keyboard_master_secret_key_2026';

// Register User
router.post('/register', async (req, res) => {
    try {
        const { email, password, acceptedTerms } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

        if (!acceptedTerms) {
            return res.status(400).json({ success: false, error: 'You must accept the Terms & Conditions to register.' });
        }

        if (!email || !password || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Please provide a valid email and password (min 6 characters).' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            email: email.toLowerCase(),
            passwordHash,
            createdIp: ip,
            lastIp: ip,
            acceptedTermsAt: new Date(),
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '30d' });

        return res.json({
            success: true,
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                plan: newUser.plan,
                cloudApiAccess: newUser.cloudApiAccess,
            },
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ success: false, error: 'Server error during registration.' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password, deviceId, platform } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid credentials.' });
        }

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                isBanned: true,
                error: `Account Banned: ${user.banReason || 'Violation of terms & conditions.'}`,
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Invalid credentials.' });
        }

        user.lastIp = ip;
        await user.save();

        // Track Instance
        if (deviceId) {
            await Instance.findOneAndUpdate(
                { userId: user._id, deviceId },
                { ipAddress: ip, platform: platform || 'win32', status: 'active', lastHeartbeat: new Date() },
                { upsert: true, new: true }
            );
        }

        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

        return res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                plan: user.plan,
                planExpiresAt: user.planExpiresAt,
                cloudApiAccess: user.cloudApiAccess,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, error: 'Server error during login.' });
    }
});

// Heartbeat & Instance Status Verification
router.post('/heartbeat', async (req, res) => {
    try {
        const { token, deviceId } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

        if (!token) {
            return res.status(401).json({ success: false, error: 'Token missing' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                isBanned: true,
                error: `Account Banned: ${user.banReason || 'Violation of terms & conditions.'}`,
            });
        }

        if (deviceId) {
            const instance = await Instance.findOne({ userId: user._id, deviceId });
            if (instance && instance.status === 'killed') {
                return res.status(403).json({
                    success: false,
                    isKilled: true,
                    error: 'This device instance has been remotely disabled by administrator.',
                });
            }

            await Instance.findOneAndUpdate(
                { userId: user._id, deviceId },
                { ipAddress: ip, lastHeartbeat: new Date(), status: 'active' },
                { upsert: true }
            );
        }

        // Get pricing and plan information
        const pricing = await Pricing.findOne() || { weeklyPriceUsd: 9.99, monthlyPriceUsd: 29.99 };

        return res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                plan: user.plan,
                planExpiresAt: user.planExpiresAt,
                cloudApiAccess: user.cloudApiAccess,
            },
            pricing: {
                weekly: pricing.weeklyPriceUsd,
                monthly: pricing.monthlyPriceUsd,
            },
        });
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
});

module.exports = router;
