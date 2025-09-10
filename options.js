// Options page functionality for Detrumpifier

// Default settings
const DEFAULT_SETTINGS = {
  enabledSites: {
    'news.google.com': true,
    'cnn.com': false,
    'bbc.com': false,
    'reuters.com': false,
    'nytimes.com': false
  },
  customKeywords: [],
  stats: {
    totalFiltered: 0,
    filteredToday: 0,
    lastResetDate: new Date().toDateString()
  }
};

// Load settings when page loads
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initializeEventListeners();
  updateActiveSitesCount();
});

// Load settings from Chrome storage
async function loadSettings() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  
  // Update toggles based on saved settings
  for (const [site, enabled] of Object.entries(settings.enabledSites)) {
    const toggle = document.querySelector(`[data-site="${site}"]`);
    if (toggle && enabled) {
      toggle.classList.add('active');
    }
  }
  
  // Load custom keywords
  const keywordsTextarea = document.querySelector('.custom-keywords');
  if (settings.customKeywords && settings.customKeywords.length > 0) {
    keywordsTextarea.value = settings.customKeywords.join('\n');
  }
  
  // Update stats
  updateStats(settings.stats);
}

// Save settings to Chrome storage
async function saveSettings() {
  const enabledSites = {};
  document.querySelectorAll('.toggle').forEach(toggle => {
    const site = toggle.dataset.site;
    enabledSites[site] = toggle.classList.contains('active');
  });
  
  const keywordsTextarea = document.querySelector('.custom-keywords');
  const customKeywords = keywordsTextarea.value
    .split('\n')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);
  
  await chrome.storage.sync.set({
    enabledSites,
    customKeywords
  });
  
  // Notify content scripts of settings change
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && isEnabledSite(tab.url)) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsUpdated',
          enabledSites,
          customKeywords
        }).catch(() => {
          // Ignore errors for tabs without content script
        });
      }
    });
  });
  
  // Show save confirmation
  showNotification('Settings saved successfully!');
}

// Initialize event listeners
function initializeEventListeners() {
  // Toggle functionality
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
      updateActiveSitesCount();
      saveSettings();
    });
  });
  
  // Save button
  const saveButton = document.querySelector('.button:not(.button-secondary)');
  if (saveButton) {
    saveButton.addEventListener('click', saveSettings);
  }
  
  // Export settings button
  const buttons = document.querySelectorAll('.button-secondary');
  if (buttons.length >= 1) {
    buttons[0].addEventListener('click', exportSettings);
  }
  
  // Reset to defaults button
  if (buttons.length >= 2) {
    buttons[1].addEventListener('click', resetToDefaults);
  }
  
  // Auto-save custom keywords after typing stops
  const keywordsTextarea = document.querySelector('.custom-keywords');
  let keywordTimeout;
  keywordsTextarea.addEventListener('input', () => {
    clearTimeout(keywordTimeout);
    keywordTimeout = setTimeout(saveSettings, 1000);
  });
}

// Update active sites count
function updateActiveSitesCount() {
  const activeCount = document.querySelectorAll('.toggle.active').length;
  const totalCount = document.querySelectorAll('.toggle').length;
  document.querySelector('.stat-row:last-child .stat-value').textContent = `${activeCount} of ${totalCount}`;
}

// Update stats display
function updateStats(stats) {
  if (!stats) return;
  
  // Check if we need to reset daily count
  const today = new Date().toDateString();
  if (stats.lastResetDate !== today) {
    stats.filteredToday = 0;
    stats.lastResetDate = today;
    chrome.storage.sync.set({ stats });
  }
  
  document.querySelector('.stat-row:nth-child(1) .stat-value').textContent = 
    stats.totalFiltered.toLocaleString();
  document.querySelector('.stat-row:nth-child(2) .stat-value').textContent = 
    stats.filteredToday.toLocaleString();
}

// Export settings
async function exportSettings() {
  const settings = await chrome.storage.sync.get(null);
  const dataStr = JSON.stringify(settings, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `detrumpifier-settings-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  showNotification('Settings exported successfully!');
}

// Reset to defaults
async function resetToDefaults() {
  if (confirm('Are you sure you want to reset all settings to defaults? This will clear your custom keywords and stats.')) {
    await chrome.storage.sync.clear();
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    location.reload();
  }
}

// Check if URL matches enabled sites
function isEnabledSite(url) {
  try {
    const hostname = new URL(url).hostname;
    const enabledSites = [
      'news.google.com',
      'cnn.com',
      'bbc.com',
      'reuters.com',
      'nytimes.com'
    ];
    return enabledSites.some(site => hostname.includes(site));
  } catch {
    return false;
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0b57d0;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}