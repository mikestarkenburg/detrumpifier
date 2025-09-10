document.addEventListener('DOMContentLoaded', function() {
  const loading = document.getElementById('loading');
  const articlesContainer = document.getElementById('articlesContainer');
  const emptyState = document.getElementById('emptyState');
  const articleCount = document.getElementById('articleCount');

  // Load filtered articles directly from storage
  loadFilteredArticles();

  function loadFilteredArticles() {
    // Get filtered articles from chrome storage
    chrome.storage.local.get(['filteredArticles'], function(result) {
      loading.style.display = 'none';
      
      if (result.filteredArticles && result.filteredArticles.length > 0) {
        displayArticles(result.filteredArticles);
        articleCount.textContent = result.filteredArticles.length;
      } else {
        showEmptyState();
      }
    });
  }

  function displayArticles(articles) {
    articlesContainer.innerHTML = '';
    
    articles.forEach((article, index) => {
      const articleCard = createArticleCard(article, index);
      articlesContainer.appendChild(articleCard);
    });
    
    articlesContainer.style.display = 'grid';
  }

  function createArticleCard(article, index) {
    const card = document.createElement('div');
    card.className = 'article-card';
    
    // Clean up the title and content
    const title = article.title || `Article ${index + 1}`;
    const content = article.content || 'No preview available';
    const link = article.link || '#';
    
    card.innerHTML = `
      <h3 class="article-title">${escapeHtml(title)}</h3>
      <p class="article-content">${escapeHtml(content)}</p>
      <div class="article-meta">
        <span>Article ${index + 1}</span>
        ${link && link !== '#' ? '<a href="#" class="read-more" data-link="' + escapeHtml(link) + '">Read more</a>' : ''}
      </div>
    `;
    
    // Add click handler to open original article
    if (link && link !== '#') {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        if (e.target.classList.contains('read-more')) {
          // If clicking on "Read more", open the link
          chrome.tabs.create({ url: e.target.getAttribute('data-link') });
        } else {
          // If clicking anywhere else on the card, open the link
          chrome.tabs.create({ url: link });
        }
      });
      
      card.style.cursor = 'pointer';
    }
    
    return card;
  }

  function showEmptyState() {
    emptyState.style.display = 'block';
    articleCount.textContent = '0';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Add refresh functionality
  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'btn';
  refreshBtn.textContent = 'Refresh';
  refreshBtn.style.position = 'fixed';
  refreshBtn.style.bottom = '24px';
  refreshBtn.style.right = '24px';
  refreshBtn.style.zIndex = '1000';
  
  refreshBtn.addEventListener('click', function() {
    location.reload();
  });
  
  document.body.appendChild(refreshBtn);
});

