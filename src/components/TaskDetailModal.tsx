import React, { useState } from "react";
import { Task, User, TaskStatus, SubTask } from "../types";
import { X, Calendar, UserCheck, Tag, Trash2, Edit, MessageSquare, Plus, Sparkles, Loader2, CheckSquare, Square } from "lucide-react";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  activeUser: User;
  onUpdateTask: (updatedTask: Task) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onEditClick: (task: Task) => void;
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  users,
  activeUser,
  onUpdateTask,
  onDeleteTask,
  onEditClick,
}: TaskDetailModalProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [commentError, setCommentError] = useState("");

  if (!isOpen || !task) return null;

  const assignee = users.find((u) => u.id === task.assignedTo) || { name: "Unassigned", avatar: "👤", role: "Specialist" };

  // Cycle task status handler
  const handleStatusChange = async (newStatus: TaskStatus) => {
    const updated: Task = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateTask(updated);
  };

  // Toggle subtask status handler
  const handleToggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((st) => {
      if (st.id === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    const updated: Task = {
      ...task,
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateTask(updated);
  };

  // Add a manual subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: SubTask = {
      id: `st-manual-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    const updated: Task = {
      ...task,
      subtasks: [...task.subtasks, newSub],
      updatedAt: new Date().toISOString(),
    };

    await onUpdateTask(updated);
    setNewSubtaskTitle("");
  };

  // Retrieve smart subtask suggestions using Gemini AI
  const handleGeminiSuggestSubtasks = async () => {
    setIsAiSuggesting(true);
    try {
      const response = await fetch("/api/gemini/suggest-subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title, description: task.description }),
      });

      if (!response.ok) {
        throw new Error("Could not fetch Gemini suggestions. Please double check API Key is configured.");
      }

      const generatedSubtasks: SubTask[] = await response.json();
      
      const updated: Task = {
        ...task,
        subtasks: [...task.subtasks, ...generatedSubtasks],
        updatedAt: new Date().toISOString(),
      };

      await onUpdateTask(updated);
    } catch (e: any) {
      alert(e.message || "Failed to generate AI checklist items. Set your API Key in Settings > Secrets!");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  // Post a text comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    setCommentError("");

    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newComment.trim(),
          userId: activeUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const addedComment = await response.json();
      
      // Update local view task (comments updated in place)
      const updated: Task = {
        ...task,
        comments: [...task.comments, addedComment],
        updatedAt: new Date().toISOString(),
      };

      await onUpdateTask(updated);
      setNewComment("");
    } catch (e: any) {
      setCommentError(e.message || "Failed saving comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete current task
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task? This is irreversible.")) {
      await onDeleteTask(task.id);
      onClose();
    }
  };

  // Format YYYY-MM-DD
  const formatDateTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/65 backdrop-blur-xs font-sans">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-slide-in">
        
        {/* Modal Top Nav Bar */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              task.priority === "high" 
                ? "bg-rose-50 border-rose-200 text-rose-700" 
                : task.priority === "medium" 
                ? "bg-amber-50 border-amber-200 text-amber-700" 
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              {task.priority} Priority
            </span>
            <span className="text-xs font-semibold text-slate-400">
              #{task.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditClick(task)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1 text-xs font-semibold border border-transparent hover:border-slate-200"
              title="Edit Task parameters"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors flex items-center gap-1 text-xs font-semibold border border-transparent hover:border-rose-100"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1" />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Work status select and due milestones banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State Status</p>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className={`text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none border cursor-pointer w-full bg-white shadow-xs ${
                  task.status === "done"
                    ? "text-emerald-700 border-emerald-200"
                    : task.status === "review"
                    ? "text-amber-700 border-amber-200"
                    : task.status === "in_progress"
                    ? "text-blue-700 border-blue-200"
                    : "text-slate-700 border-slate-200"
                }`}
              >
                <option value="todo">📋 To Do</option>
                <option value="in_progress">⚡ In Progress</option>
                <option value="review">🔍 Under Review</option>
                <option value="done">✅ Completed</option>
              </select>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Person</p>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 shadow-xs">
                <span className="text-sm">{assignee.avatar}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{assignee.name}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Due Date</p>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">{task.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Heading and category */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {task.category || "General"}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 pt-1">
              {task.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {task.description || "No supplemental details provided for this task assignment."}
            </p>
          </div>

          {/* Interactive Check Checklist Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                Subtasks checklist
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                </span>
              </h3>

              {/* Gemini AI Suggestions trigger */}
              <button
                type="button"
                onClick={handleGeminiSuggestSubtasks}
                disabled={isAiSuggesting}
                className="text-[10px] font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-150 px-2.5 py-1 rounded-lg flex items-center gap-1 disabled:opacity-60 transition-colors"
                title="Generates granular checklist items using Gemini AI based on context"
              >
                {isAiSuggesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-violet-600" />
                    <span>Gemini suggesting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-violet-600" />
                    <span>Gemini AI Breakdown</span>
                  </>
                )}
              </button>
            </div>

            {/* Checklist items list */}
            {task.subtasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1 px-1">
                No custom subtasks yet. Click Gemini AI Breakdown to auto-suggest a professional checklist!
              </p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleToggleSubtask(st.id)}
                    className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100/60 transition-colors rounded-lg border border-slate-200/40 cursor-pointer"
                  >
                    {st.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium text-slate-700 ${st.completed ? 'line-through text-slate-400' : ''}`}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Subtask Add Form */}
            <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1.5">
              <input
                type="text"
                placeholder="Add subtask manually..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-slate-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Activity Logs / Comments Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              Assignment Comments & Feedback
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-semibold">
                {task.comments.length}
              </span>
            </h3>

            {/* Historic Comments */}
            {task.comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No discussion comments logged. Be first to leave feedback!</p>
            ) : (
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {task.comments.map((comm) => (
                  <div key={comm.id} className="bg-slate-50/70 p-3 rounded-lg border border-slate-100/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{comm.userAvatar}</span>
                        <span className="text-xs font-semibold text-slate-900">{comm.userName}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {formatDateTime(comm.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pl-5 whitespace-pre-wrap">{comm.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Leave a Comment form */}
            <form onSubmit={handlePostComment} className="space-y-2 pt-1">
              <textarea
                placeholder="Share reviews, blockers, or log instructions..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="w-full text-slate-900 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {commentError && (
                <p className="text-rose-500 text-xs font-semibold">{commentError}</p>
              )}
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <span>Commenting as:</span>
                  <span className="font-bold text-slate-600">{activeUser.avatar} {activeUser.name}</span>
                </p>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-1.5 px-4 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmittingComment ? "Posting..." : "Comment"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Dates Footer bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between font-medium">
          <span>Created: {formatDateTime(task.createdAt)}</span>
          <span>Last Active: {formatDateTime(task.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
