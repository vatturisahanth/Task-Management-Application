import React from "react";
import { Task, User, TaskStatus, TaskPriority } from "../types";
import { MessageSquare, Calendar, CheckSquare, Sparkles } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export default function TaskList({ tasks, users, onSelectTask, onUpdateStatus }: TaskListProps) {
  
  const getAssignee = (userId: string) => {
    return users.find((u) => u.id === userId) || { name: "Unassigned", avatar: "👤" };
  };

  const isOverdue = (dateStr: string, status: string) => {
    if (status === "done") return false;
    const today = new Date().toISOString().split("T")[0];
    return dateStr < today;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-55/60 border-b border-slate-200">
              <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Task Info</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Work Status</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assignee</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target Date</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Checklist</th>
              <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                  No tasks matching the selected filters.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const assignee = getAssignee(task.assignedTo);
                const totalSubtasks = task.subtasks.length;
                const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
                const overdue = isOverdue(task.dueDate, task.status);

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => onSelectTask(task)}
                  >
                    {/* Task Info */}
                    <td className="py-4 px-6 max-w-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 text-slate-900 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </span>
                          {task.subtasks.length > 0 && task.subtasks.every(s => s.completed) && (
                            <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded-md font-bold text-[10px] uppercase">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                            {task.category || "General"}
                          </span>
                          <span className="text-xs text-slate-400 px-1 line-clamp-1 max-w-[200px]">
                            {task.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Work Status */}
                    <td className="py-4 px-4">
                      <select
                        onClick={(e) => e.stopPropagation()}
                        value={task.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(task.id, e.target.value as TaskStatus);
                        }}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none border border-slate-150 cursor-pointer ${
                          task.status === "done"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : task.status === "review"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : task.status === "in_progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Completed</option>
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                        task.priority === "high" 
                          ? "bg-rose-50 border-rose-200 text-rose-700" 
                          : task.priority === "medium" 
                          ? "bg-amber-50 border-amber-200 text-amber-700" 
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      }`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{assignee.avatar}</span>
                        <span className="text-xs font-bold text-slate-800">{assignee.name.split(" ")[0]}</span>
                      </div>
                    </td>

                    {/* Target Date */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Calendar className={`w-3.5 h-3.5 ${overdue ? "text-rose-500" : "text-slate-400"}`} />
                        <span className={overdue ? "text-rose-600 font-semibold" : ""}>
                          {task.dueDate}
                        </span>
                      </div>
                    </td>

                    {/* Checklist info */}
                    <td className="py-4 px-4">
                      {totalSubtasks > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{completedSubtasks}/{totalSubtasks}</span>
                          <span className="text-[10px] text-slate-400">({Math.round((completedSubtasks / totalSubtasks) * 100)}%)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>

                    {/* Comments review block */}
                    <td className="py-4 px-6 text-right">
                      {task.comments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <MessageSquare className="w-3 h-3" />
                          {task.comments.length}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
