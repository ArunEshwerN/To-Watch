from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import time
import os
from threading import Timer

app = Flask(__name__)
# Configure CORS to allow requests from any origin since we're using multiple domains
CORS(app)

# Cache for storing the sites
cache = {
    'sites': [],
    'tamil_torrents': [],
    'last_update': 0
}

def fetch_streaming_sites():
    """Fetch starred streaming sites from FMHY's Multi Server section"""
    try:
        print("Fetching streaming sites...")  # Debug log
        response = requests.get('https://fmhy.pages.dev/videopiracyguide', timeout=10)
        response.raise_for_status()  # Raise an error for bad status codes
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the Multi Server section
        sections = soup.find_all(['h2', 'h3'])
        multi_server_section = None
        for section in sections:
            if 'Multi Server' in section.text:
                multi_server_section = section
                break
        
        if not multi_server_section:
            print("Multi Server section not found")
            return []
        
        # Get all content after the Multi Server heading until the next heading
        sites = []
        current = multi_server_section.find_next()
        while current and current.name not in ['h2', 'h3']:
            if current.name == 'ul':
                # Find starred items within this UL
                starred_items = current.find_all('li', class_='starred')
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
            current = current.find_next()
        
        print(f"Found {len(sites)} streaming sites")  # Debug log
        cache['sites'] = sites
        cache['last_update'] = time.time()
        return sites
    except Exception as e:
        print(f"Error fetching streaming sites: {str(e)}")
        return cache.get('sites', [])  # Return cached sites if available

def fetch_olamovies():
    """Fetch OlaMovies link from FMHY's non-English section under Indian Languages"""
    try:
        print("Fetching OlaMovies...")  # Debug log
        response = requests.get('https://fmhy.pages.dev/non-english', timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the Indian Languages section
        indian_section = None
        for heading in soup.find_all(['h2', 'h3']):
            if 'Indian' in heading.text:
                indian_section = heading
                break
        
        if not indian_section:
            print("Indian Languages section not found")
            return None
            
        # Find the Downloading subsection within Indian Languages section
        downloading_section = None
        current = indian_section.find_next()
        while current and current.name != 'h2':
            if current.name == 'h3' and 'Download' in current.text:
                downloading_section = current
                break
            current = current.find_next()
                
        if not downloading_section:
            print("Downloading section not found")
            return None
            
        # Get all content after the Downloading heading until the next heading
        current = downloading_section.find_next()
        while current and current.name not in ['h2', 'h3']:
            if current.name == 'ul':
                # Find the first starred item (OlaMovies)
                starred_item = current.find('li', class_='starred')
                if starred_item:
                    link = starred_item.find('a')
                    if link:
                        desc = starred_item.get_text().split('-')[1].strip() if '-' in starred_item.get_text() else ''
                        return {
                            'name': 'OlaMovies',
                            'url': link['href'],
                            'desc': desc
                        }
            current = current.find_next()
        
        print("OlaMovies link not found")
        return None
    except Exception as e:
        print(f"Error fetching OlaMovies: {str(e)}")
        return None

def fetch_tamil_torrents():
    """Fetch Tamil torrent sites from FMHY's non-English section"""
    try:
        print("Fetching Tamil torrent sites...")  # Debug log
        response = requests.get('https://fmhy.pages.dev/non-english', timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the Indian Languages section
        indian_section = None
        for heading in soup.find_all(['h2', 'h3']):
            if 'Indian' in heading.text:
                indian_section = heading
                break
        
        if not indian_section:
            print("Indian Languages section not found")
            return []
            
        # Find the Torrenting subsection within Indian Languages section
        torrenting_section = None
        current = indian_section.find_next()
        while current and current.name != 'h2':
            if current.name == 'h3' and 'Torrent' in current.text:
                torrenting_section = current
                break
            current = current.find_next()
                
        if not torrenting_section:
            print("Torrenting section not found")
            return []
            
        # Get all content after the Torrenting heading until the next heading
        sites = []
        current = torrenting_section.find_next()
        while current and current.name not in ['h2', 'h3']:
            if current.name == 'ul':
                # Find starred items within this UL
                starred_items = current.find_all('li', class_='starred')
                for item in starred_items:
                    link = item.find('a')
                    if not link:
                        continue
                    
                    desc = item.get_text().split('-')[1].strip() if '-' in item.get_text() else ''
                    
                    sites.append({
                        'name': link.get_text().strip(),
                        'url': link['href'],
                        'desc': desc
                    })
            current = current.find_next()
        
        print(f"Found {len(sites)} Tamil torrent sites")  # Debug log
        cache['tamil_torrents'] = sites
        return sites
    except Exception as e:
        print(f"Error fetching Tamil torrent sites: {str(e)}")
        return cache.get('tamil_torrents', [])

def update_cache_periodically():
    """Update the cache every minute"""
    try:
        print("\nUpdating cache...")  # Debug log
        streaming_sites = fetch_streaming_sites()
        tamil_torrents = fetch_tamil_torrents()
        print(f"Cache updated with {len(streaming_sites)} streaming sites and {len(tamil_torrents)} Tamil torrent sites")
    except Exception as e:
        print(f"Error in periodic update: {str(e)}")
    
    # Schedule next update
    Timer(60.0, update_cache_periodically).start()

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/api/streaming-sites')
def get_streaming_sites():
    # Update cache if it's older than 1 minute
    if time.time() - cache.get('last_update', 0) > 60:
        sites = fetch_streaming_sites()
    else:
        sites = cache.get('sites', [])
        if not sites:
            sites = fetch_streaming_sites()
    return jsonify(sites)

@app.route('/api/direct-downloads')
def get_direct_downloads():
    olamovies = fetch_olamovies()
    if not olamovies:
        return jsonify([])
    return jsonify([olamovies])

@app.route('/api/tamil-torrents')
def get_tamil_torrents():
    # Update cache if it's older than 1 minute
    if time.time() - cache.get('last_update', 0) > 60:
        sites = fetch_tamil_torrents()
    else:
        sites = cache.get('tamil_torrents', [])
        if not sites:
            sites = fetch_tamil_torrents()
    return jsonify(sites)

# Start the initial cache update
Timer(1.0, update_cache_periodically).start()

if __name__ == '__main__':
    app.run(port=5000, debug=True)
