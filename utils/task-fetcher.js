async function getCacheDuration() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ cacheDuration: 5 }, (items) => {
      resolve(items.cacheDuration * 60 * 1000); // convert minutes to ms
    });
  });
}

/**
 * Fetches and parses the .task.json file from the current GitHub repository.
 * Implements sessionStorage to cache the tasks for a session.
 * @returns {Promise<{data: Object}|{error: string}>} A promise that resolves to an object with either the task data or an error key.
 */
export async function fetchTasks({ force = false } = {}) {
  const repoMeta = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');
  if (!repoMeta) {
    return { error: 'not_repo' };
  }
  const [owner, repo] = repoMeta.content.split('/');
  
  const cacheKey = `tasktab-${owner}-${repo}`;
  const cacheDurationMs = await getCacheDuration();

  if (!force) {
    const cachedItem = sessionStorage.getItem(cacheKey);
    if (cachedItem) {
      try {
        const { timestamp, data } = JSON.parse(cachedItem);
        if (Date.now() - timestamp < cacheDurationMs) {
          console.log("Loading tasks from fresh cache.");
          return { data };
        }
      } catch (e) {
        // Clear corrupted cache and re-fetch
        sessionStorage.removeItem(cacheKey);
      }
    }
  }

  const defaultBranch = 'main'; 
  const taskJsonUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/.taskmaster/tasks/tasks.json`;

  try {
    const response = await fetch(taskJsonUrl);

    if (response.status === 404) {
      return { error: 'not_found' };
    }

    if (!response.ok) {
      return { error: 'network_error' };
    }

    const tasks = await response.json();
    
    if (!tasks || typeof tasks !== 'object') {
      return { error: 'parse_error' };
    }

    sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: tasks }));

    return { data: tasks };
  } catch (error) {
    console.error("Error fetching or parsing .task.json:", error);
    if (error instanceof SyntaxError) {
      return { error: 'parse_error' };
    }
    return { error: 'network_error' };
  }
} 