import { fetchTasks } from '../utils/task-fetcher.js';
import { renderTaskList, renderLoadingState, renderErrorState } from '../ui/task-list.js';
import taskListCss from '../ui/task-list.css?inline';

console.log("TaskTab content script loaded");

let tasksTab, counter;
let isRendering = false;

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
  // The main content area selector can differ between GitHub pages (e.g., code vs settings).
  // Try the repo-specific one first, then fall back to the more generic <main> element.
  return document.querySelector('.repository-content') || document.querySelector('main');
}

function clearRepoContentContainer() {
  const container = getRepoContentContainer();
  if (container) {
    container.innerHTML = '';
  }
}

function setActiveTab() {
  const isTasksPage = window.location.hash === '#tasks';
  if (tasksTab) {
    if (isTasksPage) {
      tasksTab.classList.add('selected');
    } else {
      tasksTab.classList.remove('selected');
    }
  }
  // De-select other tabs if we are on the tasks page
  document.querySelectorAll('.UnderlineNav-item').forEach(item => {
    if (item !== tasksTab) {
      if(isTasksPage) {
        item.classList.remove('selected');
      }
    }
  });
}

async function handleRefreshClick() {
  console.log("Manual refresh triggered.");
  await renderApp({ force: true });
}

async function renderApp({ force = false } = {}) {
  if (isRendering) return;
  isRendering = true;

  try {
    if (window.location.hash !== '#tasks') {
      setActiveTab();
      // On non-task views, we don't need to do anything with the content area.
      // GitHub's router will handle it. We just need to ensure our tab is not selected.
      return;
    }
    
    setActiveTab();
    const mainContent = getRepoContentContainer();
    if (!mainContent) return;

    clearRepoContentContainer();

    mainContent.appendChild(renderLoadingState());

    const result = await fetchTasks({ force });
    
    // We need to clear the container again to remove the loading state
    clearRepoContentContainer();

    let view;
    if (result.error) {
      view = renderErrorState(result.error);
    } else {
      view = renderTaskList(result.data, filters);
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
  } finally {
    isRendering = false;
  }
}

function handleLinkClick(event) {
  // We must stop the event from propagating to GitHub's own handlers
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  history.pushState({}, '', event.currentTarget.href);
  renderApp();
}

function injectTasksTab() {
  // Check if we are in a repository context by looking for a specific meta tag.
  if (!document.querySelector('meta[name="octolytics-dimension-repository_nwo"]')) {
    return; // Not on a repo page, do nothing.
  }

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
  
  // Construct the correct link to the repository root + #tasks
  const repoMeta = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');
  const repoPath = repoMeta ? `/${repoMeta.content}` : window.location.pathname.split('/').slice(0, 3).join('/');
  
  const tasksLink = document.createElement('a');
  tasksLink.href = `${repoPath}#tasks`;
  tasksLink.className = 'UnderlineNav-link';
  
  // Add Octicon for visual consistency
  const iconSvg = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-check-circle UnderlineNav-octicon">
    <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path>
  </svg>`;
  
  tasksLink.innerHTML = iconSvg + 'Tasks';
  
  tasksTab.appendChild(tasksLink);
  
  // Try to insert after "Pull requests" for a more natural position
  const pullRequestsTab = nav.querySelector('a[data-selected-links~="repo_pulls"]');
  if (pullRequestsTab && pullRequestsTab.parentElement) {
    pullRequestsTab.parentElement.after(tasksTab);
  } else {
    nav.appendChild(tasksTab);
  }

  renderApp();
}

function init() {
  loadFilters();
  
  // Initial injection
  injectTasksTab();
  
  // Listen for GitHub's turbo-frame navigation
  document.addEventListener('turbo:load', () => {
    // Re-inject the tab if it has been removed by GitHub's navigation
    injectTasksTab();
    // Re-render the app state, which will decide what to show based on the path
    renderApp();
  });
  
  // Listen for popstate events for back/forward browser navigation
  window.addEventListener('hashchange', renderApp);
}

init(); 