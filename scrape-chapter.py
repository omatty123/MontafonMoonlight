#!/usr/bin/env python3
"""
Montafon Moonlight Chapter Scraper
Automatically extracts Korean text and images from mediabuddha.net
"""

import sys
import requests
from bs4 import BeautifulSoup
import json
import re

def scrape_chapter(url):
    """Scrape chapter content from Korean URL"""
    print(f"📥 Fetching: {url}")

    # Add headers to avoid being blocked
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }

    try:
        response = requests.get(url, headers=headers, verify=False, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract Korean text from paragraphs
        korean_text = []

        # Try to find article content
        content_area = (
            soup.find('article') or
            soup.find('div', class_=re.compile('content|article|view')) or
            soup.find('div', id=re.compile('content|article'))
        )

        if content_area:
            paragraphs = content_area.find_all('p')
            for p in paragraphs:
                text = p.get_text().strip()
                if len(text) > 10:  # Filter out very short lines
                    korean_text.append(text)

        # Extract image URL
        image_url = ''
        images = soup.find_all('img')
        for img in images:
            src = img.get('src', '')
            if src and ('upload' in src or 'photo' in src or 'image' in src):
                if not src.startswith('http'):
                    src = 'http://www.mediabuddha.net' + src
                image_url = src
                break

        # Prepare data
        data = {
            'koreanUrl': url,
            'koreanText': '\n\n'.join(korean_text),
            'imageUrl': image_url,
            'paragraphCount': len(korean_text)
        }

        print(f"✓ Extracted {len(korean_text)} paragraphs")
        if image_url:
            print(f"✓ Found image: {image_url[:50]}...")

        return data

    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def save_to_json(data, filename='chapter-data.json'):
    """Save extracted data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ Saved to {filename}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scrape-chapter.py <korean-url>")
        print("Example: python3 scrape-chapter.py http://www.mediabuddha.net/m/news/view.php?number=35373")
        sys.exit(1)

    url = sys.argv[1]
    data = scrape_chapter(url)

    if data:
        save_to_json(data)
        print("\n📋 Korean Text Preview:")
        print(data['koreanText'][:200] + "...")
        print(f"\n🖼️  Image URL: {data['imageUrl']}")
        print("\n✅ Done! Open chapter-data.json to copy the text.")
    else:
        print("❌ Failed to scrape chapter")
        sys.exit(1)

if __name__ == '__main__':
    main()
