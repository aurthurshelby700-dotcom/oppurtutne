const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://redwhite2180_db_user:NQx89IARJ8uKvWmJ@cluster0.txgznnj.mongodb.net/?appName=Cluster0";

// Define schemas with strict: false to allow any fields
const projectSchema = new mongoose.Schema({}, { strict: false });
const contestSchema = new mongoose.Schema({}, { strict: false });

const Project = mongoose.model('Project', projectSchema);
const Contest = mongoose.model('Contest', contestSchema);

async function migrateTypes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✓ Connected to MongoDB");

        // Migrate Projects
        console.log("\n=== Migrating Projects ===");
        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects`);

        let projectsUpdated = 0;
        for (const project of projects) {
            const updates = {};

            // Update type to lowercase if it's uppercase
            if (project.type === "PROJECT" || project.type === "CONTEST") {
                updates.type = project.type.toLowerCase();
            } else if (!project.type) {
                updates.type = "project";
            }

            if (Object.keys(updates).length > 0) {
                await Project.updateOne({ _id: project._id }, { $set: updates });
                projectsUpdated++;
                console.log(`  Updated project: ${project.title} - set type to "${updates.type}"`);
            }
        }
        console.log(`✓ Updated ${projectsUpdated} projects`);

        // Migrate Contests
        console.log("\n=== Migrating Contests ===");
        const contests = await Contest.find({});
        console.log(`Found ${contests.length} contests`);

        let contestsUpdated = 0;
        for (const contest of contests) {
            const updates = {};

            // Add type field if missing
            if (!contest.type || contest.type !== "contest") {
                updates.type = "contest";
            }

            // Migrate prize to prizeAmount if needed
            if (contest.prize && !contest.prizeAmount) {
                updates.prizeAmount = contest.prize;
            }

            if (Object.keys(updates).length > 0) {
                await Contest.updateOne({ _id: contest._id }, { $set: updates });
                contestsUpdated++;
                console.log(`  Updated contest: ${contest.title} - ${JSON.stringify(updates)}`);
            }
        }
        console.log(`✓ Updated ${contestsUpdated} contests`);

        // Verify changes
        console.log("\n=== Verification ===");
        const projectTypes = await Project.distinct('type');
        const contestTypes = await Contest.distinct('type');
        console.log("Project types in DB:", projectTypes);
        console.log("Contest types in DB:", contestTypes);

        console.log("\n✓ Migration completed successfully!");

    } catch (error) {
        console.error("❌ Migration error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n✓ Disconnected from MongoDB");
    }
}

migrateTypes();
