require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'barclays_auth.vlm');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// --- Helper: Read/Write DB ---
// We read the file on every request to ensure data consistency without a real DB connection
const getDB = () => {
    if (!fs.existsSync(DB_FILE)) return null;
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

const saveDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- Endpoints ---

// 1. LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { barclaysId, password } = req.body;
    const db = getDB();

    if (!db) return res.status(500).json({ error: "Auth database not initialized" });

    const userIndex = db.users.findIndex(u => u.barclaysId === barclaysId);
    
    // 1. Check User Existence
    if (userIndex === -1) {
        // Generic error for security
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = db.users[userIndex];

    // 2. Check Lockout Status
    if (user.lockedUntil) {
        const lockTime = new Date(user.lockedUntil).getTime();
        const now = new Date().getTime();
        
        if (now < lockTime) {
            const minutesLeft = Math.ceil((lockTime - now) / 60000);
            return res.status(403).json({ error: `Account locked. Try again in ${minutesLeft} minutes.` });
        } else {
            // Lock expired, reset
            user.lockedUntil = null;
            user.failedAttempts = 0;
            // Don't save yet, wait for password check
        }
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        user.failedAttempts += 1;
        const maxAttempts = db.securityPolicy.maxFailedAttempts;
        const remaining = maxAttempts - user.failedAttempts;
        
        // Check if we need to lock
        if (user.failedAttempts >= maxAttempts) {
            const lockDuration = db.securityPolicy.lockoutDuration * 1000; // to ms
            user.lockedUntil = new Date(Date.now() + lockDuration).toISOString();
            
            // Calculate Lockout time in Hours/Minutes for friendly message
            const hours = Math.floor(db.securityPolicy.lockoutDuration / 3600);
            const minutes = Math.floor((db.securityPolicy.lockoutDuration % 3600) / 60);
            const timeStr = hours > 0 ? `${hours} hours` : `${minutes} minutes`;

            db.users[userIndex] = user;
            saveDB(db);
            return res.status(403).json({ error: `Too many failed attempts. Account locked for ${timeStr}.` });
        }

        db.users[userIndex] = user;
        saveDB(db);
        return res.status(401).json({ error: `Invalid credentials. ${remaining} attempts remaining.` });
    }

    // 4. Success - Reset counters & Issue Token
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date().toISOString();
    db.users[userIndex] = user;
    saveDB(db);

    // Create Token
    const token = jwt.sign(
        { 
            id: user.id, 
            barclaysId: user.barclaysId, 
            name: user.name, 
            department: user.department 
        },
        JWT_SECRET,
        { expiresIn: db.securityPolicy.sessionTimeout } // 8 hours
    );

    res.json({
        success: true,
        token,
        user: {
            name: user.name,
            barclaysId: user.barclaysId,
            department: user.department
        }
    });
});

// 2. VALIDATE SESSION
app.post('/api/auth/validate', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ valid: false });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ valid: false });
        res.json({ valid: true, user });
    });
});

// 3. LOGOUT (Optional server-side logging)
app.post('/api/auth/logout', (req, res) => {
    // Since JWT is stateless, the client simply discards the token.
    // We can add a blocklist here in Phase 4 if strict logout is needed.
    res.json({ success: true });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 Vantage Auth Server running on port ${PORT}`);
});