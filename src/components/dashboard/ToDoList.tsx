"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Plus, Trash2, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTodos, addTodo, toggleTodo, deleteTodo } from "@/lib/actions/todos";
// import { useToast } from "@/hooks/use-toast";

interface Todo {
    _id: string; // MongoDB ID uses _id
    text: string;
    completed: boolean;
    dueDate?: string;
    type: "manual" | "deadline" | "review";
}

export function ToDoList() {
    const [newItem, setNewItem] = useState("");
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    // const { toast } = useToast();

    // Fetch Todos on Mount
    useEffect(() => {
        async function loadTodos() {
            try {
                const data = await getTodos();
                setTodos(data);
            } catch (error) {
                console.error("Failed to load todos", error);
            } finally {
                setLoading(false);
            }
        }
        loadTodos();
    }, []);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        // Optimistic Update
        const tempId = Date.now().toString();
        const optimisticTodo: Todo = {
            _id: tempId,
            text: newItem,
            completed: false,
            type: "manual"
        };
        setTodos([optimisticTodo, ...todos]);
        setNewItem("");

        // Server Call
        const result = await addTodo(newItem);
        if (result.error) {
            // Revert on error
            setTodos(prev => prev.filter(t => t._id !== tempId));
            console.error("Failed to add task");
            // toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
        } else if (result.success && result.todo) {
            // Replace temp ID with real ID
            setTodos(prev => prev.map(t => t._id === tempId ? result.todo : t));
        }
    };

    const handleToggleTodo = async (id: string, currentState: boolean) => {
        // Optimistic Update
        setTodos(prev => prev.map(t => t._id === id ? { ...t, completed: !currentState } : t));

        const result = await toggleTodo(id, currentState);
        if (result.error) {
            // Revert
            setTodos(prev => prev.map(t => t._id === id ? { ...t, completed: currentState } : t));
            console.error("Failed to update task");
            // toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
        }
    };

    const handleDeleteTodo = async (id: string) => {
        // Optimistic Update
        const previousTodos = [...todos];
        setTodos(prev => prev.filter(t => t._id !== id));

        const result = await deleteTodo(id);
        if (result.error) {
            // Revert
            setTodos(previousTodos);
            console.error("Failed to delete task");
            // toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
        }
    };

    return (
        <div className="bg-card rounded-xl border border-border p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">My To-Do List</h3>
                <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
            </div>

            {/* Add Item Input */}
            <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 bg-muted/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
                <button
                    type="submit"
                    disabled={!newItem.trim()}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </form>

            {/* List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : todos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks yet. Enjoy your day!
                    </div>
                ) : (
                    todos.map((todo) => (
                        <div
                            key={todo._id}
                            className={cn(
                                "group flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-muted/50",
                                todo.completed ? "bg-muted/30 border-transparent opacity-60" : "bg-background border-border"
                            )}
                        >
                            <button
                                onClick={() => handleToggleTodo(todo._id, todo.completed)}
                                className={cn(
                                    "mt-0.5 shrink-0 transition-colors",
                                    todo.completed ? "text-primary" : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                {todo.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-sm font-medium break-words",
                                    todo.completed && "line-through text-muted-foreground"
                                )}>
                                    {todo.text}
                                </p>

                                {todo.dueDate && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 font-medium">
                                        <Calendar className="h-3 w-3" />
                                        {todo.dueDate}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleDeleteTodo(todo._id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
