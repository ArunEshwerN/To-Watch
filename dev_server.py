from flask import Flask, send_from_directory
from flask_cors import CORS
import webbrowser
import threading
import time
import os

# Import the main server's functions
from server import fetch_streaming_sites, fetch_olamovies, fetch_tamil_torrents, cache

app = Flask(__name__)
CORS(app)

# Serve static files
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# Import routes from main server
from server import get_streaming_sites, get_direct_downloads, get_tamil_torrents
app.add_url_rule('/api/streaming-sites', 'get_streaming_sites', get_streaming_sites)
app.add_url_rule('/api/direct-downloads', 'get_direct_downloads', get_direct_downloads)
app.add_url_rule('/api/tamil-torrents', 'get_tamil_torrents', get_tamil_torrents)

def open_browser():
    """Open browser after a short delay"""
    time.sleep(1.5)
    webbrowser.open('http://localhost:5000')

if __name__ == '__main__':
    # Start browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    print("\n=== Development Server ===")
    print("Starting local server at http://localhost:5000")
    print("Press Ctrl+C to stop the server\n")
    
    # Start the Flask development server
    app.run(port=5000, debug=True, use_reloader=False)
