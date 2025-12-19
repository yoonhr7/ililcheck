import { Task, Project, TaskGroup, Todo, Issue } from './types';
import {
  fetchProjects as fetchProjectsFromSupabase,
  createProject as createProjectInSupabase,
  updateProject as updateProjectInSupabase,
  deleteProject as deleteProjectFromSupabase,
  fetchTasksByProject as fetchTasksByProjectFromSupabase,
  createTask as createTaskInSupabase,
  updateTask as updateTaskInSupabase,
  updateTaskProgress as updateTaskProgressInSupabase,
  deleteTask as deleteTaskFromSupabase,
  createTodo as createTodoInSupabase,
  updateTodo as updateTodoInSupabase,
  deleteTodo as deleteTodoFromSupabase,
  fetchTodosByUser as fetchTodosByUserFromSupabase,
  fetchTodosByTask as fetchTodosByTaskFromSupabase,
  fetchIssuesByProject as fetchIssuesByProjectFromSupabase,
  createIssue as createIssueInSupabase,
  updateIssue as updateIssueInSupabase,
  deleteIssue as deleteIssueFromSupabase,
} from './supabase-api';

// Note: TaskGroup is deprecated with Supabase migration
// Tasks are now managed directly under projects

/**
 * 사용자의 특정 프로젝트 작업 가져오기
 */
export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  return await fetchTasksByProjectFromSupabase(projectId);
}

/**
 * 새 작업 생성
 */
export async function createTask(task: Omit<Task, 'id'>): Promise<string | null> {
  return await createTaskInSupabase(task);
}

/**
 * 작업 업데이트
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
  return await updateTaskInSupabase(taskId, updates);
}

/**
 * 작업 진행률만 업데이트 (최적화)
 */
export async function updateTaskProgress(taskId: string, progress: number): Promise<boolean> {
  return await updateTaskProgressInSupabase(taskId, progress);
}

/**
 * 작업 삭제
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  return await deleteTaskFromSupabase(taskId);
}

/**
 * 사용자의 모든 프로젝트 가져오기
 */
export async function fetchProjects(): Promise<Project[]> {
  return await fetchProjectsFromSupabase();
}

/**
 * 새 프로젝트 생성
 */
export async function createProject(project: Omit<Project, 'id'>): Promise<Project | null> {
  return await createProjectInSupabase(project);
}

/**
 * 프로젝트 업데이트
 */
export async function updateProject(projectId: string, updates: Partial<Project>): Promise<boolean> {
  return await updateProjectInSupabase(projectId, updates);
}

/**
 * 프로젝트 삭제
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  return await deleteProjectFromSupabase(projectId);
}

/**
 * 사용자의 모든 작업 그룹 가져오기
 * @deprecated TaskGroups are no longer used with Supabase. Tasks are managed directly under projects.
 */
export async function fetchTaskGroups(): Promise<TaskGroup[]> {
  console.warn('fetchTaskGroups is deprecated. Use fetchTasksByProject instead.');
  return [];
}

/**
 * 새 작업 그룹 생성
 * @deprecated TaskGroups are no longer used with Supabase. Use createTask instead.
 */
export async function createTaskGroup(group: Omit<TaskGroup, 'id' | 'tasks'>): Promise<string | null> {
  console.warn('createTaskGroup is deprecated. Use createTask instead.');
  return null;
}

/**
 * 새 할일 생성
 */
export async function createTodo(todo: Omit<Todo, 'id'>): Promise<string | null> {
  return await createTodoInSupabase(todo);
}

/**
 * 할일 업데이트
 */
export async function updateTodo(todoId: string, updates: Partial<Todo>): Promise<boolean> {
  return await updateTodoInSupabase(todoId, updates);
}

/**
 * 할일 삭제
 */
export async function deleteTodo(todoId: string): Promise<boolean> {
  return await deleteTodoFromSupabase(todoId);
}

/**
 * 사용자의 오늘 할일 가져오기
 */
export async function fetchTodayTodos(): Promise<Todo[]> {
  const allTodos = await fetchTodosByUserFromSupabase();
  const today = new Date().toISOString().split('T')[0];
  return allTodos.filter(todo => todo.dueDate === today);
}

/**
 * 사용자의 모든 할일 가져오기 (보류 포함)
 */
export async function fetchAllTodos(): Promise<Todo[]> {
  return await fetchTodosByUserFromSupabase();
}

/**
 * 모든 프로젝트의 통계 업데이트
 * @deprecated With Supabase, project statistics are automatically updated via database triggers
 */
export async function updateAllProjectStats(): Promise<void> {
  console.log('✅ 프로젝트 통계는 데이터베이스 트리거를 통해 자동으로 업데이트됩니다.');
}

/**
 * 프로젝트의 이슈 가져오기
 */
export async function fetchIssuesByProject(projectId: string): Promise<Issue[]> {
  return await fetchIssuesByProjectFromSupabase(projectId);
}

/**
 * 새 이슈 생성
 */
export async function createIssue(issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  return await createIssueInSupabase(issue);
}

/**
 * 이슈 업데이트
 */
export async function updateIssue(issueId: string, updates: Partial<Issue>): Promise<boolean> {
  return await updateIssueInSupabase(issueId, updates);
}

/**
 * 이슈 삭제
 */
export async function deleteIssue(issueId: string): Promise<boolean> {
  return await deleteIssueFromSupabase(issueId);
}
