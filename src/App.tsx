import React, { useState, useEffect } from "react";
import { Task, User, ActivityLog, TaskStatus } from "./types";
import { 
  Sparkles, 
  Plus, 
  Search, 
  KanbanSquare, 
  ListTodo, 
  CalendarDays, 
  RefreshCw, 
  Filter, 
  MessageSquare, 
  ArrowRight,
  UserCircle,
  Clock,
  Activity
} from "lucide-react";

// Components
import TaskBoard from "./components/TaskBoard";
import TaskList from "./components/TaskList";
import TaskTimeline from "./components/TaskTimeline";
import TaskFormDrawer from "./components/TaskFormDrawer";
import TaskDetailModal from "./components/TaskDetailModal";
import StandupReportModal from "./components/StandupReportModal";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  // Collaborative Acting User
  const [activeUser, setActiveUser] = useState<User | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [viewMode, setViewMode] = useState<"board" | "list" | "timeline">("board");

  // Loaders & Sync
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals & Drawers UI control
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStandupOpen, setIsStandupOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Fetch initial data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [resTasks, resUsers, resAct] = await Promise.all([
        fetch("/api/tasks").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
        fetch("/api/activities").then(r => r.json())
      ]);

      setTasks(resTasks);
      setUsers(resUsers);
      setActivities(resAct);
      
      // Default actor is product manager Alex
      const defaultActor = resUsers.find((u: any) => u.id === "alex") || resUsers[0];
      setActiveUser(defaultActor);
    } catch (e) {
      console.error("Failed loading task manager workspace data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const syncState = async () => {
    setIsSyncing(true);
    try {
      const [resTasks, resAct] = await Promise.all([
        fetch("/api/tasks").then(r => r.json()),
        fetch("/api/activities").then(r => r.json())
      ]);
      setTasks(resTasks);
      setActivities(resAct);

      // If a task is selected, keep its reference fully synchronized with terbaru state
      if (selectedTask) {
        const synced = resTasks.find((t: any) => t.id === selectedTask.id);
        if (synced) setSelectedTask(synced);
      }
    } catch (e) {
      console.error("Sync error", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll for collaborative modifications & activity ticks every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      syncState();
    }, 8000);
    return () => clearInterval(timer);
  }, [selectedTask]);

  // Task Handlers
  const handleCreateTask = async (taskData: any) => {
    if (!activeUser) return;
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          creatorId: activeUser.id,
        }),
      });

      if (!response.ok) throw new Error("Could not save task");
      
      await syncState();
      setIsFormOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!activeUser) return;
    try {
      const response = await fetch(`/api/tasks/${updatedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedTask,
          userId: activeUser.id, // Who made update
        }),
      });

      if (!response.ok) throw new Error("Could not update task parameters");
      
      await syncState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    await handleUpdateTask({
      ...task,
      status: newStatus,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeUser) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}?userId=${activeUser.id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete task");

      await syncState();
      setSelectedTask(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper edit click handler
  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  const handleCreateNewClick = () => {
    setTaskToEdit(null);
    setIsFormOpen(true);
  };

  // Filtering Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || task.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;
    const matchesAssignee = selectedAssignee === "all" || task.assignedTo === selectedAssignee;

    return matchesSearch && matchesCategory && matchesPriority && matchesAssignee;
  });

  // Calculate unique categories for filters
  const categories = Array.from(new Set(tasks.map((t) => t.category))).filter(Boolean);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans space-y-4">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-slate-800 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-sm font-semibold text-slate-800">Booting Collaborative Task Manager</h2>
          <p className="text-xs text-slate-400 mt-1">Acquiring live state, seed tasks, and activity records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/40 text-slate-900 flex flex-col font-sans select-none antialiased">
      
      {/* Prime Header Dashboard Navigation */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo Name block */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Task Manager</h1>
              <p className="text-xs text-slate-400 font-medium">Full-stack human collaborative assignment board with Gemini AI standups</p>
            </div>
            {isSyncing && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Live Syncing
              </span>
            )}
          </div>

          {/* Action and User Switch Panel */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Acting user switcher board */}
            {activeUser && (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 p-1.5 pl-3 rounded-2xl shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acting as:</span>
                <select
                  value={activeUser.id}
                  onChange={(e) => {
                    const selected = users.find(u => u.id === e.target.value);
                    if (selected) setActiveUser(selected);
                  }}
                  className="text-xs font-bold text-slate-800 focus:outline-none bg-transparent mr-1 cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.avatar} {u.name.split(" ")[0]} ({u.role.split(" ")[0]})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* AI Standsup button */}
            <button
              onClick={() => setIsStandupOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-transform cursor-pointer hover:scale-102 active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Scrum Standup</span>
            </button>

            {/* Create Manual task button */}
            <button
              onClick={handleCreateNewClick}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-4 md:px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Tasks Board workspace filter grid (Columns col-span-3) */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Grid control bar (Search + ViewModes + Filter parameters) */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search text field */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Query by title, categories, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-slate-950 border border-slate-200 pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                />
              </div>

              {/* View mode toggle buttons (Board / List / Timeline) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start border border-slate-205">
                <button
                  onClick={() => setViewMode("board")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === "board" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <KanbanSquare className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Row List</span>
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === "timeline" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </button>
              </div>
            </div>

            {/* Context Filters dropdown rows */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Quick Filters:
              </span>

              {/* Category dropdown check */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">📁 All Categories</option>
                {categories.map((catString: string) => (
                  <option key={catString} value={catString.toLowerCase()}>
                    {catString}
                  </option>
                ))}
              </select>

              {/* Priority dropdown constraint */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">🚨 All Priorities</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>

              {/* Assignee dropdown constraint */}
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">👤 All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.avatar} {u.name}
                  </option>
                ))}
              </select>

              {/* Clear filters shortcut */}
              {(searchQuery || selectedCategory !== "all" || selectedPriority !== "all" || selectedAssignee !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedPriority("all");
                    setSelectedAssignee("all");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline cursor-pointer"
                >
                  Clear all search filters
                </button>
              )}
            </div>
          </div>

          {/* Active View Display Box */}
          <div className="transition-all duration-300">
            {viewMode === "board" && (
              <TaskBoard
                tasks={filteredTasks}
                users={users}
                onSelectTask={setSelectedTask}
                onUpdateStatus={handleUpdateTaskStatus}
              />
            )}
            {viewMode === "list" && (
              <TaskList
                tasks={filteredTasks}
                users={users}
                onSelectTask={setSelectedTask}
                onUpdateStatus={handleUpdateTaskStatus}
              />
            )}
            {viewMode === "timeline" && (
              <TaskTimeline
                tasks={filteredTasks}
                users={users}
                onSelectTask={setSelectedTask}
              />
            )}
          </div>
        </section>

        {/* Right Side: Animated Multiplayer Collaboration Log & Activities Feed */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[75vh] min-h-[400px]">
            
            {/* Activities Title banner */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  Live Activity Feed
                </h4>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md">
                {activities.length}
              </span>
            </div>

            {/* Activities scroll section */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activities.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  No activity edits recorded. Start creating tasks or posting comments!
                </div>
              ) : (
                activities.slice(0, 50).map((act) => {
                  return (
                    <div key={act.id} className="text-xs space-y-1.5 border-b border-slate-100 pb-3 group">
                      <div className="flex items-center justify-between gap-2">
                        {/* Who done it */}
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                          <span className="font-bold text-slate-700">{act.userName.split(" ")[0]}</span>
                        </div>
                        {/* Time label */}
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(act.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      
                      {/* Action text */}
                      <p className="text-slate-600 line-clamp-3 leading-relaxed">
                        {act.text}
                      </p>

                      {/* Attached Task tag */}
                      {act.taskTitle && (
                        <div 
                          onClick={() => {
                            const found = tasks.find(t => t.id === act.taskId);
                            if (found) setSelectedTask(found);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
                        >
                          <span>Task Info</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 text-center font-medium mt-3 flex-shrink-0 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Real-time polling enabled</span>
            </div>
          </div>
        </aside>
      </main>

      {/* FOOTER credit */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider mt-12">
        <span>Google Cloud AI Studio Build System • Powered by Gemini</span>
      </footer>

      {/* MODALS & DRAWERS */}
      
      {/* Create / Edit Form Drawer */}
      <TaskFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={taskToEdit ? handleUpdateTask : handleCreateTask}
        users={users}
        taskToEdit={taskToEdit}
      />

      {/* Detail Slide Drawer Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          users={users}
          activeUser={activeUser || users[0]}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onEditClick={handleEditClick}
        />
      )}

      {/* AI Scrum standup Modal */}
      <StandupReportModal
        isOpen={isStandupOpen}
        onClose={() => setIsStandupOpen(false)}
      />

    </div>
  );
}
