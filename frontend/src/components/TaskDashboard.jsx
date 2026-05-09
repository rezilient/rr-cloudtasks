import { useState, useEffect, useCallback } from "react";
import { listTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import SearchBar from "./SearchBar";

const STATUS_FILTERS = ["all", "todo", "in_progress", "blocked", "on_hold", "completed"];

export default function TaskDashboard({ user, onSignOut }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const data = await listTasks(params);
      setTasks(data.tasks);
    } catch {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = async (formData) => {
    await createTask(formData);
    setShowForm(false);
    fetchTasks();
  };

  const handleUpdate = async (taskId, formData) => {
    await updateTask(taskId, formData);
    setEditingTask(null);
    fetchTasks();
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    await deleteTask(taskId);
    fetchTasks();
  };

  const handleStatusChange = async (taskId, status) => {
    await updateTask(taskId, { status });
    fetchTasks();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>CloudTasks</h1>
          <span className="user-email">{user?.signInDetails?.loginId}</span>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + New Task
          </button>
          <button className="btn btn-ghost" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="controls">
          <SearchBar value={search} onChange={setSearch} />
          <div className="status-filters">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                className={`filter-btn ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {(showForm || editingTask) && (
          <TaskForm
            task={editingTask}
            onSubmit={editingTask ? (d) => handleUpdate(editingTask.taskId, d) : handleCreate}
            onCancel={() => { setShowForm(false); setEditingTask(null); }}
          />
        )}

        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={setEditingTask}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>
    </div>
  );
}
