// Proof of Concept: Multi-site Detrumpifier Architecture

// Initialize at the top to avoid undefined errors
let detrumpifier = null;

// Helper function to extract text with proper spacing between elements
function extractTextWithSpaces(element) {
  if (!element) return '';
  
  // Always use TreeWalker to ensure proper spacing between elements
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textParts = [];
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text) {
      textParts.push(text);
    }
  }
  
  return textParts.join(' ');
}

// Site adapter definitions
const SITE_ADAPTERS = {
  'news.google.com': {
    name: 'Google News',
    enabled: true,
    selectors: {
      articles: [
        'article',
        'article[jscontroller]',
        'c-wiz article',
        '[role="article"]',
        'main article'
      ],
      titles: [
        'h3', 'h4', 'h2',
        '[role="heading"]',
        'a[href*="/read/"] h3',
        'a[href*="/articles/"] h3'
      ],
      container: 'main',
      exclude: []
    }
  },
  
  'cnn.com': {
    name: 'CNN',
    enabled: true,
    selectors: {
      articles: [
        '.card',
        'article.card',
        '.cd__wrapper',
        '.cn__column .cd__content',
        'div[data-component-name="card"]'
      ],
      titles: [
        '.card__headline-text',
        '.cd__headline-text',
        'h3.cd__headline',
        '.card__content h3'
      ],
      container: 'body',
      exclude: ['.ad-slot', '.cn__column--advertisement']
    }
  },
  
  'bbc.com': {
    name: 'BBC News',
    enabled: true,
    urlMatch: /\/news\//,  // Only run on /news/ paths
    selectors: {
      articles: [
        '.gs-c-promo',
        '.media',
        '.media__content',
        'article',
        '[data-testid="promo"]'
      ],
      titles: [
        '.gs-c-promo-heading__title',
        '.media__title a',
        '.media__link',
        'h3.gs-c-promo-heading__title'
      ],
      container: 'main, #root',
      exclude: ['.gs-c-promo--advertisement']
    }
  },
  
  'reuters.com': {
    name: 'Reuters',
    enabled: true,
    selectors: {
      articles: [
        'article',
        '[data-testid="article-card"]',
        '.story-card',
        '.article-wrap'
      ],
      titles: [
        '[data-testid="Heading"]',
        '.story-card__headline',
        'h3 a',
        'h2 a'
      ],
      container: 'main',
      exclude: []
    }
  },
  
  'nytimes.com': {
    name: 'The New York Times',
    enabled: false,
    selectors: {
      articles: [
        'article',
        '[data-testid="block"] li',
        'section li[class*="css-"]',
        'div[class*="story-wrapper"]',
        '.css-1l4spti',
        'section[data-block-tracking-id] article',
        'div.css-1cp3ece',  // Common story wrapper class
        // Target the audio section containers more broadly
        'h3:not(:empty)',  // All h3 elements with content
        // Links that look like audio/podcast content
        'a[href*="/audio/"]',
        'a[href*="/podcasts/"]',
        'a[href*="/interactive/"]',
        // Target divs containing images and text (common pattern)
        'div > img + div',
        'div > div > img + div',
        // Broad selector for content blocks
        'section > div > div > div'
      ],
      titles: [
        'h3', 'h2',
        '.indicate-hover',
        '[data-testid="headline"]',
        'h3[class*="indicate-hover"]',
        'p[class*="indicate-hover"]',
        'a h3',
        // Specific for audio titles
        'h3[class*="css-"]'
      ],
      container: 'main',
      exclude: ['.ad', '[data-testid="StandardAd"]', '.css-1ej70r5'] // Exclude ads
    }
  }
};

// Core filtering class
class MultiSiteDetrumpifier {
  constructor() {
    this.adapter = null;
    this.snipeDismissed = false;
    this.debounceTimer = null;
    this.observer = null;
    this.stats = { filtered: 0, total: 0 };
  }
  
