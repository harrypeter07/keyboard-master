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

// Connect to MongoDB & Start Server
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB database successfully.');

        // Auto-seed Admin Account if missing
        let adminUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
        if (!adminUser) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
            adminUser = await User.create({
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
            console.log('Initialized default subscription pricing.');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Keyboard Master Server & Admin Dashboard running at: http://localhost:${PORT}/admin`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('Running in offline/fallback mode on port ' + PORT);
        app.listen(PORT);
    });
