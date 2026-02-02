
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });

async function checkUsers() {
    // Dynamic import for correct env loading
    const { default: connectToDatabase } = await import("../src/lib/db");
    const { default: User } = await import("../src/models/User");

    await connectToDatabase();

    const users = await User.find({}, 'name email role skills').lean();

    console.log("Current Users in DB:");
    users.forEach(u => {
        console.log(`- ${u.name} (${u.email}): Role = '${u.role}', Skills = [${u.skills?.join(', ')}]`);
    });

    await mongoose.disconnect();
}

checkUsers().catch(console.error);
