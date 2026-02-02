const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://redwhite2180_db_user:NQx89IARJ8uKvWmJ@cluster0.txgznnj.mongodb.net/?appName=Cluster0";

const userSchema = new mongoose.Schema({
    role: String,
    email: String,
    name: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function updateRoles() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`User: ${user.name} (${user.email}), Role: ${user.role}`);
            if (user.role !== 'both') {
                user.role = 'both';
                await user.save();
                console.log(`Updated role to 'both'`);
            }
        }

        console.log("Done");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

updateRoles();
