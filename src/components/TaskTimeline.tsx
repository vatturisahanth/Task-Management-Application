import React from "react";
import { Task, User, TaskStatus } from "../types";
import { Calendar, UserCircle, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

interface TaskTimelineProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
}

export default function TaskTimeline({ tasks, users, onSelectTask }: TaskTimelineProps) {
  
  // Sort tasks by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const getAssignee = (userId: string) => {
    return users.find((u) => u.id === userId) || { name: "Unassigned", avatar: "👤" };
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50/50" />;
      case "review":
        return <AlertCircle className="w-5 h-5 text-amber-500 fill-amber-50/50" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-500 fill-blue-50/50 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm font-sans">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Task Schedule Roadmap</h3>
          <p className="text-xs text-slate-500 mt-1">
            Chronological overview of milestones, task expectations, and targets.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>Sorted Chronologically</span>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No tasks found to plan in the timeline.
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 ml-3 py-2">
          {sortedTasks.map((task, index) => {
            const assignee = getAssignee(task.assignedTo);
            const overdue = new Date(task.dueDate).getTime() < new Date().setHours(0,0,0,0) && task.status !== "done";

            return (
              <div 
                key={task.id} 
                className="relative group transition-all duration-300 hover:translate-x-1 cursor-pointer"
                onClick={() => onSelectTask(task)}
              >
                {/* Timeline Axis Node (Dot) */}
                <div className="absolute -left-[37px] top-1 p-0.5 bg-white rounded-full transition-transform group-hover:scale-110 z-10">
                  {getStatusIcon(task.status)}
                </div>

                {/* Task Item Box */}
                <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200">
                  <div className="space-y-1.5 flex-1">
                    {/* Upper Line Info */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        overdue 
                          ? "bg-rose-50 text-rose-600 border border-rose-100" 
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}>
                        {formatDateLabel(task.dueDate)} {overdue ? "• Overdue" : ""}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md">
                        {task.category || "General"}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        task.priority === "high" 
                          ? "text-rose-600" 
                          : task.priority === "medium" 
                          ? "text-amber-600" 
                          : "text-emerald-600"
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </h4>

                    {/* Mini subtasks summary */}
                    {task.subtasks.length > 0 && (
                      <p className="text-[11px] font-medium text-slate-400">
                        Checklist progress: {task.subtasks.filter(s => s.completed).length} of {task.subtasks.length} tasks completed
                      </p>
                    )}
                  </div>

                  {/* Assignee Panel & Metadata layout */}
                  <div className="flex items-center justify-between md:justify-end gap-4 min-w-[150px] border-t border-slate-200/50 md:border-t-0 pt-3 md:pt-0">
                    <div className="flex items-center gap-2 bg-white border border-slate-150 px-3 py-1.5 rounded-xl shadow-xs">
                      <span className="text-lg">{assignee.avatar}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{assignee.name.split(" ")[0]}</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{task.status.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
