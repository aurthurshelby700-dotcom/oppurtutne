const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

console.log('Testing connection to:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Mask credentials

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB');
        console.log('Connection state:', mongoose.connection.readyState);
        return mongoose.disconnect();
    })
    .then(() => {
        console.log('Disconnected');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Connection failed:', err.message);
        if (err.message.includes('Authentication failed')) {
            console.error('Hint: Check your username and password in the connection string.');
        }
        if (err.message.includes('bad auth')) {
            console.error('Hint: Check if the user has correct permissions (readWrite) on the database.');
        }
        process.exit(1);
    });
