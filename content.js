// Track if user has dismissed the snipe
let snipeDismissed = false;

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

// Function to check if text contains Trump references
function containsTrumpReference(text) {
  // Use word boundary regex patterns for more accurate matching
  const trumpPatterns = [
    /\bdonald\s+trump\b/i,
    /\btrump\b/i,
    /\bpresident\s+trump\b/i,
    /\bformer\s+president\s+trump\b/i,
    /\bex-president\s+trump\b/i,
    /\btrump's\b/i,
    /\btrump['']s\b/i  // Handle smart quotes
  ];
  
  return trumpPatterns.some(pattern => pattern.test(text));
}

// Common function to find articles on the page
function findArticles() {
  // Use stable selectors that are less likely to change
  const articleSelectors = [
    'article',  // Most semantic and stable
    'article[jscontroller]',  // Articles often have controllers
    'c-wiz article',  // c-wiz is a more stable Google component wrapper
    '[role="article"]',  // ARIA role if present
    'main article',  // Articles within main content
    // Fallback: look for common patterns in Google News structure
    'a[href*="/read/"] > div > div',  // Parent containers of read links
    'div[jscontroller] a[href*="/articles/"]',  // Containers with article links
  ];
  
  // Try each selector and return the first that finds articles
  for (const selector of articleSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Filter out any nested articles to avoid duplicates
      const uniqueArticles = Array.from(elements).filter(el => {
        return !el.parentElement.closest(selector);
      });
      if (uniqueArticles.length > 0) {
        console.log(`Found ${uniqueArticles.length} articles using selector: ${selector}`);
        return uniqueArticles;
      }
    }
  }
  console.log('No articles found with any selector');
  return [];
}

// Common function to extract article data
function extractArticleData(article) {
  // Use the helper function for consistent text extraction
  const textContent = extractTextWithSpaces(article);
  
  // Use stable selectors for title extraction
  const titleSelectors = [
    'h3',  // Most common heading level for article titles
    'h4',
    'h2',
    '[role="heading"]',  // ARIA role for headings
    'a[href*="/read/"] h3',  // Headings within read links
    'a[href*="/read/"] h4',
    'a[href*="/articles/"] h3',  // Headings within article links
    'a[href*="/articles/"] h4',
    'a[href][target="_blank"] > :first-child',  // First child of external links
    '[data-n-tid]',  // Google News tracking attribute (more stable than classes)
  ];
  
  let title = '';
  for (const selector of titleSelectors) {
    const titleElement = article.querySelector(selector);
    if (titleElement) {
      title = extractTextWithSpaces(titleElement);
      if (title) {
        break;
      }
    }
  }
  
  // If still no title, try to get first significant text
  if (!title) {
    const allText = article.querySelectorAll('*');
    for (const elem of allText) {
      const text = extractTextWithSpaces(elem);
      if (text.length > 20 && text.length < 200) {
        title = text;
        break;
      }
    }
  }
  
  // Use stable patterns for link extraction
  let link = '';
  
  // Try multiple strategies to find the link
  const linkSelectors = [
    'a[href*="/read/"]',  // Google News read links (most stable)
    'a[href*="/articles/"]',  // Article links
    'a[href][target="_blank"]',  // External links that open in new tab
    'a[href*="news.google.com"]',  // Internal Google News links
    'a[href]:not([href="#"]):not([href=""]):not([href^="javascript"])',  // Any valid link
  ];
  
  for (const selector of linkSelectors) {
    const linkElement = article.querySelector(selector);
    if (linkElement && linkElement.href) {
      link = linkElement.href;
      break;
    }
  }
  
  // If still no link, check parent element
  if (!link) {
    const parentLink = article.closest('a[href]:not([href="#"]):not([href=""])');
    if (parentLink) link = parentLink.href;
  }
  
  console.log('Extracted article data:', { title: title.substring(0, 50), hasLink: !!link });
  
  return { textContent, title, link, element: article };
}

