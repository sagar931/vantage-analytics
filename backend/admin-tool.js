require('dotenv').config();
const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'barclays_auth.vlm');

// --- Helper: Read/Write DB ---
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        // Initialize default structure if missing
        const defaultDB = {
            version: "1.0",
            users: [],
            securityPolicy: {
                sessionTimeout: 28800, // 8 hours
                maxFailedAttempts: 3,
                lockoutDuration: 10800 // 3 hours (in seconds)
            }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
        return defaultDB;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- Actions ---

const addUser = async (email, password, name, department) => {
    const db = readDB();
    
    if (db.users.find(u => u.barclaysId === email)) {
        console.log(`❌ Error: User ${email} already exists.`);
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = {
        id: 'emp' + Math.random().toString(36).substr(2, 9),
        barclaysId: email,
        passwordHash: hash,
        name: name,
        department: department,
        status: 'active',
        failedAttempts: 0,
        lockedUntil: null,
        lastLogin: null,
        createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);
    console.log(`✅ User ${name} (${email}) created successfully.`);
};

const listUsers = () => {
    const db = readDB();
    console.log('\n--- Registered Users ---');
    console.table(db.users.map(u => ({
        ID: u.id,
        Name: u.name,
        Email: u.barclaysId,
        Status: u.status,
        Locked: u.lockedUntil ? 'YES' : 'No'
    })));
};

const removeUser = (email) => {
    const db = readDB();
    const initialLength = db.users.length;
    db.users = db.users.filter(u => u.barclaysId !== email);
    
    if (db.users.length < initialLength) {
        writeDB(db);
        console.log(`✅ User ${email} removed.`);
    } else {
        console.log(`❌ User ${email} not found.`);
    }
};

// --- CLI Handler ---
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'add':
        if (args.length < 5) {
            console.log('Usage: node admin-tool.js add <email> <password> <name> <dept>');
        } else {
            addUser(args[1], args[2], args[3], args[4]);
        }
        break;
    case 'list':
        listUsers();
        break;
    case 'remove':
        removeUser(args[1]);
        break;
    default:
        console.log('Available commands: add, list, remove');
}