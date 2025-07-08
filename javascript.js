// Utility to extract the YouTube video ID from a URL
function getYouTubeId(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        }
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        return null;
    } catch {
        return null;
    }
}

// Debounce utility to prevent spamming the click handler
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Display error message in the UI
function displayError(message) {
    const errorContainer = document.getElementById('error');
    if (errorContainer) {
        errorContainer.innerHTML = `<span class="text-red-500">${message}</span>`;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            if (errorContainer) errorContainer.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Reset loading state and enable the button
function resetState(loading, btn) {
    if (loading) {
        loading.style.display = 'none';
        loading.innerHTML = '<div class="centerV"><div class="wave"></div></div>';
    }
    if (btn) btn.disabled = false;
}

// Generate playback or informational content
function generateMediaDisplay(info) {
    const container = document.getElementById('download');
    if (!container) return;
    container.innerHTML = '';

    if (info.embedUrl) {
        const iframe = document.createElement('iframe');
        iframe.src = info.embedUrl;
        iframe.style.width = '100%';
        iframe.style.maxWidth = '480px';
        iframe.style.height = '360px';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        container.appendChild(iframe);
    } else {
        const message = document.createElement('p');
        message.innerText = 'Playback not available. Direct downloads require an external API, which is not supported here.';
        message.className = 'text-gray-500';
        container.appendChild(message);
    }
}

// Replace content of a specific DOM element
function updateElement(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

// Main function to handle video display logic
function handleClientSideDisplay(videoId, inputUrl) {
    const loading = document.getElementById('loading');
    const btn = document.getElementById('downloadBtn');
    const container = document.getElementById('container');
    let info = {
        title: '',
        thumbnail: '',
        description: '',
        duration: '',
        embedUrl: ''
    };

    // Detect YouTube and get details
    const ytId = getYouTubeId(inputUrl);
    if (ytId) {
        info.thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        info.embedUrl = `https://www.youtube.com/embed/${ytId}`;
        info.title = 'YouTube Video'; // Fallback title

        // Attempt to fetch title (limited without API)
        fetch(`https://corsproxy.io/?https://www.youtube.com/watch?v=${ytId}`)
            .then(resp => resp.text())
            .then(html => {
                const titleMatch = html.match(/<title>(.*?)<\/title>/);
                info.title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'YouTube Video';
                showMediaInfo(info, container, loading, btn);
            })
            .catch(() => {
                showMediaInfo(info, container, loading, btn);
            });
        return;
    }

    // Fallback for non-YouTube (e.g., TikTok)
    info.thumbnail = 'https://via.placeholder.com/480x360?text=Thumbnail+Unavailable';
    info.title = 'Unknown Video';
    info.description = 'Playback not supported for this platform without an API.';
    info.embedUrl = '';
    showMediaInfo(info, container, loading, btn);

    function showMediaInfo(info, container, loading, btn) {
        if (container) container.style.display = 'block';
        updateElement('thumb', `<img src="${info.thumbnail}" alt="Thumbnail" style="max-width:100%;">`);
        updateElement('title', `<h3>${info.title}</h3>`);
        updateElement('description', `<p>${info.description}</p>`);
        updateElement('duration', `<span>${info.duration || 'N/A'}</span>`);
        generateMediaDisplay(info);
        resetState(loading, btn);
    }
}

// Entry point: handle button click, input, and logic
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('downloadBtn');
    const loading = document.getElementById('loading');

    if (btn) {
        btn.addEventListener('click', debounce(function() {
            if (loading) {
                loading.style.display = 'block';
                loading.innerHTML = '<div class="centerV"><div class="wave"></div></div>';
            }
            btn.disabled = true;

            const inputElement = document.getElementById('inputUrl');
            const inputUrl = inputElement ? inputElement.value.trim() : '';

            if (!inputUrl) {
                displayError('Please enter a valid video URL.');
                resetState(loading, btn);
                return;
            }

            const videoId = getYouTubeId(inputUrl) || inputUrl; // Fallback for non-YouTube
            if (videoId) {
                handleClientSideDisplay(videoId, inputUrl);
            } else {
                displayError('Invalid URL or unsupported platform.');
                resetState(loading, btn);
            }
        }, 300));
    }
});
