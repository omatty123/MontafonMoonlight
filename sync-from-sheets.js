/**
 * sync-from-sheets.js
 * Fetches data from Google Sheets and updates chapters.json
 */

import fs from "fs";
import path from "path";
import https from "https";

const SHEET_ID = "1rz1KvXpjPzf-hshLwg6PQG1aEGaogCGzULkiKN64Pd4";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      followRedirect: true
    }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        https.get(res.headers.location, (redirectRes) => {
          let data = "";
          redirectRes.on("data", chunk => data += chunk);
          redirectRes.on("end", () => resolve(data));
          redirectRes.on("error", reject);
        }).on("error", reject);
      } else {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }
    }).on("error", reject);
  });
}

function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parsing (handles quoted fields)
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

function buildChaptersJSON(rows) {
  return rows.map((row, index) => {
    const chapterNum = index + 1;
    const slug = row.Slug || row.slug || "";
    let summary = row.Summary || row.summary || "";
    // Convert markdown italic to HTML em tags
    summary = summary.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    const koreanLink = row["Korean Link"] || row["korean link"] || row.koreanLink || "";

    // Determine version query param for cover/hero (chapters 4-8 have ?v=2)
    let versionParam = "";
    if (chapterNum >= 4 && chapterNum <= 8) {
      versionParam = "?v=2";
    }

    return {
      title: row.Title || row.title || "",
      slug: slug,
      href: `chapter.html?slug=${slug}`,
      date: row.Date || row.date || "",
      cover: `assets/ch${chapterNum}-cover.jpg${versionParam}`,
      hero: `assets/ch${chapterNum}-hero.jpg${versionParam}`,
      summary: summary,
      status: "published",
      contentHtml: `content/chapter-${chapterNum}.html`,
      koreanLink: koreanLink
    };
  });
}

async function main() {
  try {
    console.log("📥 Fetching data from Google Sheets...");
    const csvData = await fetchCSV(CSV_URL);

    console.log("📊 Parsing CSV data...");
    const rows = parseCSV(csvData);
    console.log(`   Found ${rows.length} chapters`);

    console.log("🔨 Building chapters.json structure...");
    const chapters = buildChaptersJSON(rows);

    console.log("💾 Writing to chapters.json...");
    const outputPath = path.join(process.cwd(), "chapters.json");
    fs.writeFileSync(outputPath, JSON.stringify(chapters, null, 2) + "\n");

    console.log("✅ Successfully synced chapters.json from Google Sheets!");
    console.log(`   Updated ${chapters.length} chapters`);

  } catch (error) {
    console.error("❌ Error syncing from Google Sheets:", error.message);
    process.exit(1);
  }
}

main();
