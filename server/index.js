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
const ATLAS_URI = 'mongodb+srv://hassanmansuri570_db_user:8CWWFYdtoVi3UhuK@cluster0.2gpa5kk.mongodb.net/keyboard_master?retryWrites=true&w=majority&appName=Cluster0';
const MONGO_URI = process.env.MONGO_URI || ATLAS_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@keyboardmaster.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword2026!';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Lazy MongoDB Connection Middleware for Vercel Serverless & Standalone
let isDbConnected = false;

async function ensureDbConnected(req, res, next) {
    if (isDbConnected || mongoose.connection.readyState === 1) {
        isDbConnected = true;
        return next();
    }
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 8000,
        });
        isDbConnected = true;

        // Auto-seed / Sync Admin Account
        let adminUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
        if (!adminUser) {
            await User.create({
                email: ADMIN_EMAIL.toLowerCase(),
                passwordHash,
                role: 'admin',
            });
            console.log(`👑 Admin user auto-created in MongoDB: ${ADMIN_EMAIL}`);
        } else {
            let updated = false;
            if (adminUser.role !== 'admin') {
                adminUser.role = 'admin';
                updated = true;
            }
            const isPasswordMatch = await bcrypt.compare(ADMIN_PASSWORD, adminUser.passwordHash);
            if (!isPasswordMatch) {
                adminUser.passwordHash = passwordHash;
                updated = true;
            }
            if (updated) {
                await adminUser.save();
                console.log(`👑 Admin user updated in MongoDB: ${ADMIN_EMAIL}`);
            }
        }

        // Initialize default pricing if missing
        const pricing = await Pricing.findOne();
        if (!pricing) {
            await Pricing.create({});
        }

        return next();
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        return res.status(500).json({ success: false, error: `Database Connection Failed: ${err.message}` });
    }
}

app.use(ensureDbConnected);

// Public Showcase Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// App Preview Image Asset
app.get('/km_app_preview.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'km_app_preview.jpg'));
});

// Dynamic Download Redirect Route (Hides Google Drive / AWS S3 / Cloud Provider)
app.get('/download-installer', async (req, res) => {
    try {
        const pricing = await Pricing.findOne();
        const targetUrl = (pricing && pricing.downloadUrl && pricing.downloadUrl.trim()) 
            ? pricing.downloadUrl.trim() 
            : (process.env.DOWNLOAD_URL || 'https://drive.google.com');
        res.redirect(targetUrl);
    } catch (err) {
        const fallbackUrl = process.env.DOWNLOAD_URL || 'https://drive.google.com';
        res.redirect(fallbackUrl);
    }
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
