
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load env vars BEFORE importing anything else
dotenv.config({ path: ".env.local" });

async function verify() {
    console.log("Starting verification...");

    // Dynamic imports to ensure env vars are loaded first
    const { default: connectToDatabase } = await import("../src/lib/db");
    const { default: User } = await import("../src/models/User");
    const { default: FriendRequest } = await import("../src/models/FriendRequest");
    const { default: Friendship } = await import("../src/models/Friendship");
    const { default: Conversation } = await import("../src/models/Conversation");
    const { default: Message } = await import("../src/models/Message");

    console.log("Connecting to DB...");
    await connectToDatabase();

    const email1 = `test_user_a_${Date.now()}@example.com`;
    const email2 = `test_user_b_${Date.now()}@example.com`;

    console.log("Creating dummy users...");
    const userA = await User.create({ email: email1, passwordHash: "hash", name: "User A" });
    const userB = await User.create({ email: email2, passwordHash: "hash", name: "User B" });

    console.log(`Created Users: ${userA._id} and ${userB._id}`);

    let conv: any;

    try {
        // 1. Friend Request
        console.log("1. Testing Friend Request...");
        await FriendRequest.create({ sender: userA._id, receiver: userB._id, status: "pending" });
        const req = await FriendRequest.findOne({ sender: userA._id, receiver: userB._id });
        if (!req) throw new Error("Friend Request not created");
        console.log("Friend Request Created: OK");

        // 2. Accept Request
        console.log("2. Testing Accept Request...");
        req.status = "accepted";
        await req.save();
        await Friendship.create({ users: [userA._id, userB._id] });

        const friend = await Friendship.findOne({ users: { $all: [userA._id, userB._id] } });
        if (!friend) throw new Error("Friendship not created");
        console.log("Friendship Created: OK");

        // 3. Messaging
        console.log("3. Testing Messaging...");
        conv = await Conversation.create({ participants: [userA._id, userB._id], updatedAt: new Date() });
        await Message.create({ conversationId: conv._id, sender: userA._id, content: "Hello B!" });

        const msgs = await Message.find({ conversationId: conv._id });
        if (msgs.length !== 1) throw new Error("Message not saved");
        console.log("Message Saved: OK");

        // 4. Test Action Logic (Optional, but good if we can)
        // Since actions are server actions, they might use 'auth()' which is hard to mock here.
        // We stick to model verification which confirms the Schema and DB connection.

    } finally {
        // Cleanup
        console.log("Cleaning up...");
        await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
        await FriendRequest.deleteMany({ sender: { $in: [userA._id, userB._id] } });
        await Friendship.deleteMany({ users: { $in: [userA._id, userB._id] } });
        await Conversation.deleteMany({ _id: conv?._id }); // Optional chaining if conv setup failed
        if (typeof conv !== 'undefined') await Message.deleteMany({ conversationId: conv._id });

        // Close connection to allow script to exit
        await mongoose.disconnect();
    }

    console.log("Verification Successful!");
}

verify().catch(err => {
    console.error("Verification Failed:", err);
    process.exit(1);
});
