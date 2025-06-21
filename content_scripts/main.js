import { fetchTasks } from '../utils/task-fetcher.js';
import { renderTaskList, renderLoadingState, renderErrorState } from '../ui/task-list.js';
import taskListCss from '../ui/task-list.css?inline';

console.log("TaskTab content script loaded");

let tasksTab, counter;

let filters = {
  status: 'all',
  priority: 'all',
  sortBy: 'id',
};

function loadFilters() {
  const savedFilters = localStorage.getItem('tasktab-filters');
  if (savedFilters) {
    filters = JSON.parse(savedFilters);
  }
}

function saveFilters() {
  localStorage.setItem('tasktab-filters', JSON.stringify(filters));
}

function getRepoContentContainer() {
  return document.querySelector('.repository-content');
}

function clearRepoContentContainer() {
  const container = getRepoContentContainer();
  if (container) {
    container.innerHTML = '';
  }
}

function setActiveTab(active) {
  if (tasksTab) {
    if (active) {
      tasksTab.classList.add('selected');
    } else {
      tasksTab.classList.remove('selected');
    }
  }
  // De-select other tabs
  document.querySelectorAll('.UnderlineNav-item').forEach(item => {
    if (item !== tasksTab) {
      item.classList.remove('selected');
    }
  });
}

async function handleRefreshClick() {
  console.log("Manual refresh triggered.");
  await renderApp({ force: true });
}

async function renderApp({ force = false } = {}) {
  if (window.location.hash !== '#tasks') {
    setActiveTab(false);
    // Let GitHub handle rendering for non-task views
    return;
  }
  
  setActiveTab(true);
  const mainContent = getRepoContentContainer();
  if (!mainContent) return;

  mainContent.appendChild(renderLoadingState());

  const result = await fetchTasks({ force });
  
  clearRepoContentContainer();

  let view;
  if (result.error) {
    view = renderErrorState(result.error);
    counter.textContent = 'X';
  } else {
    view = renderTaskList(result.data, filters);
    if (result.data && Array.isArray(result.data.tasks)) {
      // The count in the header is now handled by renderTaskList
    } else {
      counter.textContent = '0';
    }
  }
  mainContent.appendChild(view);

  // Add event listeners to controls
  const statusFilter = view.querySelector('#tasktab-status-filter');
  if (statusFilter) {
    statusFilter.onchange = (e) => {
      filters.status = e.target.value;
      saveFilters();
      renderApp();
    };
  }

  const priorityFilter = view.querySelector('#tasktab-priority-filter');
  if (priorityFilter) {
    priorityFilter.onchange = (e) => {
      filters.priority = e.target.value;
      saveFilters();
      renderApp();
    };
  }

  const sortBy = view.querySelector('#tasktab-sortby');
  if (sortBy) {
    sortBy.onchange = (e) => {
      filters.sortBy = e.target.value;
      saveFilters();
      renderApp();
    };
  }

  const refreshBtn = view.querySelector('#tasktab-refresh-btn');
  if (refreshBtn) {
    refreshBtn.onclick = handleRefreshClick;
  }
}

function injectTasksTab() {
  const nav = document.querySelector('.UnderlineNav-body');
  if (!nav || document.querySelector('#tasktab-nav-item')) {
    return;
  }

  const styleSheet = document.createElement("style");
  styleSheet.innerText = taskListCss;
  document.head.appendChild(styleSheet);

  tasksTab = document.createElement('li');
  tasksTab.className = 'UnderlineNav-item';
  tasksTab.id = 'tasktab-nav-item';
  
  const tasksLink = document.createElement('a');
  tasksLink.href = '#tasks';
  tasksLink.className = 'UnderlineNav-link';
  tasksLink.textContent = 'Tasks';
  
  counter = document.createElement('span');
  counter.className = 'Counter';
  counter.textContent = '...';
  tasksLink.appendChild(counter);

  tasksTab.appendChild(tasksLink);
  nav.appendChild(tasksTab);

  // Initial render based on hash
  renderApp();
}

function init() {
  loadFilters();
  // Initial injection
  injectTasksTab();
  
  // Listen for GitHub's dynamic navigation
  const observer = new MutationObserver(() => {
    injectTasksTab();
    renderApp(); // This will use cache unless expired
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Listen for hash changes for back/forward navigation
  window.addEventListener('hashchange', renderApp);
}

init(); 