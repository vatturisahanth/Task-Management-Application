import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { User, Task, ActivityLog, Comment, SubTask, TaskPriority, TaskStatus } from "./src/types.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Client - Lazy Initializer
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please add your actual Gemini API Key inside Settings > Secrets.");
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // Seed Users
  let users: User[] = [
    { id: "alex", name: "Alex Chen", role: "Product Manager", avatar: "👨‍💻", color: "text-emerald-500 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
    { id: "jordan", name: "Jordan Taylor", role: "Frontend Engineer", avatar: "👩‍💻", color: "text-blue-500 bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { id: "taylor", name: "Taylor Smith", role: "Backend Engineer", avatar: "🧙‍♂️", color: "text-violet-500 bg-violet-50 border-violet-200 hover:bg-violet-100" },
    { id: "morgan", name: "Morgan Vance", role: "UI/UX Designer", avatar: "🎨", color: "text-pink-500 bg-pink-50 border-pink-200 hover:bg-pink-100" },
  ];

  // Seed Tasks
  let tasks: Task[] = [
    {
      id: "task-1",
      title: "Design High-Fidelity Wireframes",
      description: "Create modern, accessible wireframes for our dashboard using a high-contrast dark slate color palette. Focus on seamless typography and intuitive task layouts based on the latest Design Philosophy.",
      priority: "high",
      status: "review",
      category: "Design",
      dueDate: "2026-05-30",
      assignedTo: "morgan",
      subtasks: [
        { id: "st-1", title: "Establish visual scale & custom typography rules", completed: true },
        { id: "st-2", title: "Design primary task container list layout", completed: true },
        { id: "st-3", title: "Create micro-interactions for drag-and-drop feedback", completed: false },
      ],
      comments: [
        { id: "c-1", userId: "alex", userName: "Alex Chen", userAvatar: "👨‍💻", text: "Ensure the visual hierarchy distinguishes Priorities clearly!", createdAt: "2026-05-26T14:30:00Z" },
        { id: "c-2", userId: "morgan", userName: "Morgan Vance", userAvatar: "🎨", text: "Added the high-contrast tags and updated the mockup line heights.", createdAt: "2026-05-26T15:10:00Z" }
      ],
      createdAt: "2026-05-25T10:00:00Z",
      updatedAt: "2026-05-26T15:10:00Z",
    },
    {
      id: "task-2",
      title: "Optimize Node State Manager & API proxies",
      description: "Implement in-memory storage, clear route controllers, and integrate full-stack state synchronizations to enable real-time dashboard updates without database overhead.",
      priority: "high",
      status: "in_progress",
      category: "Engineering",
      dueDate: "2026-05-28",
      assignedTo: "taylor",
      subtasks: [
        { id: "st-4", title: "Configure standard Express router schema", completed: true },
        { id: "st-5", title: "Add activity log logger midddleware", completed: true },
        { id: "st-6", title: "Design the Gemini auto-filler AI parsing parameters", completed: false },
      ],
      comments: [
        { id: "c-3", userId: "jordan", userName: "Jordan Taylor", userAvatar: "👩‍💻", text: "Make sure all CORS headers are aligned for full offline developer workflow.", createdAt: "2026-05-26T11:45:00Z" }
      ],
      createdAt: "2026-05-25T11:00:00Z",
      updatedAt: "2026-05-26T12:00:00Z",
    },
    {
      id: "task-3",
      title: "Develop Animated Timeline & Calendar Widgets",
      description: "Build an interactive, highly responsive timeline where designers and managers can visualize dates, view gantt columns, and enjoy clean enter-animations using motion.",
      priority: "medium",
      status: "todo",
      category: "Engineering",
      dueDate: "2026-06-03",
      assignedTo: "jordan",
      subtasks: [
        { id: "st-7", title: "Setup layout timelines with css flexbox patterns", completed: false },
        { id: "st-8", title: "Coordinate with Backend date YYYY-MM-DD formatting", completed: false },
      ],
      comments: [],
      createdAt: "2026-05-26T08:00:00Z",
      updatedAt: "2026-05-26T08:00:00Z",
    },
    {
      id: "task-4",
      title: "Analyze Competitor Workflows & UX Gaps",
      description: "Review current tracking solutions, evaluate common friction points in user task creation, and draft concrete improvement strategies for the team.",
      priority: "low",
      status: "done",
      category: "Research",
      dueDate: "2026-05-25",
      assignedTo: "alex",
      subtasks: [
        { id: "st-9", title: "Audit top 3 task management tools", completed: true },
        { id: "st-10", title: "Draft action points document", completed: true },
      ],
      comments: [],
      createdAt: "2026-05-24T09:00:00Z",
      updatedAt: "2026-05-25T17:00:00Z",
    }
  ];

  // Seed Activity logs
  let activities: ActivityLog[] = [
    {
      id: "act-1",
      userId: "alex",
      userName: "Alex Chen",
      userColor: "emerald",
      type: "create",
      text: "created the task: 'Design High-Fidelity Wireframes'",
      taskId: "task-1",
      taskTitle: "Design High-Fidelity Wireframes",
      createdAt: "2026-05-25T10:00:00Z",
    },
    {
      id: "act-2",
      userId: "taylor",
      userName: "Taylor Smith",
      userColor: "violet",
      type: "status_change",
      text: "moved 'Optimize Node State Manager & API proxies' to in_progress",
      taskId: "task-2",
      taskTitle: "Optimize Node State Manager & API proxies",
      createdAt: "2026-05-26T12:00:00Z",
    },
    {
      id: "act-3",
      userId: "morgan",
      userName: "Morgan Vance",
      userColor: "pink",
      type: "comment",
      text: "added a comment on: 'Design High-Fidelity Wireframes'",
      taskId: "task-1",
      taskTitle: "Design High-Fidelity Wireframes",
      createdAt: "2026-05-26T15:10:00Z",
    }
  ];

  // API Routes
  // 1. Users list
  app.get("/api/users", (req, res) => {
    res.json(users);
  });

  // 2. Activities list
  app.get("/api/activities", (req, res) => {
    res.json(activities);
  });

  // 3. Tasks list
  app.get("/api/tasks", (req, res) => {
    res.json(tasks);
  });

  // Create Task
  app.post("/api/tasks", (req, res) => {
    const { title, description, priority, status, category, dueDate, assignedTo, creatorId } = req.body;
    
    const creator = users.find(u => u.id === creatorId) || users[0];
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title || "Untitled Task",
      description: description || "",
      priority: (priority as TaskPriority) || "medium",
      status: (status as TaskStatus) || "todo",
      category: category || "General",
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      assignedTo: assignedTo || "alex",
      subtasks: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasks.push(newTask);

    // Save activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: creator.id,
      userName: creator.name,
      userColor: creator.id === "alex" ? "emerald" : creator.id === "jordan" ? "blue" : creator.id === "taylor" ? "violet" : "pink",
      type: "create",
      text: `created task: "${newTask.title}"`,
      taskId: newTask.id,
      taskTitle: newTask.title,
      createdAt: new Date().toISOString(),
    };
    activities.unshift(newAct);

    res.status(201).json(newTask);
  });

  // Update Task
  app.put("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, priority, status, category, dueDate, assignedTo, subtasks, userId } = req.body;

    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const originalTask = tasks[taskIndex];
    const updater = users.find(u => u.id === userId) || users[0];

    const updatedTask: Task = {
      ...originalTask,
      title: title !== undefined ? title : originalTask.title,
      description: description !== undefined ? description : originalTask.description,
      priority: priority !== undefined ? (priority as TaskPriority) : originalTask.priority,
      status: status !== undefined ? (status as TaskStatus) : originalTask.status,
      category: category !== undefined ? category : originalTask.category,
      dueDate: dueDate !== undefined ? dueDate : originalTask.dueDate,
      assignedTo: assignedTo !== undefined ? assignedTo : originalTask.assignedTo,
      subtasks: subtasks !== undefined ? subtasks : originalTask.subtasks,
      updatedAt: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;

    // Log Activity based on what changed
    let changeText = `updated "${updatedTask.title}"`;
    let type: ActivityLog["type"] = "update";

    if (originalTask.status !== updatedTask.status) {
      changeText = `moved "${updatedTask.title}" from ${originalTask.status} to ${updatedTask.status}`;
      type = "status_change";
    } else if (originalTask.assignedTo !== updatedTask.assignedTo) {
      const assignedUser = users.find(u => u.id === updatedTask.assignedTo);
      changeText = `assigned "${updatedTask.title}" to ${assignedUser ? assignedUser.name : "Unassigned"}`;
      type = "assign";
    }

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: updater.id,
      userName: updater.name,
      userColor: updater.id === "alex" ? "emerald" : updater.id === "jordan" ? "blue" : updater.id === "taylor" ? "violet" : "pink",
      type,
      text: changeText,
      taskId: id,
      taskTitle: updatedTask.title,
      createdAt: new Date().toISOString(),
    };
    activities.unshift(newAct);

    res.json(updatedTask);
  });

  // Delete Task
  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const deletedTask = tasks[taskIndex];
    const deleter = users.find(u => u.id === userId) || users[0];

    // Remove task
    tasks.splice(taskIndex, 1);

    // Record activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: deleter.id,
      userName: deleter.name,
      userColor: deleter.id === "alex" ? "emerald" : deleter.id === "jordan" ? "blue" : deleter.id === "taylor" ? "violet" : "pink",
      type: "delete",
      text: `deleted task: "${deletedTask.title}"`,
      taskId: id,
      taskTitle: deletedTask.title,
      createdAt: new Date().toISOString(),
    };
    activities.unshift(newAct);

    res.json({ message: "Task deleted successfully", id });
  });

  // Add Comment
  app.post("/api/tasks/:id/comments", (req, res) => {
    const { id } = req.params;
    const { text, userId } = req.body;

    const task = tasks.find(t => t.id === id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const commenter = users.find(u => u.id === userId) || users[0];
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: commenter.id,
      userName: commenter.name,
      userAvatar: commenter.avatar,
      text,
      createdAt: new Date().toISOString(),
    };

    task.comments.push(newComment);
    task.updatedAt = new Date().toISOString();

    // Record activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: commenter.id,
      userName: commenter.name,
      userColor: commenter.id === "alex" ? "emerald" : commenter.id === "jordan" ? "blue" : commenter.id === "taylor" ? "violet" : "pink",
      type: "comment",
      text: `commented on "${task.title}": "${text.length > 35 ? text.substring(0, 32) + '...' : text}"`,
      taskId: id,
      taskTitle: task.title,
      createdAt: new Date().toISOString(),
    };
    activities.unshift(newAct);

    res.status(201).json(newComment);
  });

  // Gemini suggested subtask checklist
  app.post("/api/gemini/suggest-subtasks", async (req, res) => {
    const { title, description } = req.body;
    try {
      const ai = getGeminiClient();
      const prompt = `Act as a professional agile project manager. Breakdown this task into 3-5 quick, actionable, granular checklist subtask titles.
Task Title: "${title}"
Task Description: "${description || 'None'}"

Provide your response strictly in JSON format as a list of strings matching the schema. Do not include extra commentary.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "An array of 3 to 5 clear subtask step titles."
          }
        }
      });

      const text = response.text || "[]";
      let checklist: string[] = JSON.parse(text.trim());
      
      // Map structures
      const subtasks: SubTask[] = checklist.map((item, index) => ({
        id: `st-gemini-${Date.now()}-${index}`,
        title: item,
        completed: false
      }));

      res.json(subtasks);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed generating AI suggest subtasks" });
    }
  });

  // Gemini task form auto-fill
  app.post("/api/gemini/auto-fill", async (req, res) => {
    const { prompt } = req.body;
    try {
      const ai = getGeminiClient();
      const fullPrompt = `The user typed a quick short task draft: "${prompt}"
Analyze this short description and extract or write a professional, elegant:
- title: concise human-written summary title of the task
- description: well-phrased human description containing core goals and expectations
- assignedTo: choose best candidate userId based on keywords. Options: 'alex' (product management, interviews, specs), 'jordan' (frontend, styling, animations, dashboard, react, screens), 'taylor' (backend, node, database, server, APIs, state managers), 'morgan' (design, wireframes, user experience, illustrations, Figma, UI/UX). If unclear, default to 'alex'.
- priority: choose 'low', 'medium', or 'high'.
- category: one suitable broad text keyword (e.g., 'Engineering', 'Design', 'Marketing', 'Research', 'Strategy').
- dueDate: suggested YYYY-MM-DD format (Current date is ${new Date().toISOString().split("T")[0]}). Return a date within a week.

Return strictly as single JSON object matching the requested schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              assignedTo: { type: Type.STRING, description: "Must be 'alex', 'jordan', 'taylor', or 'morgan'" },
              priority: { type: Type.STRING, description: "Must be 'low', 'medium', or 'high'" },
              category: { type: Type.STRING },
              dueDate: { type: Type.STRING, description: "YYYY-MM-DD" }
            },
            required: ["title", "description", "assignedTo", "priority", "category", "dueDate"]
          }
        }
      });

      const parsed = JSON.parse((response.text || "{}").trim());
      res.json(parsed);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed parsing with Gemini AI" });
    }
  });

  // Gemini standup summary
  app.post("/api/gemini/standup-summary", async (req, res) => {
    try {
      const ai = getGeminiClient();
      const tasksMetadata = tasks.map(t => ({
        title: t.title,
        priority: t.priority,
        status: t.status,
        category: t.category,
        dueDate: t.dueDate,
        assigneeName: users.find(u => u.id === t.assignedTo)?.name || "Unassigned",
        subtasksCompleted: t.subtasks.filter(s => s.completed).length,
        subtasksTotal: t.subtasks.length
      }));

      const prompt = `Act as an optimistic, encouraging Scrum Master & AI Project Assistant.
Here is the current team task list in our workspace:
${JSON.stringify(tasksMetadata, null, 2)}

Provide a beautiful, highly creative, and clear markdown Standup Summary report for the team. Include:
1. 🎉 Progress & Milestones (Highlight what is done or review)
2. 🔄 Currently Active Focus (What the team is actively developing)
3. ⚠️ Priorities and Crucial Dates (Remind members of high priority or upcoming items)
4. 💡 Smart Recommendations (Suggest what we should tackle next based on workloads or dependencies)

Keep the text brief, stylish, highly inspiring, with precise markdown formatting.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      res.json({ summary: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate standup report with Gemini AI." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
