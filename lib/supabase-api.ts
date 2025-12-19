import { supabase } from './supabase';
import type { Task, Project, Todo, Issue } from './types';
import type { Database } from './database.types';

type DbProject = Database['public']['Tables']['projects']['Row'];
type DbTask = Database['public']['Tables']['tasks']['Row'];
type DbTodo = Database['public']['Tables']['todos']['Row'];
type DbIssue = Database['public']['Tables']['issues']['Row'];

// ============================================
// 유틸리티 함수: DB 타입 → 앱 타입 변환
// ============================================

function dbProjectToProject(dbProject: DbProject): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    color: dbProject.color,
    description: dbProject.description || undefined,
    startDate: dbProject.start_date,
    endDate: dbProject.end_date,
    progress: dbProject.progress,
    daysRemaining: dbProject.days_remaining,
    category: dbProject.category,
    completedTasks: dbProject.completed_tasks || 0,
    totalTasks: dbProject.total_tasks || 0,
    completedTodos: dbProject.completed_todos || 0,
    totalTodos: dbProject.total_todos || 0,
  };
}

function dbTaskToTask(dbTask: DbTask, todos: Todo[] = []): Task {
  return {
    id: dbTask.id,
    projectId: dbTask.project_id,
    title: dbTask.title,
    status: dbTask.status,
    progress: dbTask.progress,
    dueDate: dbTask.due_date || undefined,
    startDate: dbTask.start_date || undefined,
    completedDate: dbTask.completed_date || undefined,
    createdAt: dbTask.created_at,
    order: dbTask.order || 0,
    todos,
  };
}

function dbTodoToTodo(dbTodo: DbTodo): Todo {
  return {
    id: dbTodo.id,
    taskId: dbTodo.task_id,
    title: dbTodo.title,
    status: dbTodo.status,
    progress: dbTodo.progress,
    dueDate: dbTodo.due_date || undefined,
    startDate: dbTodo.start_date || undefined,
    completedDate: dbTodo.completed_date || undefined,
    createdAt: dbTodo.created_at,
    updatedAt: dbTodo.updated_at,
    order: dbTodo.order || 0,
  };
}

function dbIssueToIssue(dbIssue: DbIssue): Issue {
  return {
    id: dbIssue.id,
    projectId: dbIssue.project_id,
    title: dbIssue.title,
    description: dbIssue.description,
    status: dbIssue.status,
    priority: dbIssue.priority,
    createdAt: dbIssue.created_at,
    updatedAt: dbIssue.updated_at,
    resolvedAt: dbIssue.resolved_at || undefined,
  };
}

// ============================================
// 현재 사용자 ID 가져오기
// ============================================

async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('로그인이 필요합니다.');
  }
  return user.id;
}

// ============================================
// 프로젝트 API
// ============================================

export async function fetchProjects(): Promise<Project[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(dbProjectToProject);
}

export async function createProject(project: Omit<Project, 'id'>): Promise<Project | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await (supabase
    .from('projects') as any)
    .insert({
      user_id: userId,
      name: project.name,
      description: project.description || null,
      color: project.color,
      start_date: project.startDate,
      end_date: project.endDate,
      progress: project.progress,
      days_remaining: project.daysRemaining,
      category: project.category,
    })
    .select()
    .single();

  if (error) {
    console.error('프로젝트 생성 실패:', error);
    return null;
  }

  return dbProjectToProject(data);
}

export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id'>>
): Promise<boolean> {
  const dbUpdates: any = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
  if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
  if (updates.daysRemaining !== undefined) dbUpdates.days_remaining = updates.daysRemaining;
  if (updates.category !== undefined) dbUpdates.category = updates.category;

  const { error } = await (supabase
    .from('projects') as any)
    .update(dbUpdates)
    .eq('id', projectId);

  if (error) {
    console.error('프로젝트 업데이트 실패:', error);
    return false;
  }

  return true;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('프로젝트 삭제 실패:', error);
    return false;
  }

  return true;
}

// ============================================
// 작업(Task) API
// ============================================

export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  const userId = await getCurrentUserId();

  // 작업과 할일을 함께 가져오기
  const { data: tasks, error: tasksError } = await (supabase
    .from('tasks') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .order('order', { ascending: true });

  if (tasksError) throw tasksError;

  // 모든 할일 가져오기
  const taskIds = tasks.map((t: any) => t.id);
  const { data: todos, error: todosError } = await (supabase
    .from('todos') as any)
    .select('*')
    .in('task_id', taskIds)
    .order('order', { ascending: true });

  if (todosError) throw todosError;

  // 작업별로 할일 그룹화
  const todosByTask = new Map<string, Todo[]>();
  todos.forEach((dbTodo: any) => {
    const todo = dbTodoToTodo(dbTodo);
    if (!todosByTask.has(todo.taskId)) {
      todosByTask.set(todo.taskId, []);
    }
    todosByTask.get(todo.taskId)!.push(todo);
  });

  return tasks.map((dbTask: any) => dbTaskToTask(dbTask, todosByTask.get(dbTask.id) || []));
}

