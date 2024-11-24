// Get the base API URL based on the environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_API_URL = isDevelopment 
    ? 'http://localhost:5000'
    : window.location.origin;

console.log('Running in:', isDevelopment ? 'Development' : 'Production');
console.log('API URL:', BASE_API_URL);

// Function to switch between languages
function switchLanguage(lang) {
    document.getElementById('english-content').classList.toggle('active', lang === 'english');
    document.getElementById('tamil-content').classList.toggle('active', lang === 'tamil');
    
    // Update button states
    const buttons = document.querySelectorAll('.language-toggle button');
    buttons.forEach(button => {
        button.classList.toggle('active', button.textContent.toLowerCase().includes(lang));
    });
}

// Function to update streaming links
async function updateStreamingLinks() {
    const englishContainer = document.getElementById('streaming-links');
    const tamilContainer = document.getElementById('tamil-streaming-links');
    
    try {
        const response = await fetch(`${BASE_API_URL}/api/streaming-sites`);
        const sites = await response.json();
        
        const content = sites.map(site => `
            <a href="${site.url}" target="_blank" class="streaming-link">
                <span class="star">⭐</span>
                <div class="site-info">
                    <span class="site-name">${site.name}</span>
                    <span class="site-desc">${site.desc}</span>
                </div>
            </a>
        `).join('');
        
        // Update both English and Tamil sections
        [englishContainer, tamilContainer].forEach(container => {
            if (sites.length === 0) {
                container.innerHTML = '<div class="error">No streaming sites found. Please try again later.</div>';
                return;
            }
            container.innerHTML = content;
        });
    } catch (error) {
        console.error('Error fetching streaming sites:', error);
        [englishContainer, tamilContainer].forEach(container => {
            container.innerHTML = '<div class="error">Failed to load streaming sites. Please try again later.</div>';
        });
    }
}

// Function to update direct download links
async function updateDirectDownloads() {
    const englishContainer = document.getElementById('english-direct-downloads');
    const tamilContainer = document.getElementById('tamil-direct-downloads');
    
    try {
        const response = await fetch(`${BASE_API_URL}/api/direct-downloads`);
        const sites = await response.json();
        
        const content = sites.map(site => `
            <a href="${site.url}" target="_blank" class="streaming-link">
                <span class="star">⭐</span>
                <div class="site-info">
                    <span class="site-name">${site.name}</span>
                    <span class="site-desc">${site.desc}</span>
                </div>
            </a>
        `).join('');
        
        // Update both English and Tamil sections
        [englishContainer, tamilContainer].forEach(container => {
            if (sites.length === 0) {
                container.innerHTML = '<div class="error">No direct download sites found. Please try again later.</div>';
                return;
            }
            container.innerHTML = content;
        });
    } catch (error) {
        console.error('Error fetching direct download sites:', error);
        [englishContainer, tamilContainer].forEach(container => {
            container.innerHTML = '<div class="error">Failed to load direct download sites. Please try again later.</div>';
        });
    }
}

// Function to update Tamil torrent links
async function updateTamilTorrents() {
    const container = document.querySelector('#tamil-content .torrent-links');
    
    try {
        const response = await fetch(`${BASE_API_URL}/api/tamil-torrents`);
        const sites = await response.json();
        
        if (sites.length === 0) {
            container.innerHTML = '<div class="error">No torrent sites found. Please try again later.</div>';
            return;
        }
        
        const content = sites.map(site => `
            <a href="${site.url}" target="_blank" class="streaming-link">
                <span class="star">⭐</span>
                <div class="site-info">
                    <span class="site-name">${site.name}</span>
                    <span class="site-desc">${site.desc}</span>
                </div>
            </a>
        `).join('');
        
        container.innerHTML = content;
    } catch (error) {
        console.error('Error fetching Tamil torrent sites:', error);
        container.innerHTML = '<div class="error">Failed to load torrent sites. Please try again later.</div>';
    }
}

// Update streaming links immediately and then every minute
async function startUpdates() {
    await Promise.all([
        updateStreamingLinks(),
        updateDirectDownloads(),
        updateTamilTorrents()
    ]);
    setInterval(async () => {
        await Promise.all([
            updateStreamingLinks(),
            updateDirectDownloads(),
            updateTamilTorrents()
        ]);
    }, 60000);
}

// Start updates when the page loads
document.addEventListener('DOMContentLoaded', startUpdates);
