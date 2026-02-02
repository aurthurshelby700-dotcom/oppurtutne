const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://redwhite2180_db_user:NQx89IARJ8uKvWmJ@cluster0.txgznnj.mongodb.net/?appName=Cluster0";

const schema = new mongoose.Schema({}, { strict: false });
const Project = mongoose.model('Project', schema);
const Contest = mongoose.model('Contest', schema);

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const projects = await Project.find({});
        console.log(`\nFound ${projects.length} Projects:`);
        projects.forEach(p => {
            console.log(`- [${p.status}] ${p.title} (CreatedBy: ${p.createdBy})`);
        });

        const contests = await Contest.find({});
        console.log(`\nFound ${contests.length} Contests:`);
        contests.forEach(c => {
            console.log(`- [${c.status}] ${c.title} (CreatedBy: ${c.createdBy})`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
