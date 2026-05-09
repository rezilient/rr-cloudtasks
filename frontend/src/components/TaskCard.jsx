const STATUSES = ["todo", "in_progress", "blocked", "on_hold", "completed"];

const STATUS_COLORS = {
  todo: "#6b7280",
  in_progress: "#3b82f6",
  blocked: "#ef4444",
  on_hold: "#f59e0b",
  completed: "#10b981",
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const color = STATUS_COLORS[task.status] || "#6b7280";

  return (
    <div className="task-card" style={{ borderLeftColor: color }}>
      <div className="task-card-header">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-actions">
          <button className="btn btn-sm" onClick={() => onEdit(task)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(task.taskId)}>Delete</button>
        </div>
      </div>
      {task.description && <p className="task-description">{task.description}</p>}
      <div className="task-card-footer">
        <select
          className="status-select"
          value={task.status}
          style={{ borderColor: color, color }}
          onChange={(e) => onStatusChange(task.taskId, e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <span className="task-date">
          {new Date(task.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
