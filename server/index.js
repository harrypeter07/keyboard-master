const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const User = require('./models/User');
const Pricing = require('./models/Pricing');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/keyboard_master';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@keyboardmaster.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword2026!';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Lazy MongoDB Connection Middleware for Vercel Serverless & Standalone
let isDbConnected = false;

async function ensureDbConnected(req, res, next) {
    if (isDbConnected || mongoose.connection.readyState === 1) {
        isDbConnected = true;
        return next();
    }
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        isDbConnected = true;

        // Auto-seed Admin Account if missing
        let adminUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
        if (!adminUser) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
            await User.create({
                email: ADMIN_EMAIL.toLowerCase(),
                passwordHash,
                role: 'admin',
            });
            console.log(`👑 Admin user auto-created in MongoDB: ${ADMIN_EMAIL}`);
        } else if (adminUser.role !== 'admin') {
            adminUser.role = 'admin';
            await adminUser.save();
        }

        // Initialize default pricing if missing
        const pricing = await Pricing.findOne();
        if (!pricing) {
            await Pricing.create({
                weeklyPriceUsd: 9.99,
                monthlyPriceUsd: 29.99,
            });
        }
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
    }
    next();
}

app.use(ensureDbConnected);

// Public Showcase Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Dynamic Download Redirect Route (Hides GitHub / Cloud Provider)
app.get('/download-installer', (req, res) => {
    const downloadUrl = process.env.DOWNLOAD_URL || 'https://drive.google.com';
    res.redirect(downloadUrl);
});

// Static Admin Dashboard Page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'Keyboard Master Licensing Server v1.0.0' });
});

// Start local listener if not running as serverless function on Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Keyboard Master Server & Admin Dashboard running at: http://localhost:${PORT}/admin`);
    });
}

module.exports = app;
