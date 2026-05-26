import React, { useState, useEffect } from "react";
import { Task, User, TaskPriority, TaskStatus } from "../types";
import { Sparkles, X, Loader2, RefreshCw } from "lucide-react";

interface TaskFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => Promise<void>;
  users: User[];
  taskToEdit?: Task | null;
}

export default function TaskFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  users,
  taskToEdit,
}: TaskFormDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("alex");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [category, setCategory] = useState("Engineering");
  const [dueDate, setDueDate] = useState("");

  // Gemini Fill States
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setAssignedTo(taskToEdit.assignedTo);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setCategory(taskToEdit.category);
      setDueDate(taskToEdit.dueDate);
    } else {
      setTitle("");
      setDescription("");
      setAssignedTo(users[0]?.id || "alex");
      setPriority("medium");
      setStatus("todo");
      setCategory("Engineering");
      setDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]); // 3 days in future default
    }
    setAiPrompt("");
    setAiError("");
    setShowAiInput(false);
  }, [taskToEdit, isOpen, users]);

  if (!isOpen) return null;

  const handleAiAutoFill = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please type a short description first.");
      return;
    }
    setIsAiFilling(true);
    setAiError("");

    try {
      const response = await fetch("/api/gemini/auto-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fill form");
      }

      const data = await response.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.priority) setPriority(data.priority as TaskPriority);
      if (data.category) setCategory(data.category);
      if (data.dueDate) setDueDate(data.dueDate);
      if (data.assignedTo) {
        // Validate assignee matches existing
        const matched = users.find(u => u.id === data.assignedTo.toLowerCase());
        if (matched) setAssignedTo(matched.id);
      }
      setShowAiInput(false);
      setAiPrompt("");
    } catch (e: any) {
      setAiError(e.message || "Could not connect to Gemini. Check your API Key.");
    } finally {
      setIsAiFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      description,
      priority,
      status,
      category,
      dueDate,
      assignedTo,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/65 backdrop-blur-xs font-sans">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-slide-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              {taskToEdit ? "Edit Task" : "Create New Task"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {taskToEdit ? "Customize specific details and update status" : "Add task parameters manually or leverage AI Assistant to pre-fill."}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-6 space-y-6">
          {/* Gemini AI Booster Accordion */}
          {!taskToEdit && (
            <div className={`p-4 rounded-xl border transition-all duration-300 ${showAiInput ? 'border-violet-200 bg-violet-50/50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70'}`}>
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => setShowAiInput(!showAiInput)}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-600 text-white shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      Gemini Auto-Draft Form
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">AI Genius</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Type natural sentences to auto-fill the form instantly.</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-violet-600 hover:underline">
                  {showAiInput ? "Hide" : "Open"}
                </span>
              </div>

              {showAiInput && (
                <div className="mt-4 space-y-3 border-t border-violet-100 pt-3">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., alex chen conduct competitor review next monday priority high and set design track..."
                    rows={2}
                    className="w-full text-sm p-3 rounded-lg border border-violet-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  />
                  {aiError && (
                    <p className="text-xs text-rose-500 font-medium">{aiError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAiInput(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isAiFilling}
                      onClick={handleAiAutoFill}
                      className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      {isAiFilling ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Analyzing Prompt...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Apply Auto-Fill
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Describe current assignment"
                className="w-full text-slate-900 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Instruction Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="List context, reference docs, and guidelines..."
                rows={4}
                className="w-full text-slate-900 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Engineering, Design"
                  className="w-full text-slate-900 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-slate-900 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Assigned To */}
              <div className="col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Assign To
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full text-slate-900 border border-slate-200 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.avatar} {u.name.split(" ")[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full text-slate-950 border border-slate-200 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="low">Low 🟢</option>
                  <option value="medium">Medium 🟡</option>
                  <option value="high">High 🔴</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Work Flow Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full text-slate-950 border border-slate-200 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Under Review</option>
                  <option value="done">Completed</option>
                </select>
              </div>
            </div>

            {/* Submit Block */}
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
              >
                {taskToEdit ? "Save Updates" : "Add Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
