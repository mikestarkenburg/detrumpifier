javascript:(function(){
  /* Detrumpifier Bookmarklet v3 - Multi-site support */
  let snipeDismissed = false;
  let debounceTimer;
  
  /* Site adapters - simplified from extension */
  const SITE_ADAPTERS = {
    'news.google.com': {
      name: 'Google News',
      selectors: {
        articles: ['article', 'article[jscontroller]', 'c-wiz article', '[role="article"]', 'main article'],
        titles: ['h3', 'h4', 'h2', '[role="heading"]', 'a[href*="/read/"] h3', 'a[href*="/articles/"] h3']
      }
    },
    'cnn.com': {
      name: 'CNN',
      selectors: {
        articles: ['.card', 'article.card', '.cd__wrapper', '.cn__column .cd__content', 'div[data-component-name="card"]'],
        titles: ['.card__headline-text', '.cd__headline-text', 'h3.cd__headline', '.card__content h3']
      }
    },
    'bbc.com': {
      name: 'BBC News',
      selectors: {
        articles: ['.gs-c-promo', '.media', '.media__content', 'article', '[data-testid="promo"]'],
        titles: ['.gs-c-promo-heading__title', '.media__title a', '.media__link', 'h3.gs-c-promo-heading__title']
      }
    },
    'reuters.com': {
      name: 'Reuters',
      selectors: {
        articles: ['article', '[data-testid="article-card"]', '.story-card', '.article-wrap'],
        titles: ['[data-testid="Heading"]', '.story-card__headline', 'h3 a', 'h2 a']
      }
    },
    'nytimes.com': {
      name: 'The New York Times',
      selectors: {
        articles: ['article', '[data-testid="block"] li', 'section li[class*="css-"]', 'div[class*="story-wrapper"]', '.css-1l4spti', 'h3:not(:empty)', 'a[href*="/audio/"]', 'a[href*="/podcasts/"]'],
        titles: ['h3', 'h2', '.indicate-hover', '[data-testid="headline"]', 'h3[class*="indicate-hover"]', 'p[class*="indicate-hover"]', 'a h3']
      }
    }
  };
  
  function detectSite() {
    const hostname = window.location.hostname.replace('www.', '');
    return SITE_ADAPTERS[hostname];
  }
  
  function extractTextWithSpaces(element) {
    if (!element) return '';
    
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
  
  function containsTrumpReference(text) {
    const patterns = [
      /\bdonald\s+trump\b/i,
      /\btrump\b/i,
      /\bpresident\s+trump\b/i,
      /\bformer\s+president\s+trump\b/i,
      /\bex-president\s+trump\b/i,
      /\btrump's\b/i,
      /\btrump['']s\b/i
    ];
    return patterns.some(p => p.test(text));
  }
  
  function findArticles(adapter) {
    if (!adapter || !adapter.selectors) return [];
    
    const selectors = adapter.selectors.articles;
    let foundArticles = [];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      foundArticles.push(...elements);
    }
    
    /* Remove duplicates */
    return [...new Set(foundArticles)];
  }
  
  function extractTitle(article, adapter) {
    if (!adapter || !adapter.selectors) return '';
    
    const titleSelectors = adapter.selectors.titles;
    
    for (const selector of titleSelectors) {
      const el = article.querySelector(selector);
      if (el) {
        const title = extractTextWithSpaces(el);
        if (title) return title;
      }
    }
    
    /* Fallback: first significant text */
    const headings = article.querySelectorAll('h1, h2, h3, h4');
    for (const heading of headings) {
      const text = extractTextWithSpaces(heading);
      if (text.length > 10) {
        return text;
      }
    }
    
    return '';
  }
  
  function filterArticles() {
    const adapter = detectSite();
    if (!adapter) {
      console.log('Detrumpifier: Site not supported');
      return;
    }
    
    const articles = findArticles(adapter);
    let count = 0;
    
    articles.forEach(article => {
      if (article.style.display === 'none' || article.hasAttribute('data-detrumpified')) return;
      
      const title = extractTitle(article, adapter);
      const text = extractTextWithSpaces(article);
      
      if (containsTrumpReference(title) || containsTrumpReference(text)) {
        article.style.display = 'none';
        article.setAttribute('data-detrumpified', 'true');
        count++;
      }
    });
    
    if (count > 0 && !snipeDismissed) {
      showNotification(count, adapter.name);
    }
    
    console.log(`Detrumpifier: Filtered ${count} articles on ${adapter.name}`);
  }
  
  function showNotification(count, siteName) {
    let snipe = document.getElementById('detrumpifier-snipe');
    if (snipe) {
      snipe.querySelector('span').textContent = `100% Trump-free on ${siteName} (${count} filtered)`;
      return;
    }
    
    snipe = document.createElement('div');
    snipe.id = 'detrumpifier-snipe';
    snipe.style.cssText = 'position:fixed;top:20px;right:20px;background:#0b57d0;color:white;padding:12px 20px;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;font-weight:500;box-shadow:0 2px 8px rgba(0,0,0,0.2);z-index:9999;opacity:0;transition:opacity 0.3s;';
    
    const span = document.createElement('span');
    span.style.marginRight = '25px';
    span.textContent = `100% Trump-free on ${siteName} (${count} filtered)`;
    
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'position:absolute;top:50%;right:8px;transform:translateY(-50%);background:none;border:none;color:white;cursor:pointer;font-size:16px;line-height:1;padding:4px;margin:-4px;opacity:0.8;transition:opacity 0.2s;';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    
    closeBtn.onmouseover = function() { this.style.opacity = '1'; };
    closeBtn.onmouseout = function() { this.style.opacity = '0.8'; };
    closeBtn.onclick = function() {
      snipeDismissed = true;
      snipe.style.opacity = '0';
      setTimeout(() => snipe.remove(), 300);
    };
    
    snipe.appendChild(span);
    snipe.appendChild(closeBtn);
    document.body.appendChild(snipe);
    
    /* Fade in */
    setTimeout(() => { snipe.style.opacity = '1'; }, 10);
  }
  
  /* Initial filter */
  filterArticles();
  
  /* Monitor with debouncing */
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filterArticles, 1000);
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  console.log('Detrumpifier bookmarklet v3 loaded - multi-site support');
})();