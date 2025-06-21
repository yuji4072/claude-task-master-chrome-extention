import { html, render } from 'lit-html';
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';

function getStatusEmoji(status) {
  switch (status.toLowerCase()) {
    case 'done':
      return '✅';
    case 'in-progress':
      return '⏳';
    case 'pending':
    default:
      return '◻️';
  }
}

function getPriorityClass(priority) {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'task-priority-high';
    case 'medium':
      return 'task-priority-medium';
    case 'low':
      return 'task-priority-low';
    default:
      return '';
  }
}

function renderTaskItem(task) {
  return html`
    <div class="task-item">
      <span class="task-status">${getStatusEmoji(task.status)}</span>
      <span class="task-title">${task.id}: ${task.title}</span>
      <span class="task-priority ${getPriorityClass(task.priority)}">${task.priority}</span>
    </div>
  `;
}

export function renderTaskList(tasksData, filters) {
  const container = document.createElement('div');
  container.className = 'tasktab-container';

  const tasks = tasksData?.tasks || [];

  // Apply filters
  const filteredTasks = tasks
    .filter(task => filters.status === 'all' || task.status === filters.status)
    .filter(task => filters.priority === 'all' || task.priority === filters.priority);

  // Apply sorting
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const sortedTasks = filteredTasks.sort((a, b) => {
    if (filters.sortBy === 'priority') {
      return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    }
    // Default sort by ID
    return a.id - b.id;
  });

  const header = `
    <div class="task-list-header">
      <h2>Tasks (${sortedTasks.length}/${tasks.length})</h2>
      <div class="task-list-controls">
        <select id="tasktab-status-filter" class="form-select select-sm">
          <option value="all" ${filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
          <option value="pending" ${filters.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="in-progress" ${filters.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${filters.status === 'done' ? 'selected' : ''}>Done</option>
        </select>
        <select id="tasktab-priority-filter" class="form-select select-sm">
          <option value="all" ${filters.priority === 'all' ? 'selected' : ''}>All Priorities</option>
          <option value="high" ${filters.priority === 'high' ? 'selected' : ''}>High</option>
          <option value="medium" ${filters.priority === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="low" ${filters.priority === 'low' ? 'selected' : ''}>Low</option>
        </select>
         <select id="tasktab-sortby" class="form-select select-sm">
          <option value="id" ${filters.sortBy === 'id' ? 'selected' : ''}>Sort by ID</option>
          <option value="priority" ${filters.sortBy === 'priority' ? 'selected' : ''}>Sort by Priority</option>
        </select>
        <button id="tasktab-refresh-btn" class="btn-sm btn" aria-label="Refresh tasks">🔄</button>
      </div>
    </div>
  `;

  if (sortedTasks.length === 0) {
    container.innerHTML = header + '<p>No tasks match the current filters.</p>';
    return container;
  }

  render(
    html`
      ${header}
      <div class="task-list-body">
        ${virtualize({
          items: sortedTasks,
          renderItem: renderTaskItem,
        })}
      </div>
    `,
    container
  );
  
  return container;
}

export function renderErrorState(errorType) {
  const container = document.createElement('div');
  container.className = 'tasktab-container';
  let message = 'An unknown error occurred.';
  switch (errorType) {
    case 'not_found':
      message = 'No .task.json file found in the main branch of this repository.';
      break;
    case 'parse_error':
      message = 'Failed to parse .task.json. The file may be malformed.';
      break;
    case 'network_error':
      message = 'A network error occurred while trying to fetch the tasks file.';
      break;
  }
  container.innerHTML = `
    <div class="task-list-header">
      <h2>Tasks</h2>
      <button id="tasktab-refresh-btn" class="btn-sm btn" aria-label="Refresh tasks">🔄</button>
    </div>
    <p>${message}</p>
  `;
  return container;
}

export function renderLoadingState() {
  const container = document.createElement('div');
  container.className = 'tasktab-container';
  container.innerHTML = '<div class="task-list-header"><h2>Tasks</h2></div><p>Loading tasks...</p>';
  return container;
} 