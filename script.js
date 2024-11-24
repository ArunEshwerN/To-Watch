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

let selectedMovie = null;
let searchTimeout = null;

// Function to search IMDb
async function searchIMDb(query) {
    try {
        console.log('Searching for:', query);
        
        // Using the auto-complete endpoint for better results
        const response = await fetch(`https://imdb8.p.rapidapi.com/auto-complete?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'imdb8.p.rapidapi.com',
                'x-rapidapi-key': '620005d0f2msh2a9e2f3d858b8cdp1e5ab9jsn731f66911636'
            }
        });
        
        const data = await response.json();
        console.log('Search results:', data);
        
        // Filter for movies and TV series
        const results = (data.d || []).filter(item => 
            item.qid === 'movie' || item.qid === 'tvSeries' || item.qid === 'tvMiniSeries'
        );
        
        return results;
    } catch (error) {
        console.error('Error searching IMDb:', error);
        return [];
    }
}

// Function to display movie suggestions
function displaySuggestions(movies) {
    const suggestionsDiv = document.getElementById('movieSuggestions');
    const whatsappBtn = document.querySelector('.whatsapp-btn');
    
    console.log('Displaying suggestions for movies:', movies);
    
    if (!movies.length) {
        suggestionsDiv.classList.remove('active');
        return;
    }

    suggestionsDiv.innerHTML = movies.map(movie => `
        <div class="movie-suggestion" data-id="${movie.id}" data-title="${movie.l}" data-year="${movie.y || ''}" data-type="${movie.qid}">
            <img class="movie-poster" src="${movie.i ? movie.i.imageUrl : 'placeholder.jpg'}" alt="${movie.l}" onerror="this.src='placeholder.jpg'">
            <div class="movie-info">
                <div class="movie-title">${movie.l}</div>
                <div class="movie-details">
                    ${movie.y ? `<span class="movie-year">${movie.y}</span>` : ''}
                    ${movie.qid ? `<span class="movie-type">${movie.qid}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    suggestionsDiv.classList.add('active');

    // Add click listeners to suggestions
    suggestionsDiv.querySelectorAll('.movie-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
            selectedMovie = {
                id: suggestion.dataset.id,
                title: suggestion.dataset.title,
                year: suggestion.dataset.year,
                type: suggestion.dataset.type
            };
            document.getElementById('movieInput').value = `${selectedMovie.title} (${selectedMovie.year})`;
            suggestionsDiv.classList.remove('active');
            whatsappBtn.disabled = false;
        });
    });
}

// Add input event listener for search
document.getElementById('movieInput').addEventListener('input', function(e) {
    const query = e.target.value.trim();
    const whatsappBtn = document.querySelector('.whatsapp-btn');
    
    // Reset selected movie
    selectedMovie = null;
    whatsappBtn.disabled = true;

    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
        document.getElementById('movieSuggestions').classList.remove('active');
        return;
    }

    // Add debounce to prevent too many API calls
    searchTimeout = setTimeout(async () => {
        const movies = await searchIMDb(query);
        displaySuggestions(movies);
    }, 300);
});

// Close suggestions when clicking outside
document.addEventListener('click', function(e) {
    const suggestionsDiv = document.getElementById('movieSuggestions');
    const searchContainer = document.querySelector('.search-container');
    
    if (!searchContainer.contains(e.target)) {
        suggestionsDiv.classList.remove('active');
    }
});

// Function to send movie request via WhatsApp
function sendMovieRequest() {
    if (!selectedMovie) {
        alert('Please select a movie from the suggestions');
        return;
    }

    // Format the message with movie details
    const message = `Hi, I'm looking for this movie:\n${selectedMovie.title} (${selectedMovie.year})\nIMDb: https://www.imdb.com/title/${selectedMovie.id}`;
    const phoneNumber = '917708666625';
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    // Reset form
    document.getElementById('movieInput').value = '';
    selectedMovie = null;
    document.querySelector('.whatsapp-btn').disabled = true;
}

// Add enter key support for the input field
document.getElementById('movieInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMovieRequest();
    }
});

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
