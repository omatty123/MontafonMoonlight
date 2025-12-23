import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';

function normalizeUrl(inputUrl) {
  try {
    const url = new URL(inputUrl);
    if (!url.pathname.startsWith('/m/')) {
      url.pathname = '/m' + url.pathname;
    }
    return url.toString();
  } catch {
    return inputUrl;
  }
}

async function extractMediabuddha(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const data = await page.evaluate(() => {
      const titleEl =
        document.querySelector('font[style*="font-size:20px"]') ||
        document.querySelector('.view_title') ||
        document.querySelector('title');

      const images = Array.from(document.querySelectorAll('img'));
      const mainImg =
        images.find((img) => img.src.includes('/data/news/')) ||
        images.find((img) => img.src.includes('/data/editor/')) ||
        images.find((img) => img.naturalWidth > 300 && img.naturalHeight > 200);

      const contentSelectors = ['#news_content', 'td.view_content', 'div[align="justify"]', 'div[id*="content"]'];
      let contentEl = null;
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText && el.innerText.length > 100) {
          contentEl = el;
          break;
        }
      }

      let paragraphs = [];
      if (contentEl) {
        paragraphs = Array.from(contentEl.querySelectorAll('p'))
          .map((p) => p.innerText.trim())
          .filter((t) => t.length > 10);
      }

      if (paragraphs.length === 0) {
        paragraphs = Array.from(document.querySelectorAll('p'))
          .map((p) => p.innerText.trim())
          .filter((t) => t.length > 20);
      }

      const imageUrl = mainImg ? new URL(mainImg.getAttribute('src') || mainImg.src, location.href).href : '';

      return {
        title: titleEl ? titleEl.innerText.trim() : 'Title not found',
        imageUrl,
        koreanText: paragraphs.join('\n\n'),
        paragraphCount: paragraphs.length,
      };
    });

    const result = {
      koreanUrl: url,
      ...data,
    };

    return result;
  } finally {
    await browser.close();
  }
}

async function main() {
  const inputUrl = process.argv[2];
  if (!inputUrl) {
    console.error('Usage: node scrape-chapter-puppeteer.js <korean-url>');
    process.exit(1);
  }

  const normalizedUrl = normalizeUrl(inputUrl);
  const data = await extractMediabuddha(normalizedUrl);

  await writeFile('chapter-data.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Saved chapter-data.json (${data.paragraphCount} paragraphs)`);
  if (!data.koreanText) {
    console.warn('⚠️ No Korean text extracted. Check selectors or page structure.');
  }
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
