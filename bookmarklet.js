javascript:(function(){
  /* Detrumpifier Bookmarklet - Click to filter Trump articles */
  let snipeDismissed = false;
  
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
  
  function filterArticles() {
    const articles = document.querySelectorAll('article, [role="article"], main article');
    let count = 0;
    
    articles.forEach(article => {
      const text = article.innerText || article.textContent || '';
      if (containsTrumpReference(text)) {
        article.style.display = 'none';
        count++;
      }
    });
    
    if (count > 0 && !snipeDismissed) {
      showNotification(count);
    }
  }
  
  function showNotification(count) {
    let snipe = document.getElementById('detrumpifier-snipe');
    if (snipe) snipe.remove();
    
    snipe = document.createElement('div');
    snipe.id = 'detrumpifier-snipe';
    snipe.style.cssText = 'position:fixed;top:20px;right:20px;background:#0b57d0;color:white;padding:12px 20px;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;font-weight:500;box-shadow:0 2px 8px rgba(0,0,0,0.2);z-index:9999;transition:opacity 0.3s;';
    snipe.innerHTML = '<span style="margin-right:25px;">Now 100% Trump-free</span><button style="position:absolute;top:50%;right:8px;transform:translateY(-50%);background:none;border:none;color:white;cursor:pointer;font-size:16px;line-height:1;padding:4px;margin:-4px;opacity:0.8;transition:opacity 0.2s;" onclick="this.parentElement.remove();snipeDismissed=true;">&times;</button>';
    snipe.title = count + ' article' + (count !== 1 ? 's' : '') + ' filtered';
    
    document.body.appendChild(snipe);
  }
  
  filterArticles();
  
  /* Monitor for new content */
  const observer = new MutationObserver(() => {
    setTimeout(filterArticles, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();