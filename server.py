from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import time
import threading
import os

app = Flask(__name__)
# Configure CORS to allow requests from render.com and localhost
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://to-watch.onrender.com",
            "http://localhost:5000",
            "http://127.0.0.1:5000"
        ]
    }
})

# Cache for storing the streaming sites
cache = {
    'sites': [],
    'tamil_torrents': [],  
    'last_update': 0
}

def fetch_streaming_sites():
    """Fetch starred streaming sites from FMHY's Multi Server section"""
    try:
        response = requests.get('https://fmhy.pages.dev/videopiracyguide')
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the Multi Server section
        sections = soup.find_all('h3')
        multi_server_section = None
        for section in sections:
            if 'Multi Server' in section.text:
                multi_server_section = section
                break
        
        if not multi_server_section:
            print("Multi Server section not found")
            return
        
        # Get the next UL element after the Multi Server heading
        ul_element = multi_server_section.find_next('ul')
        if not ul_element:
            print("No list found after Multi Server section")
            return
        
        # Find starred items within this section
        starred_items = ul_element.find_all('li', class_='starred')
        
        sites = []
        for item in starred_items:
            # Find the first strong > a element for the main link
            link_element = item.find('strong')
            if not link_element:
                continue
                
            link = link_element.find('a')
            if not link:
                continue
            
            # Get the description (everything after the dash)
            full_text = item.get_text()
            desc = full_text.split('-')[1].strip() if '-' in full_text else ''
            
            # Clean up the description (remove 'Auto-Next' and other unwanted text)
            desc = desc.replace('Auto-Next', '').strip()
            desc = desc.split('/')[:-1]  # Remove the last part if it's "Auto-Next"
            desc = ' / '.join(part.strip() for part in desc if part.strip())
            
            sites.append({
                'name': link.get_text(),
                'url': link['href'],
                'desc': desc
            })
        
        # Update cache
        cache['sites'] = sites
        cache['last_update'] = time.time()
        print(f"Updated {len(sites)} Multi Server streaming sites")
    except Exception as e:
        print(f"Error fetching streaming sites: {e}")

def fetch_olamovies():
    """Fetch OlaMovies link from FMHY's non-English section under Indian Languages"""
    try:
        response = requests.get('https://fmhy.pages.dev/non-english')
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the Indian Languages section
        indian_section = None
        for heading in soup.find_all(['h2']):
            if 'Indian Languages' in heading.text:
                indian_section = heading
                break
        
        if not indian_section:
            print("Indian Languages section not found")
            return None
            
        # Find the Downloading subsection within Indian Languages section
        downloading_section = None
        current = indian_section.find_next()
        while current and current.name != 'h2':  # Stop if we hit another h2
            if current.name == 'h3' and 'Downloading' in current.text:
                downloading_section = current
                break
            current = current.find_next()
                
        if not downloading_section:
            print("Downloading section not found")
            return None
            
        # Get the next UL element after the Downloading heading
        ul_element = downloading_section.find_next('ul')
        if not ul_element:
            print("No list found after Downloading section")
            return None
            
        # Find the first starred item (OlaMovies)
        starred_item = ul_element.find('li', class_='starred')
        if not starred_item:
            print("No starred items found in Downloading section")
            return None
            
        # Get the link and description
        link = starred_item.find('a')
        if not link:
            print("No link found in starred item")
            return None
            
        # Get the description (everything after the dash)
        desc = starred_item.get_text().split('-')[1].strip() if '-' in starred_item.get_text() else ''
            
        return {
            'name': 'OlaMovies',
            'url': link['href'],
            'desc': desc  # Include the description
        }
    except Exception as e:
        print(f"Error fetching OlaMovies link: {e}")
        return None

def fetch_tamil_torrents():
    """Fetch Tamil torrent sites from FMHY's non-English section"""
    try:
        response = requests.get('https://fmhy.pages.dev/non-english')
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the Indian Languages section
        indian_section = None
        for heading in soup.find_all(['h2']):
            if 'Indian Languages' in heading.text:
                indian_section = heading
                break
        
        if not indian_section:
            print("Indian Languages section not found")
            return []
            
        # Find the Torrenting subsection within Indian Languages section
        torrenting_section = None
        current = indian_section.find_next()
        while current and current.name != 'h2':  # Stop if we hit another h2
            if current.name == 'h3' and 'Torrenting' in current.text:
                torrenting_section = current
                break
            current = current.find_next()
                
        if not torrenting_section:
            print("Torrenting section not found")
            return []
            
        # Get the next UL element after the Torrenting heading
        ul_element = torrenting_section.find_next('ul')
        if not ul_element:
            print("No list found after Torrenting section")
            return []
        
        # Find all starred items
        starred_items = ul_element.find_all('li', class_='starred')
        
        sites = []
        for item in starred_items:
            link = item.find('a')
            if not link:
                continue
            
            # Get the description (everything after the dash)
            desc = item.get_text().split('-')[1].strip() if '-' in item.get_text() else ''
            
            sites.append({
                'name': link.get_text().strip(),
                'url': link['href'],
                'desc': desc
            })
        
        print(f"Found {len(sites)} Tamil torrent sites")
        return sites
    except Exception as e:
        print(f"Error fetching Tamil torrent sites: {e}")
        return []

def update_cache_periodically():
    """Update the cache every minute"""
    while True:
        fetch_streaming_sites()
        cache['tamil_torrents'] = fetch_tamil_torrents()
        cache['last_update'] = time.time()
        time.sleep(60)  # Wait for 60 seconds

@app.route('/')
def serve_index():
    """Serve the index.html file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS)"""
    return send_from_directory('.', filename)

@app.route('/api/streaming-sites')
def get_streaming_sites():
    """API endpoint to get streaming sites"""
    return jsonify(cache['sites'])

@app.route('/api/direct-downloads')
def get_direct_downloads():
    """API endpoint to get direct download sites"""
    olamovies = fetch_olamovies()
    if not olamovies:
        return jsonify([])
    return jsonify([olamovies])

@app.route('/api/tamil-torrents')
def get_tamil_torrents():
    """API endpoint to get Tamil torrent sites"""
    return jsonify(cache['tamil_torrents'])

if __name__ == '__main__':
    # Start the background thread for updating the cache
    update_thread = threading.Thread(target=update_cache_periodically, daemon=True)
    update_thread.start()
    
    # Start the Flask server
    app.run(port=5000, debug=True)
