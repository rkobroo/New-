document.addEventListener('DOMContentLoaded', () => {
    // Get the download button from the DOM
    const downloadBtn = document.getElementById('downloadBtn');

    // Ensure the button exists before attaching logic
    if (!downloadBtn) {
        console.error('Download button not found!');
        alert('Download button not found. Please check the HTML.');
        return;
    }

    // Attach a debounced click handler to the download button
    downloadBtn.addEventListener('click', debounce(function () {
        const loading = document.getElementById('loading');
        const btn = document.getElementById('downloadBtn');
        const container = document.getElementById('container');
        const errorDiv = document.getElementById('error');

        // Show loading UI
        if (loading) {
            loading.style.display = 'flex';
            loading.innerHTML = '<div class="centerV"><span class="text-white">Fetching video info...</span><div class="wave"></div></div>';
        }
        if (btn) btn.disabled = true;
        if (container) container.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';

        // Get the URL input value
        const inputElement = document.getElementById('inputUrl');
        const inputUrl = inputElement ? inputElement.value.trim() : '';

        if (!inputUrl) {
            displayError('Please enter a valid video URL.');
            resetState(loading, btn);
            return;
        }

        // Extract video ID from the URL
        const videoId = getVideoId(inputUrl);

        if (videoId) {
            handleClientSideDownload(videoId, inputUrl);
        } else {
            displayError('Invalid URL or unsupported platform.');
            resetState(loading, btn);
        }
    }, 300));

    // Function to extract video ID or full URL for supported platforms
    function getVideoId(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be') {
                return urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
            }
            if (
                urlObj.hostname.includes('facebook.com') ||
                urlObj.hostname.includes('instagram.com') ||
                urlObj.hostname.includes('tiktok.com')
            ) {
                return url;
            }
            return null;
        } catch (e) {
            console.error('URL parsing error:', e);
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

    // Simulate handling video info retrieval and UI update without real backend
    function handleClientSideDownload(videoId, inputUrl) {
        const loading = document.getElementById('loading');
        const btn = document.getElementById('downloadBtn');
        const container = document.getElementById('container');

        // Simulate async delay
        setTimeout(() => {
            // Mock video information
            const info = {
                title: 'Test Video',
                thumbnail: 'https://via.placeholder.com/480x360?text=Thumbnail',
                description: 'This is a test video',
                duration: '3:20',
                downloadUrls: [
                    { quality: '360p', url: 'https://example.com/video360.mp4' },
                    { quality: '720p', url: 'https://example.com/video720.mp4' },
                    { quality: 'mp3', url: 'https://example.com/audio.mp3' }
                ]
            };

            // Show video info UI
            if (container) container.style.display = 'block';
            updateElement('thumb', `<video poster="${info.thumbnail}" controls><source src="${info.downloadUrls[0].url}" type="video/mp4"></video>`);
            updateElement('title', `<h3>${info.title}</h3>`);
            updateElement('description', `<p>${info.description}</p>`);
            updateElement('duration', `<span>${info.duration}</span>`);
            generateDownloadButtons(info.downloadUrls);
            resetState(loading, btn);
        }, 1500);

        // Replace content of a specific DOM element
        function updateElement(id, html) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
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
    }
});