  async init() {
    try {
      // Detect current site
      this.adapter = this.detectSite();
      
      if (!this.adapter) {
        console.log('Detrumpifier: Site not supported');
        return;
      }
      
      // Check user settings for site enablement
      const hostname = window.location.hostname.replace('www.', '');
      const settings = await chrome.storage.sync.get(['enabledSites']);
      const enabledSites = settings.enabledSites || {};
      
      // Use user preference if available, otherwise use default
      const isEnabled = enabledSites.hasOwnProperty(hostname) 
        ? enabledSites[hostname] 
        : this.adapter.enabled;
      
      if (!isEnabled) {
        console.log(`Detrumpifier: ${this.adapter.name} is disabled by user settings`);
        return;
      }
      
      console.log(`Detrumpifier: Active on ${this.adapter.name}`);
      
      // Start filtering
      this.filterArticles();
      this.setupObserver();
    } catch (error) {
      console.error('Detrumpifier initialization error:', error);
    }
  }
  
  detectSite() {
    const hostname = window.location.hostname.replace('www.', '');
    const adapter = SITE_ADAPTERS[hostname];
    
    // Check URL match if specified
    if (adapter && adapter.urlMatch) {
      if (!adapter.urlMatch.test(window.location.pathname)) {
        return null;
      }
    }
    
    return adapter;
  }
  
  findArticles() {
    if (!this.adapter || !this.adapter.selectors) return [];
    
    const { articles, container, exclude } = this.adapter.selectors;
    
    if (!articles || articles.length === 0) return [];
    
    const containerEl = container ? document.querySelector(container) : document;
    
    if (!containerEl) return [];
    
    let foundArticles = [];
    
    // Try each selector
    for (const selector of articles) {
      const elements = containerEl.querySelectorAll(selector);
      foundArticles.push(...elements);
    }
    
    // Remove duplicates and excluded elements
    foundArticles = [...new Set(foundArticles)].filter(article => {
      // Check if article is within an excluded container
      if (exclude && exclude.length > 0) {
        for (const excludeSelector of exclude) {
          if (article.closest(excludeSelector)) {
            return false;
          }
        }
      }
      return true;
    });
    
    return foundArticles;
  }
  
  extractTitle(article) {
    if (!this.adapter || !this.adapter.selectors || !this.adapter.selectors.titles) {
      return '';
    }
    
    const { titles } = this.adapter.selectors;
    
    if (!titles || titles.length === 0) return '';
    
    for (const selector of titles) {
      const element = article.querySelector(selector);
      if (element) {
        const title = extractTextWithSpaces(element);
        if (title) {
          return title;
        }
      }
    }
    
    // Fallback to first significant text
    const headings = article.querySelectorAll('h1, h2, h3, h4');
    for (const heading of headings) {
      const text = extractTextWithSpaces(heading);
      if (text.length > 10) {
        return text;
      }
    }
    
    return '';
  }
  
