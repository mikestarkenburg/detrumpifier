document.addEventListener('DOMContentLoaded', function() {
  const filterBtn = document.getElementById('filterBtn');
  const newTabBtn = document.getElementById('newTabBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const filteredCount = document.getElementById('filteredCount');
  const totalCount = document.getElementById('totalCount');
  const siteName = document.getElementById('siteName');
  const filterStatus = document.getElementById('filterStatus');
  
  // Supported sites configuration
  const SUPPORTED_SITES = {
    'news.google.com': { name: 'Google News', enabled: true },
    'cnn.com': { name: 'CNN', enabled: true },
    'www.cnn.com': { name: 'CNN', enabled: true },
    'bbc.com': { name: 'BBC News', enabled: true },
    'www.bbc.com': { name: 'BBC News', enabled: true },
    'reuters.com': { name: 'Reuters', enabled: true },
    'www.reuters.com': { name: 'Reuters', enabled: true },
    'nytimes.com': { name: 'The New York Times', enabled: false },
    'www.nytimes.com': { name: 'The New York Times', enabled: false }
  };

  // Check current site
  chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
    const currentTab = tabs[0];
    const url = new URL(currentTab.url);
    const hostname = url.hostname;
    
    const siteConfig = SUPPORTED_SITES[hostname];
    
    if (siteConfig) {
      siteName.textContent = siteConfig.name;
      
      // Check user settings for actual enabled status
      const hostnameKey = hostname.replace('www.', '');
      const settings = await chrome.storage.sync.get(['enabledSites']);
      const enabledSites = settings.enabledSites || {};
      
      // Use user preference if available, otherwise use default
      const isEnabled = enabledSites.hasOwnProperty(hostnameKey) 
        ? enabledSites[hostnameKey] 
        : siteConfig.enabled;
      
      filterStatus.textContent = isEnabled ? 'Active' : 'Disabled';
      filterStatus.className = isEnabled ? 'status-value' : 'status-value inactive';
      
      if (!isEnabled) {
        filterBtn.disabled = true;
        newTabBtn.disabled = true;
        filterBtn.querySelector('.btn-text').textContent = 'Enable in settings';
        newTabBtn.querySelector('.btn-text').textContent = 'Enable in settings';
      } else {
        // Get initial status for enabled sites
        updateStatus();
      }
    } else {
      siteName.textContent = 'Not supported';
      filterStatus.textContent = 'N/A';
      filterStatus.className = 'status-value inactive';
      filterBtn.disabled = true;
      newTabBtn.disabled = true;
      filterBtn.querySelector('.btn-text').textContent = 'Site not supported';
      newTabBtn.querySelector('.btn-text').textContent = 'Site not supported';
    }
  });

  // Filter current page
  filterBtn.addEventListener('click', function() {
    if (filterBtn.disabled) return;
    
    filterBtn.classList.add('loading');
    filterBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "filterArticles" }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError.message);
          alert('Content script not loaded. Please refresh the page and try again.');
        } else if (response) {
          filteredCount.textContent = response.filtered;
          totalCount.textContent = response.total;
        }
        
        filterBtn.classList.remove('loading');
        filterBtn.disabled = false;
      });
    });
  });

  // Open new tab with filtered results
  newTabBtn.addEventListener('click', function() {
    if (newTabBtn.disabled) return;
    
    newTabBtn.classList.add('loading');
    newTabBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      
      chrome.tabs.sendMessage(currentTab.id, { action: "getFilteredArticles" }, function(response) {
        if (response && response.articles) {
          // Store articles in chrome storage
          chrome.storage.local.set({ 
            filteredArticles: response.articles,
            sourceTabId: currentTab.id 
          }, function() {
            // Open filtered results page
            chrome.tabs.create({ url: 'filtered_results.html' });
          });
        }
        
        newTabBtn.classList.remove('loading');
        newTabBtn.disabled = false;
      });
    });
  });
  
  // Open settings
  settingsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Update status from content script
  function updateStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      // Request current stats from content script
      chrome.tabs.sendMessage(tabs[0].id, { action: "getStats" }, function(response) {
        // Check for errors
        if (chrome.runtime.lastError) {
          // Content script not loaded yet
          console.log('Content script not loaded:', chrome.runtime.lastError.message);
          filteredCount.textContent = '0';
          totalCount.textContent = '0';
        } else if (response) {
          filteredCount.textContent = response.filtered || '0';
          totalCount.textContent = response.total || '0';
        } else {
          // No response
          filteredCount.textContent = '0';
          totalCount.textContent = '0';
        }
      });
    });
  }
  
  // Listen for stats updates from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "statsUpdated" && request.stats) {
      filteredCount.textContent = request.stats.filtered;
      totalCount.textContent = request.stats.total;
    }
  });
});