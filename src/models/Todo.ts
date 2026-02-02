import mongoose, { Schema, Model } from "mongoose";

export interface ITodo {
    userId: mongoose.Types.ObjectId;
    text: string;
    completed: boolean;
    dueDate?: string;
    type: "manual" | "deadline" | "review";
    createdAt: Date;
}

const TodoSchema = new Schema<ITodo>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
        dueDate: { type: String },
        type: { type: String, enum: ["manual", "deadline", "review"], default: "manual" },
    },
    { timestamps: true }
);

const Todo: Model<ITodo> = mongoose.models.Todo || mongoose.model<ITodo>("Todo", TodoSchema);

export default Todo;
