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

let selectedMovie = null;
let searchTimeout = null;

// Function to search IMDb
async function searchIMDb(query) {
    if (!query) {
        displaySuggestions([]);
        return;
    }

    try {
        const response = await fetch(`${BASE_API_URL}/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displaySuggestions(data);
    } catch (error) {
        console.error('Error searching IMDb:', error);
        displaySuggestions([]);
    }
}

// Function to display movie suggestions
function displaySuggestions(movies) {
    const suggestionsDiv = document.getElementById('movieSuggestions');
    const whatsappBtn = document.querySelector('.whatsapp-btn');
    
    if (!movies.length) {
        suggestionsDiv.style.display = 'none';
        selectedMovie = null;
        whatsappBtn.disabled = true;
        return;
    }

    const html = movies.map((movie, index) => `
        <div class="suggestion" onclick="selectMovie(${index}, '${movie.title.replace(/'/g, "\\'")}')">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-year">${movie.year || 'N/A'}</div>
        </div>
    `).join('');

    suggestionsDiv.innerHTML = html;
    suggestionsDiv.style.display = 'block';
}

// Add input event listener for search
document.getElementById('movieInput').addEventListener('input', function(e) {
    const query = e.target.value.trim();
    const whatsappBtn = document.querySelector('.whatsapp-btn');
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Reset selected movie
    selectedMovie = null;
    whatsappBtn.disabled = true;

    // Set new timeout
    if (query) {
        searchTimeout = setTimeout(() => searchIMDb(query), 300);
    } else {
        displaySuggestions([]);
    }
});

// Function to select a movie
function selectMovie(index, title) {
    selectedMovie = title;
    document.getElementById('movieInput').value = title;
    document.getElementById('movieSuggestions').style.display = 'none';
    document.querySelector('.whatsapp-btn').disabled = false;
}

// Function to send movie request via WhatsApp
function sendMovieRequest() {
    if (!selectedMovie) return;

    const phoneNumber = '919952625063';
    const message = `Hi, I'm looking for the movie: ${selectedMovie}`;

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');

    // Reset the form
    document.getElementById('movieInput').value = '';
    document.getElementById('movieSuggestions').style.display = 'none';
    document.querySelector('.whatsapp-btn').disabled = true;
}

// Add enter key support for the input field
document.getElementById('movieInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMovieRequest();
    }
});

// Update direct downloads and Tamil torrents immediately and then every minute
async function startUpdates() {
    await Promise.all([
        updateDirectDownloads(),
        updateTamilTorrents()
    ]);
    setInterval(async () => {
        await Promise.all([
            updateDirectDownloads(),
            updateTamilTorrents()
        ]);
    }, 60000);
}

// Start updates when the page loads
document.addEventListener('DOMContentLoaded', startUpdates);
