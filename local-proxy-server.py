#!/usr/bin/env python3
"""
Local CORS proxy server for Montafon Moonlight
Run this alongside the workflow tool for reliable URL fetching
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json
from bs4 import BeautifulSoup

class CORSProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests to fetch and parse Korean chapters"""
        # Parse query parameters
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if 'url' not in params:
            self.send_error(400, 'Missing url parameter')
            return

        target_url = params['url'][0]

        try:
            # Fetch the Korean page
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }

            req = urllib.request.Request(target_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                # mediabuddha.net uses EUC-KR encoding, not UTF-8
                raw_html = response.read()

                # Try EUC-KR first (Korean legacy encoding), then UTF-8
                try:
                    html = raw_html.decode('euc-kr')
                except:
                    try:
                        html = raw_html.decode('utf-8', errors='ignore')
                    except:
                        html = raw_html.decode('latin-1')  # Fallback

            # Parse with BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')

            # Extract title
            title = soup.find('title')
            title_text = title.get_text().split('|')[0].split('-')[0].strip() if title else ''

            # Extract main content - mediabuddha.net uses div id="content"
            content_element = soup.find('div', {'id': 'content'})

            # Extract paragraphs
            korean_text = []
            if content_element:
                paragraphs = content_element.find_all('p', {'style': lambda x: x and 'text-align: justify' in x})
                for p in paragraphs:
                    text = p.get_text().strip()
                    # Filter out very short lines and lines with just numbers/spaces
                    if len(text) > 20 and not text.replace(' ', '').replace('&nbsp;', '').isdigit():
                        korean_text.append(text)

            # Extract image URL - look for the main article image in content
            image_url = ''
            if content_element:
                # Find images in the content area
                content_images = content_element.find_all('img')
                for img in content_images:
                    src = img.get('src', '')
                    # Look for editor images (actual article images)
                    if src and '/data/editor/' in src:
                        # Make absolute URL
                        if src.startswith('/'):
                            parsed_target = urllib.parse.urlparse(target_url)
                            src = f"{parsed_target.scheme}://{parsed_target.netloc}{src}"
                        elif not src.startswith('http'):
                            parsed_target = urllib.parse.urlparse(target_url)
                            src = f"{parsed_target.scheme}://{parsed_target.netloc}/{src}"
                        image_url = src
                        break

            # Prepare JSON response
            result = {
                'success': True,
                'title': title_text,
                'koreanText': '\n\n'.join(korean_text),
                'imageUrl': image_url,
                'paragraphCount': len(korean_text)
            }

            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response_json = json.dumps(result, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))

            print(f"✓ Fetched: {title_text} ({len(korean_text)} paragraphs)")

        except Exception as e:
            print(f"❌ Error: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            error_response = {
                'success': False,
                'error': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def log_message(self, format, *args):
        """Custom logging to reduce noise"""
        return

def run_server(port=8765):
    """Run the local proxy server"""
    server = HTTPServer(('localhost', port), CORSProxyHandler)
    print(f"""
╔════════════════════════════════════════════════════════════╗
║  🚀 Montafon Moonlight - Local Proxy Server Running       ║
╚════════════════════════════════════════════════════════════╝

Server: http://localhost:{port}
Status: ✓ Ready to fetch Korean chapters

📋 Usage:
   1. Keep this running in the background
   2. Open the workflow tool in your browser
   3. Paste Korean URL and click "Auto-Fetch"
   4. Tool will use this local server (100% reliable!)

Press Ctrl+C to stop
""")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped")

if __name__ == '__main__':
    run_server()
