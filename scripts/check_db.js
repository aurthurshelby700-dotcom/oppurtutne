
const mongoose = require('mongoose');

// Connect to DB directly
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://redwhite2180_db_user:NQx89IARJ8uKvWmJ@cluster0.txgznnj.mongodb.net/?appName=Cluster0";

const userSchema = new mongoose.Schema({
    email: String,
    avatarUrl: String,
    coverUrl: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function check() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    // Find the user (assuming single user or listing all)
    const users = await User.find({});
    users.forEach(u => {
        console.log(`User: ${u.email} | ID: ${u._id}`);
        console.log(`   Avatar: ${u.avatarUrl}`);
        console.log(`   Cover:  ${u.coverUrl}`);
    });

    await mongoose.disconnect();
}

check();
