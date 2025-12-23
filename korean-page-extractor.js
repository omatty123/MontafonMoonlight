// Montafon Moonlight - Korean Page Extractor Bookmarklet
// Drag this to your bookmarks bar or save as a bookmark

javascript:(function(){
  // Extract all text from article/main content
  let koreanText = '';

  // Try to find the main content area (adjust selectors for mediabuddha.net)
  const contentSelectors = [
    'article',
    '.article-content',
    '.news-content',
    '#article-view-content-div',
    '.view-content',
    'div[id*="content"]',
    'main'
  ];

  let contentElement = null;
  for (const selector of contentSelectors) {
    contentElement = document.querySelector(selector);
    if (contentElement) break;
  }

  if (contentElement) {
    // Extract paragraphs
    const paragraphs = contentElement.querySelectorAll('p');
    koreanText = Array.from(paragraphs)
      .map(p => p.innerText.trim())
      .filter(t => t.length > 0)
      .join('\n\n');
  } else {
    // Fallback: get all text from body
    koreanText = document.body.innerText;
  }

  // Extract image URL
  let imageUrl = '';
  const images = document.querySelectorAll('img');
  for (const img of images) {
    // Look for content images (not logos/ads)
    if (img.naturalWidth > 300 && img.naturalHeight > 200) {
      imageUrl = img.src;
      break;
    }
  }

  // Get current URL
  const koreanUrl = window.location.href;

  // Store in localStorage for the tool to retrieve
  const data = {
    koreanUrl: koreanUrl,
    koreanText: koreanText,
    imageUrl: imageUrl,
    timestamp: Date.now()
  };

  localStorage.setItem('montafonChapterData', JSON.stringify(data));

  // Open the tool in a new tab
  window.open('https://omatty123.github.io/MontafonMoonlight/chapter-workflow-tool-v2.html', '_blank');

  alert('✓ Extracted! Opening the tool...');
})();
