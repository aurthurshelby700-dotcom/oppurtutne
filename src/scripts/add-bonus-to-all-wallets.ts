/**
 * One-time script to add $1000 bonus to all existing user wallets
 * Run with: npx tsx src/scripts/add-bonus-to-all-wallets.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
const result = config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔍 Environment check:');
console.log('   MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('   MONGODB_URI value:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');

if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment!');
    console.error('   Dotenv result:', result);
    process.exit(1);
}

// Now import modules that depend on env vars
import mongoose from 'mongoose';
import connectToDatabase from '../lib/db';
import Wallet from '../models/Wallet';
import Transaction from '../models/Transaction';
import User from '../models/User';

async function addBonusToAllWallets() {
    try {
        console.log('🔌 Connecting to database...');
        await connectToDatabase();
        console.log('✅ Connected to database');

        // Get all users
        const users = await User.find({}).select('_id username');
        console.log(`📊 Found ${users.length} users`);

        let walletsUpdated = 0;
        let walletsCreated = 0;
        let transactionsCreated = 0;

        for (const user of users) {
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
