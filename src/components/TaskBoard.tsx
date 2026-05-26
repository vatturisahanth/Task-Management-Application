import React from "react";
import { Task, User, TaskStatus } from "../types";
import { MessageSquare, CheckSquare, Calendar, ChevronRight, ArrowLeftRight, CheckCircle } from "lucide-react";

interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string; border: string; bg: string }[] = [
  { key: "todo", label: "To Do", color: "text-slate-700 bg-slate-100", border: "border-slate-200", bg: "bg-slate-50/50" },
  { key: "in_progress", label: "In Progress", color: "text-blue-700 bg-blue-50 border-blue-100", border: "border-blue-200", bg: "bg-blue-50/10" },
  { key: "review", label: "In Review", color: "text-amber-700 bg-amber-50 border-amber-100", border: "border-amber-200", bg: "bg-amber-50/10" },
  { key: "done", label: "Completed", color: "text-emerald-700 bg-emerald-50 border-emerald-100", border: "border-emerald-200", bg: "bg-emerald-50/10" }
];

export default function TaskBoard({ tasks, users, onSelectTask, onUpdateStatus }: TaskBoardProps) {
  
  const getAssignee = (userId: string) => {
    return users.find((u) => u.id === userId) || { name: "Unassigned", avatar: "👤", color: "bg-slate-100" };
  };

  const isOverdue = (dateStr: string, status: string) => {
    if (status === "done") return false;
    const today = new Date().toISOString().split("T")[0];
    return dateStr < today;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start font-sans">
      {STATUS_COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.key);

        return (
          <div 
            key={column.key} 
            className={`rounded-2xl border ${column.border} ${column.bg} p-4 flex flex-col max-h-[75vh] min-h-[400px] shadow-xs`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${column.color}`}>
                  {column.label}
                </span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Column Tasks */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200/50 rounded-xl px-4">
                  <span className="text-2xl text-slate-300">📁</span>
                  <p className="text-xs text-slate-400 font-medium mt-2">No tasks in column</p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const assignee = getAssignee(task.assignedTo);
                  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
                  const totalSubtasks = task.subtasks.length;
                  const urgent = isOverdue(task.dueDate, task.status);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="group relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-4 shadow-xs hover:shadow-md cursor-pointer transition-all duration-200"
                    >
                      {/* Category & Priority */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                          {task.category || "General"}
                        </span>
                        
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          task.priority === "high" 
                            ? "bg-rose-50 border-rose-200 text-rose-700" 
                            : task.priority === "medium" 
                            ? "bg-amber-50 border-amber-200 text-amber-700" 
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-1 transition-colors">
                        {task.title}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>

                      {/* Progress checklist bar if has subtasks */}
                      {totalSubtasks > 0 && (
                        <div className="mb-3 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" />
                              Subtasks Progress
                            </span>
                            <span>{completedSubtasks}/{totalSubtasks}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-150 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-800 rounded-full transition-all duration-300" 
                              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer Actions / Meta info */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                        {/* Due date */}
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          <Calendar className={`w-3.5 h-3.5 ${urgent ? 'text-rose-500' : ''}`} />
                          <span className={`${urgent ? 'text-rose-600' : ''}`}>
                            {task.dueDate}
                          </span>
                        </div>

                        {/* Assignee Badge */}
                        <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-100 transition-colors">
                          <span className="text-xs">{assignee.avatar}</span>
                          <span className="text-[10px] font-bold text-slate-600">{assignee.name.split(" ")[0]}</span>
                        </div>
                      </div>

                      {/* Quick Status Adjust tools on card hover */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center bg-white shadow-xs rounded-lg border border-slate-200 transition-opacity p-0.5 gap-0.5">
                        <select
                          onClick={(e) => e.stopPropagation()}
                          value={task.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(task.id, e.target.value as TaskStatus);
                          }}
                          className="text-[10px] font-bold text-slate-600 focus:outline-none bg-transparent hover:bg-slate-50 border-none my-0.5 px-1 py-0.5 cursor-pointer"
                        >
                          <option value="todo">Todo</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Completed</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
