
import mongoose from "mongoose";
import Project from "../models/Project";
import Contest from "../models/Contest";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function check() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("No MONGODB_URI");
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const projects = await Project.find({}, '_id title');
        console.log("Projects:", projects.map(p => ({ id: p._id.toString(), title: p.title })));

        const contests = await Contest.find({}, '_id title');
        console.log("Contests:", contests.map(c => ({ id: c._id.toString(), title: c.title })));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
