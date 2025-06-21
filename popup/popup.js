const cacheDurationInput = document.getElementById('cache-duration');
const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({ cacheDuration: 5 }, (items) => {
    cacheDurationInput.value = items.cacheDuration;
  });
});

// Save settings
saveBtn.addEventListener('click', () => {
  const cacheDuration = parseInt(cacheDurationInput.value, 10);
  
  if (cacheDuration && cacheDuration > 0) {
    chrome.storage.sync.set({ cacheDuration }, () => {
      statusMessage.textContent = 'Settings saved!';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 2000);
    });
  }
}); 