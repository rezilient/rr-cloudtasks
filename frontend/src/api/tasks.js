import { fetchAuthSession } from "aws-amplify/auth";

const API_URL = import.meta.env.VITE_API_URL;
const isLocal = import.meta.env.VITE_LOCAL_DEV === "true";

async function authHeaders() {
  if (isLocal) {
    return {
      "Content-Type": "application/json",
      "x-mock-user-id": "local-dev-user",
    };
  }
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function listTasks(params = {}) {
  const headers = await authHeaders();
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/tasks${query ? `?${query}` : ""}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(data) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(taskId, data) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(taskId) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete task");
}