export async function createTask(task: Omit<Task, 'id'>): Promise<string | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await (supabase
    .from('tasks') as any)
    .insert({
      user_id: userId,
      project_id: task.projectId,
      title: task.title,
      status: task.status,
      progress: task.progress,
      due_date: task.dueDate || null,
      start_date: task.startDate || null,
      completed_date: task.completedDate || null,
      order: task.order,
    })
    .select()
    .single();

  if (error) {
    console.error('작업 생성 실패:', error);
    return null;
  }

  return data.id;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
  const dbUpdates: any = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate || null;
  if (updates.completedDate !== undefined) dbUpdates.completed_date = updates.completedDate || null;
  if (updates.order !== undefined) dbUpdates.order = updates.order;

  const { error } = await (supabase
    .from('tasks') as any)
    .update(dbUpdates)
    .eq('id', taskId);

  if (error) {
    console.error('작업 업데이트 실패:', error);
    return false;
  }

  return true;
}

export async function updateTaskProgress(taskId: string, progress: number): Promise<boolean> {
  return updateTask(taskId, { progress });
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('작업 삭제 실패:', error);
    return false;
  }

  return true;
}

export async function updateTaskOrder(taskId: string, newOrder: number): Promise<boolean> {
  return updateTask(taskId, { order: newOrder });
}

// ============================================
// 할일(Todo) API
// ============================================

export async function createTodo(todo: Omit<Todo, 'id'>): Promise<string | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await (supabase
    .from('todos') as any)
    .insert({
      user_id: userId,
      task_id: todo.taskId,
      title: todo.title,
      status: todo.status,
      progress: todo.progress,
      due_date: todo.dueDate || null,
      start_date: todo.startDate || null,
      completed_date: todo.completedDate || null,
      order: todo.order,
    })
    .select()
    .single();

  if (error) {
    console.error('할일 생성 실패:', error);
    return null;
  }

  return data.id;
}

export async function updateTodo(todoId: string, updates: Partial<Todo>): Promise<boolean> {
  const dbUpdates: any = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate || null;
  if (updates.completedDate !== undefined) dbUpdates.completed_date = updates.completedDate || null;
  if (updates.order !== undefined) dbUpdates.order = updates.order;

  const { error } = await (supabase
    .from('todos') as any)
    .update(dbUpdates)
    .eq('id', todoId);

  if (error) {
    console.error('할일 업데이트 실패:', error);
    return false;
  }

  return true;
}

export async function deleteTodo(todoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', todoId);

  if (error) {
    console.error('할일 삭제 실패:', error);
    return false;
  }

  return true;
}

export async function updateTodoOrder(todoId: string, newOrder: number): Promise<boolean> {
  return updateTodo(todoId, { order: newOrder });
}

export async function fetchTodosByUser(): Promise<Todo[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(dbTodoToTodo);
}

export async function fetchTodosByTask(taskId: string): Promise<Todo[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .order('order', { ascending: true });

  if (error) throw error;
  return data.map(dbTodoToTodo);
}

// ============================================
// 이슈 API
// ============================================

export async function fetchIssuesByProject(projectId: string): Promise<Issue[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(dbIssueToIssue);
}

export async function createIssue(issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await (supabase
    .from('issues') as any)
    .insert({
      user_id: userId,
      project_id: issue.projectId,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      resolved_at: issue.resolvedAt || null,
    })
    .select()
    .single();

  if (error) {
    console.error('이슈 생성 실패:', error);
    return null;
  }

  return data.id;
}

export async function updateIssue(issueId: string, updates: Partial<Issue>): Promise<boolean> {
  const dbUpdates: any = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.resolvedAt !== undefined) dbUpdates.resolved_at = updates.resolvedAt || null;

  const { error } = await (supabase
    .from('issues') as any)
    .update(dbUpdates)
    .eq('id', issueId);

  if (error) {
    console.error('이슈 업데이트 실패:', error);
    return false;
  }

  return true;
}

export async function deleteIssue(issueId: string): Promise<boolean> {
  const { error } = await supabase
    .from('issues')
    .delete()
    .eq('id', issueId);

  if (error) {
    console.error('이슈 삭제 실패:', error);
    return false;
  }

  return true;
}

// ============================================
// 사용자 프로필 API
// ============================================

export async function createUserProfile(profile: {
  userId: string;
  username: string;
  email?: string;
  displayName?: string;
  provider?: string;
}): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('users') as any)
      .insert({
        user_id: profile.userId,
        username: profile.username,
        email: profile.email || null,
        display_name: profile.displayName || null,
        provider: profile.provider || 'email',
      });

    if (error) {
      console.error('사용자 프로필 생성 실패:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('사용자 프로필 생성 중 오류:', error);
    throw error;
  }
}

export async function updateUserProfile(updates: {
  username?: string;
  email?: string;
  displayName?: string;
}): Promise<boolean> {
  const userId = await getCurrentUserId();
  const dbUpdates: any = {};

  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.email !== undefined) dbUpdates.email = updates.email || null;
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName || null;

  const { error } = await (supabase
    .from('users') as any)
    .update(dbUpdates)
    .eq('user_id', userId);

  if (error) {
    console.error('사용자 프로필 업데이트 실패:', error);
    return false;
  }

  return true;
}