  containsTrumpReference(text) {
    const patterns = [
      /\bdonald\s+trump\b/i,
      /\btrump\b/i,
      /\bpresident\s+trump\b/i,
      /\bformer\s+president\s+trump\b/i,
      /\bex-president\s+trump\b/i,
      /\btrump's\b/i,
      /\btrump['']s\b/i
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }
  
  filterArticles() {
    const articles = this.findArticles();
    let filteredCount = 0;
    
    // Debug logging for NYTimes
    if (this.adapter.name === 'The New York Times' && articles.length === 0) {
      console.log('NYTimes: No articles found. Trying to debug...');
      console.log('Available article elements:', document.querySelectorAll('article').length);
      console.log('Sample HTML:', document.querySelector('main')?.innerHTML.substring(0, 500));
    }
    
    articles.forEach(article => {
      // Skip if already hidden
      if (article.style.display === 'none' || article.hasAttribute('data-detrumpified')) {
        return;
      }
      
      const title = this.extractTitle(article);
      // Extract text with proper spacing between elements
      const text = extractTextWithSpaces(article);
      
      if (this.containsTrumpReference(title) || this.containsTrumpReference(text)) {
        article.style.display = 'none';
        article.setAttribute('data-detrumpified', 'true');
        filteredCount++;
      }
    });
    
    this.stats.filtered += filteredCount;
    this.stats.total = articles.length;
    
    if (filteredCount > 0) {
      this.updateNotification();
    }
    
    console.log(`Detrumpifier: Filtered ${filteredCount} articles on ${this.adapter.name}`);
  }
  
  updateNotification() {
    if (this.snipeDismissed) return;
    
    let snipe = document.getElementById('detrumpifier-snipe');
    
    if (!snipe) {
      snipe = this.createNotification();
    }
    
    const message = snipe.querySelector('.detrumpifier-message');
    if (message) {
      message.textContent = `100% Trump-free on ${this.adapter.name} (${this.stats.filtered} filtered)`;
    }
  }
  
  createNotification() {
    const snipe = document.createElement('div');
    snipe.id = 'detrumpifier-snipe';
    
    // Add styles via stylesheet instead of inline
    if (!document.getElementById('detrumpifier-styles')) {
      const style = document.createElement('style');
      style.id = 'detrumpifier-styles';
      style.textContent = `
        #detrumpifier-snipe {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #0b57d0;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          z-index: 999999;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        #detrumpifier-snipe .detrumpifier-message {
          margin-right: 10px;
        }
        #detrumpifier-snipe .detrumpifier-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          padding: 0;
          margin-left: 10px;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        #detrumpifier-snipe .detrumpifier-close:hover {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
    
    const message = document.createElement('span');
    message.className = 'detrumpifier-message';
    message.textContent = `100% Trump-free on ${this.adapter.name} (${this.stats.filtered} filtered)`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'detrumpifier-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    
    closeBtn.addEventListener('click', () => {
      this.snipeDismissed = true;
      snipe.style.opacity = '0';
      setTimeout(() => snipe.remove(), 300);
    });
    
    snipe.appendChild(message);
    snipe.appendChild(closeBtn);
    document.body.appendChild(snipe);
    
    // Fade in
    setTimeout(() => {
      snipe.style.opacity = '1';
    }, 10);
    
    return snipe;
  }
  
  setupObserver() {
    this.observer = new MutationObserver(() => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.filterArticles();
      }, 1000);
    });
    
    const container = this.adapter.selectors.container 
      ? document.querySelector(this.adapter.selectors.container) 
      : document.body;
      
    if (container) {
      this.observer.observe(container, {
        childList: true,
        subtree: true
      });
    }
  }
  
  // Get current stats
  getStats() {
    return this.stats;
  }
}

// Create global instance
if (!detrumpifier) {
  detrumpifier = new MultiSiteDetrumpifier();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    detrumpifier.init();
  });
} else {
  detrumpifier.init();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'filterArticles') {
    detrumpifier.filterArticles();
    sendResponse(detrumpifier.getStats());
  } else if (request.action === 'getStats') {
    sendResponse(detrumpifier.getStats());
  } else if (request.action === 'getFilteredArticles') {
    // Works for all supported sites
    if (detrumpifier && detrumpifier.adapter) {
      const articles = detrumpifier.findArticles();
      const filteredArticles = [];
      
      articles.forEach((article, index) => {
        const title = detrumpifier.extractTitle(article);
        const text = extractTextWithSpaces(article);
        
        // Debug logging
        if (!title) {
          console.log(`Article ${index + 1} has no title. Article HTML:`, article.outerHTML.substring(0, 200));
        }
        
        if (!detrumpifier.containsTrumpReference(title) && !detrumpifier.containsTrumpReference(text)) {
          // Extract clean preview content
          let previewContent = text;
          if (previewContent.length > 200) {
            previewContent = previewContent.substring(0, 200) + '...';
          }
          
          // Find link
          const linkElement = article.querySelector('a[href*="/read/"]') || article.querySelector('a[href]');
          const link = linkElement ? linkElement.href : '';
          
          // If no title found, use first part of content as title
          let displayTitle = title;
          if (!displayTitle && previewContent) {
            // Take first 60 characters of content as title
            displayTitle = previewContent.substring(0, 60);
            if (previewContent.length > 60) {
              displayTitle += '...';
            }
          }
          
          filteredArticles.push({
            title: displayTitle || 'Article',
            content: previewContent,
            link: link,
            html: article.outerHTML
          });
        }
      });
      
      sendResponse({ articles: filteredArticles });
    } else {
      sendResponse({ articles: [] });
    }
  }
  
  return true; // Keep message channel open for async response
});

// Initialize detrumpifier
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    detrumpifier = new MultiSiteDetrumpifier();
    detrumpifier.init();
  });
} else {
  detrumpifier = new MultiSiteDetrumpifier();
  detrumpifier.init();
}