// Function to create or update the corner snipe
function updateCornerSnipe(isFiltering, filteredCount) {
  let snipe = document.getElementById('detrumpifier-snipe');
  
  // Don't show if user has dismissed it
  if (snipeDismissed) {
    return;
  }
  
  if (isFiltering && filteredCount > 0) {
    if (!snipe) {
      // Create the snipe element
      snipe = document.createElement('div');
      snipe.id = 'detrumpifier-snipe';
      snipe.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #0b57d0;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: Roboto, Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        transition: opacity 0.3s ease-in-out;
      `;
      snipe.innerHTML = `
        <span style="margin-right: 25px;">Now 100% Trump-free</span>
        <button style="
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 4px;
          margin: -4px;
          opacity: 0.8;
          transition: opacity 0.2s;
        " aria-label="Dismiss">&times;</button>
      `;
      snipe.title = `${filteredCount} article${filteredCount !== 1 ? 's' : ''} filtered`;
      
      // Get the close button
      const closeButton = snipe.querySelector('button');
      
      // Add hover effect to snipe
      snipe.addEventListener('mouseenter', () => {
        snipe.style.backgroundColor = '#0842a0';
      });
      snipe.addEventListener('mouseleave', () => {
        snipe.style.backgroundColor = '#0b57d0';
      });
      
      // Add hover effect to close button
      closeButton.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        closeButton.style.opacity = '1';
      });
      closeButton.addEventListener('mouseleave', (e) => {
        e.stopPropagation();
        closeButton.style.opacity = '0.8';
      });
      
      // Click close button to dismiss
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        snipeDismissed = true;
        snipe.style.opacity = '0';
        setTimeout(() => snipe.remove(), 300);
      });
      
      // Start with opacity 0 for fade-in effect
      snipe.style.opacity = '0';
      document.body.appendChild(snipe);
      
      // Trigger fade-in
      setTimeout(() => {
        snipe.style.opacity = '1';
      }, 10);
    } else {
      // Update existing snipe
      snipe.title = `${filteredCount} article${filteredCount !== 1 ? 's' : ''} filtered`;
      snipe.style.opacity = '1';
    }
  } else if (snipe) {
    // Remove snipe if no filtering is happening
    snipe.style.opacity = '0';
    setTimeout(() => snipe.remove(), 300);
  }
}

// Function to filter articles on the current page
function filterCurrentPageArticles() {
  const articles = findArticles();
  let filteredCount = 0;
  let totalCount = articles.length;
  
  articles.forEach(article => {
    const { textContent, title } = extractArticleData(article);
    
    if (containsTrumpReference(textContent) || containsTrumpReference(title)) {
      article.style.display = 'none';
      filteredCount++;
    }
  });
  
  const stats = { filtered: filteredCount, total: totalCount };
  
  // Update corner snipe
  updateCornerSnipe(true, filteredCount);
  
  // Send stats update to popup if it's open
  chrome.runtime.sendMessage({ action: "statsUpdated", stats: stats }).catch(() => {
    // Ignore errors if popup is not open
  });
  
  return stats;
}

// Function to collect filtered articles for new tab
function collectFilteredArticles() {
  const articles = findArticles();
  const filteredArticles = [];
  
  console.log(`Collecting articles. Total found: ${articles.length}`);
  
  articles.forEach((article, index) => {
    const { textContent, title, link } = extractArticleData(article);
    
    const hasTrumpInContent = containsTrumpReference(textContent);
    const hasTrumpInTitle = containsTrumpReference(title);
    
    // Debug logging to see what text we're actually checking
    if (title.toLowerCase().includes('trump') || textContent.toLowerCase().includes('trump')) {
      console.log(`Article ${index + 1} - TRUMP FOUND:`, {
        title: title,
        titleHasTrump: hasTrumpInTitle,
        contentSnippet: textContent.substring(0, 200),
        contentHasTrump: hasTrumpInContent,
        hasLink: !!link
      });
    }
    
    if (!hasTrumpInContent && !hasTrumpInTitle) {
      // Extract clean preview content
      let previewContent = textContent;
      
      // Try to get article body text using stable selectors
      const bodySelectors = [
        'p',  // Paragraph tags are most stable
        'div[class*="content"]',  // Divs with content in class name
        'div[class*="body"]',  // Divs with body in class name
        'div[class*="description"]',  // Description containers
        'time + *',  // Element after time element (often the body text)
        '[role="article"] > div',  // Direct div children of article containers
      ];
      for (const selector of bodySelectors) {
        const bodyElement = article.querySelector(selector);
        if (bodyElement) {
          const extractedText = extractTextWithSpaces(bodyElement);
          if (extractedText.length > 20) {
            previewContent = extractedText;
            break;
          }
        }
      }
      
      // Clean up and truncate the preview - ensure we don't remove necessary spaces
      previewContent = previewContent.trim();
      if (previewContent.length > 200) {
        previewContent = previewContent.substring(0, 200) + '...';
      }
      
      filteredArticles.push({
        title: title || `Article ${filteredArticles.length + 1}`,
        content: previewContent,
        link: link,
        html: article.outerHTML
      });
    }
  });
  
  console.log(`Filtered articles collected: ${filteredArticles.length}`);
  return filteredArticles;
}

// Auto-filter on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    filterCurrentPageArticles();
  }, 1000);
});

// Debounce function to limit how often filtering runs
let debounceTimer;
function debounce(func, delay) {
  return function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
  };
}

// Also filter when page content changes (for dynamic loading)
const debouncedFilter = debounce(() => {
  filterCurrentPageArticles();
}, 1000);

const observer = new MutationObserver(() => {
  debouncedFilter();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "filterArticles") {
    const result = filterCurrentPageArticles();
    sendResponse(result);
  } else if (request.action === "getFilteredArticles") {
    const articles = collectFilteredArticles();
    sendResponse({ articles: articles });
  }
});

