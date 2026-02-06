import { redirect } from "next/navigation";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export default async function ProfileRedirect() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    await connectToDatabase();

    // Fetch user by email to get username
    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user || !user.username) {
        redirect("/setup-profile");
    }

    // Redirect to the user's profile page
    redirect(`/profile/${user.username}`);
}
