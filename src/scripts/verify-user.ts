
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

async function checkUser() {
    try {
        await connectToDatabase();
        const user = await User.findOne({ username: 'testuser123' }).select('+verificationToken +passwordHash');

        console.log("User found:", !!user);
        if (user) {
            console.log("Username:", user.username);
            console.log("Email:", user.email);
            console.log("Role:", user.role);
            console.log("Email Verified:", user.emailVerified);
            console.log("Has Password Hash:", !!user.passwordHash);
            console.log("Has Verification Token:", !!user.verificationToken);
            console.log("FirstName:", user.firstName);
            console.log("LastName:", user.lastName);
            console.log("Virtual Name:", user.name);
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkUser();
