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

// Generate download buttons for each quality option
function generateDownloadButtons(downloadUrls) {
    const container = document.getElementById('download');
    if (!container) return;
    container.innerHTML = '';
    downloadUrls.forEach(({ quality, url }) => {
        const btn = document.createElement('a');
        btn.href = url;
        btn.className = 'download-btn';
        btn.innerText = `Download ${quality}`;
        btn.download = '';
        btn.target = '_blank';
        container.appendChild(btn);
    });
}

// Replace content of a specific DOM element
function updateElement(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

// Main function to handle video downloading logic
function handleClientSideDownload(videoId, inputUrl) {
    const loading = document.getElementById('loading');
    const btn = document.getElementById('downloadBtn');
    const container = document.getElementById('container');
    let info = {
        title: '',
        thumbnail: '',
        description: '',
        duration: '',
        downloadUrls: []
    };

    // Detect YouTube and get thumbnail/title
    const ytId = getYouTubeId(inputUrl);
    if (ytId) {
        info.thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        info.downloadUrls = [
            { quality: 'Watch on YouTube', url: `https://www.youtube.com/watch?v=${ytId}` }
        ];

        fetch(`https://corsproxy.io/?https://www.youtube.com/watch?v=${ytId}`)
            .then(resp => resp.text())
            .then(html => {
                const titleMatch = html.match(/<title>(.*?)<\/title>/);
                info.title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'YouTube Video';
                showVideoInfo(info, container, loading, btn);
            })
            .catch(() => {
                info.title = 'YouTube Video';
                showVideoInfo(info, container, loading, btn);
            });
        return;
    }

    // Fallback for non-YouTube: show placeholder and ask user to paste details
    info.thumbnail = 'https://via.placeholder.com/480x360?text=No+Thumbnail';
    info.title = 'Unknown Video';
    info.description = 'Cannot fetch details without external API for this platform.';
    info.downloadUrls = [];
    showVideoInfo(info, container, loading, btn);

    function showVideoInfo(info, container, loading, btn) {
        if (container) container.style.display = 'block';
        updateElement('thumb', `<img src="${info.thumbnail}" alt="Thumbnail" style="max-width:100%;">`);
        updateElement('title', `<h3>${info.title}</h3>`);
        updateElement('description', `<p>${info.description}</p>`);
        updateElement('duration', `<span>${info.duration}</span>`);
        generateDownloadButtons(info.downloadUrls);
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

            // Extract video ID from the URL
            const videoId = getYouTubeId(inputUrl) || inputUrl; // fallback for non-YouTube
            if (videoId) {
                handleClientSideDownload(videoId, inputUrl);
            } else {
                displayError('Invalid URL or unsupported platform.');
                resetState(loading, btn);
            }
        }, 300));
    }
});
