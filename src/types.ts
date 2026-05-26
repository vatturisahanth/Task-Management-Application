export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  dueDate: string;
  assignedTo: string; // User ID
  subtasks: SubTask[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  type: 'create' | 'update' | 'delete' | 'comment' | 'status_change' | 'assign';
  text: string;
  taskId: string;
  taskTitle: string;
  createdAt: string;
}
