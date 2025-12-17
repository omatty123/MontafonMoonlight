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

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

function parseCSV(csvText) {
  const lines = csvText.trim().split("\n").filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error("CSV is empty");
  }

  const headers = parseCSVLine(lines[0]);
  console.log("   Headers found:", headers);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    // Skip empty rows (rows where all fields are empty)
    if (values.every(v => !v || !v.trim())) {
      continue;
    }

    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx] ? values[idx].trim() : "";
    });

    // Only add rows that have at least a title or slug
    if (row.Title || row.Slug) {
      rows.push(row);
    }
  }

  return rows;
}

function buildChaptersJSON(rows) {
  return rows.map((row, index) => {
    const chapterNum = index + 1;
    const slug = row.Slug || "";
    let summary = row.Summary || "";

    // Convert markdown italic to HTML em tags
    summary = summary.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    const koreanLink = row["Korean Link"] || "";

    // Determine version query param for cover/hero (chapters 4-8 have ?v=2)
    let versionParam = "";
    if (chapterNum >= 4 && chapterNum <= 8) {
      versionParam = "?v=2";
    }

    return {
      title: row.Title || "",
      slug: slug,
      href: `chapter.html?slug=${slug}`,
      date: row.Date || "",
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
    console.log(`   Found ${rows.length} chapters with data`);

    if (rows.length === 0) {
      throw new Error("No valid chapter data found in CSV");
    }

    // Validate first row has data
    const firstRow = rows[0];
    if (!firstRow.Title || !firstRow.Slug) {
      console.error("   First row data:", firstRow);
      throw new Error("First row is missing Title or Slug. Check your Google Sheet structure.");
    }

    console.log(`   First chapter: "${firstRow.Title}" (${firstRow.Slug})`);

    console.log("🔨 Building chapters.json structure...");
    const chapters = buildChaptersJSON(rows);

    console.log("💾 Writing to chapters.json...");
    const outputPath = path.join(process.cwd(), "chapters.json");

    // Create backup of existing chapters.json
    if (fs.existsSync(outputPath)) {
      const backupPath = path.join(process.cwd(), "chapters.json.backup");
      fs.copyFileSync(outputPath, backupPath);
      console.log("   Created backup: chapters.json.backup");
    }

    fs.writeFileSync(outputPath, JSON.stringify(chapters, null, 2) + "\n");

    console.log("✅ Successfully synced chapters.json from Google Sheets!");
    console.log(`   Updated ${chapters.length} chapters`);

  } catch (error) {
    console.error("❌ Error syncing from Google Sheets:", error.message);
    process.exit(1);
  }
}

main();
