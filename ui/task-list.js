import { html, render } from 'lit-html';

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

  let tasks = [];
  let activeTag = null;

  if (tasksData) {
    if (Array.isArray(tasksData.tasks)) {
      // Handle old, non-tagged format
      tasks = tasksData.tasks;
    } else {
      // Handle new, tagged format. Use the first tag found.
      const tagNames = Object.keys(tasksData);
      if (tagNames.length > 0) {
        activeTag = tagNames[0];
        tasks = tasksData[activeTag]?.tasks || [];
      }
    }
  }

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

  const tagHeader = activeTag ? `(from: ${activeTag})` : '';
  
  const headerTemplate = html`
    <div class="task-list-header">
      <h2>Tasks ${tagHeader} (${sortedTasks.length}/${tasks.length})</h2>
      <div class="task-list-controls">
        <select id="tasktab-status-filter" class="form-select select-sm">
          <option value="all" ?selected=${filters.status === 'all'}>All Statuses</option>
          <option value="pending" ?selected=${filters.status === 'pending'}>Pending</option>
          <option value="in-progress" ?selected=${filters.status === 'in-progress'}>In Progress</option>
          <option value="done" ?selected=${filters.status === 'done'}>Done</option>
        </select>
        <select id="tasktab-priority-filter" class="form-select select-sm">
          <option value="all" ?selected=${filters.priority === 'all'}>All Priorities</option>
          <option value="high" ?selected=${filters.priority === 'high'}>High</option>
          <option value="medium" ?selected=${filters.priority === 'medium'}>Medium</option>
          <option value="low" ?selected=${filters.priority === 'low'}>Low</option>
        </select>
         <select id="tasktab-sortby" class="form-select select-sm">
          <option value="id" ?selected=${filters.sortBy === 'id'}>Sort by ID</option>
          <option value="priority" ?selected=${filters.sortBy === 'priority'}>Sort by Priority</option>
        </select>
        <button id="tasktab-refresh-btn" class="btn-sm btn" aria-label="Refresh tasks">🔄</button>
      </div>
    </div>
  `;
  
  const bodyTemplate = sortedTasks.length === 0 
    ? html`<p>No tasks match the current filters.</p>`
    : html`
      <div class="task-list-body">
        ${sortedTasks.map(task => renderTaskItem(task))}
      </div>
    `;

  render(html`${headerTemplate}${bodyTemplate}`, container);
  
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