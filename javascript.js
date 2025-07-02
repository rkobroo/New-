document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, attaching event listener');
    const downloadBtn = document.getElementById('downloadBtn');
    if (!downloadBtn) {
        console.error('Download button not found!');
        return;
    }

    downloadBtn.addEventListener('click', debounce(function () {
        console.log('Download button clicked');
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'initial';
        const btn = document.getElementById('downloadBtn');
        if (btn) btn.disabled = true;

        const inputUrl = document.getElementById('inputUrl')?.value.trim();
        if (!inputUrl) {
            displayError('Please enter a valid video URL.');
            if (loading) loading.style.display = 'none';
            if (btn) btn.disabled = false;
            return;
        }

        const videoId = getVideoId(inputUrl);
        console.log('Extracted videoId:', videoId);
        if (videoId) {
            handleClientSideDownload(videoId, inputUrl);
        } else {
            displayError('Invalid URL or unsupported platform.');
            if (loading) loading.style.display = 'none';
            if (btn) btn.disabled = false;
        }
    }, 300));

    function getVideoId(url) {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be') {
                return urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
            }
            if (urlObj.hostname.includes('facebook.com')) {
                return urlObj.href; // Use full URL for now
            }
            return null;
        } catch (e) {
            console.error('URL parsing error:', e);
            return null;
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function displayError(message) {
        const errorContainer = document.getElementById('error');
        if (errorContainer) {
            errorContainer.innerHTML = message;
            errorContainer.style.display = 'block';
        } else {
            alert(message);
        }
    }

    function handleClientSideDownload(videoId, inputUrl) {
        console.log('Handling download for:', videoId);
        displayError('Download process started (placeholder)');
        // Add further logic here later
    }
});
