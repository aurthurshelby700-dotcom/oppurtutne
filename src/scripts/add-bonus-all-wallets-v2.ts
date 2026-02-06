/**
 * One-time script to add $1000 bonus to all existing user wallets
 * Run with: npx tsx src/scripts/add-bonus-all-wallets-v2.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment!');
    process.exit(1);
}

// Define schemas inline to avoid import issues
const WalletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    reason: { type: String, enum: ['welcome_bonus', 'project_post', 'contest_post', 'add_funds', 'withdraw'], required: true },
    description: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    username: String,
    // ... other fields
});

const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function addBonusToAllWallets() {
    try {
        console.log('🔌 Connecting to database...');
        await mongoose.connect(MONGODB_URI!);
        console.log('✅ Connected to database');

        // Get all users
        const users = await User.find({}).select('_id username');
        console.log(`📊 Found ${users.length} users`);

        let walletsUpdated = 0;
        let walletsCreated = 0;
        let transactionsCreated = 0;

        for (const user of users) {
            // Skip users without username
            if (!user.username) {
                console.log(`⚠️  Skipping user ${user._id} (no username)`);
                continue;
            }

            // Check if wallet exists
            let wallet = await Wallet.findOne({ userId: user._id });

            if (!wallet) {
                // Create wallet if it doesn't exist
                wallet = await Wallet.create({
                    userId: user._id,
                    username: user.username,
                    balance: 1000,
                    currency: 'USD'
                });
                walletsCreated++;
                console.log(`✨ Created wallet for ${user.username} with $1000`);
            } else {
                // Add $1000 to existing wallet
                wallet.balance += 1000;
                await wallet.save();
                walletsUpdated++;
                console.log(`💰 Added $1000 to ${user.username}'s wallet (New balance: $${wallet.balance})`);
            }

            // Create transaction record
            await Transaction.create({
                walletId: wallet._id,
                type: 'credit',
                amount: 1000,
                reason: 'welcome_bonus',
                description: 'One-time bonus credit',
                createdAt: new Date()
            });
            transactionsCreated++;
        }

        console.log('\n✅ Migration completed successfully!');
        console.log(`📈 Summary:`);
        console.log(`   - Wallets created: ${walletsCreated}`);
        console.log(`   - Wallets updated: ${walletsUpdated}`);
        console.log(`   - Transactions created: ${transactionsCreated}`);
        console.log(`   - Total users processed: ${users.length}`);

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the migration
addBonusToAllWallets()
    .then(() => {
        console.log('🎉 Script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
