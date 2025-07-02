document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, attaching event listener');
    const formatColors = {
        greenFormats: ["17", "18", "22"],
        blueFormats: ["139", "140", "141", "249", "250", "251", "599", "600"],
        defaultColor: "#9e0cf2"
    };

    const downloadBtn = document.getElementById('downloadBtn');
    if (!downloadBtn) {
        console.error('Download button not found!');
        alert('Download button not found. Please check the HTML.');
        return;
    }

    downloadBtn.addEventListener('click', debounce(function () {
        console.log('Download button clicked');
        const loading = document.getElementById('loading');
        const btn = document.getElementById('downloadBtn');
        const container = document.getElementById('container');
        const errorDiv = document.getElementById('error');

        if (loading) {
            loading.style.display = 'flex';
            loading.innerHTML = '<div class="centerV"><span class="text-white">Fetching video info...</span><div class="wave"></div></div>';
        }
        if (btn) btn.disabled = true;
        if (container) container.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';

        const inputUrl = document.getElementById('inputUrl')?.value.trim();
        if (!inputUrl) {
            displayError('Please enter a valid video URL.');
            resetState(loading, btn);
            return;
        }

        const videoId = getVideoId(inputUrl);
        console.log('Extracted videoId:', videoId);
        if (videoId) {
            handleClientSideDownload(videoId, inputUrl);
        } else {
            displayError('Invalid URL or unsupported platform.');
            resetState(loading, btn);
        }
    }, 300));

    function getVideoId(url) {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            console.log('Parsing URL:', url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be') {
                return urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
            }
            if (urlObj.hostname.includes('facebook.com')) {
                return urlObj.href;
            }
            if (urlObj.hostname.includes('instagram.com')) {
                return urlObj.pathname.match(/reel\/([A-Za-z0-9_-]+)|p\/([A-Za-z0-9_-]+)\//)?.[0] || urlObj.href;
            }
            if (urlObj.hostname.includes('tiktok.com')) {
                return urlObj.pathname.match(/video\/(\d+)/)?.[0] || urlObj.href;
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
            errorContainer.innerHTML = `<span class="text-red-500">${message}</span>`;
            errorContainer.style.display = 'block';
            setTimeout(() => errorContainer.style.display = 'none', 5000);
        } else {
            alert(message);
        }
    }

    function resetState(loading, btn) {
        if (loading) {
            loading.style.display = 'none';
            loading.innerHTML = '<div class="centerV"><div class="wave"></div></div>';
        }
        if (btn) btn.disabled = false;
    }

    function handleClientSideDownload(videoId, inputUrl) {
        console.log('Handling download for:', videoId, 'with URL:', inputUrl);
        const loading = document.getElementById('loading');
        const btn = document.getElementById('downloadBtn');
        const container = document.getElementById('container');
        const errorDiv = document.getElementById('error');
        const infoUrl = `http://localhost:3000/info?url=${encodeURIComponent(inputUrl)}`;

        fetch(infoUrl, { mode: 'cors' })
            .then(response => {
                console.log('Fetch response:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    url: infoUrl
                });
                if (!response.ok) throw new Error(`Server error: ${response.status} - ${response.statusText}`);
                return response.text();
            })
            .then(text => {
                console.log('Raw response:', text);
                let info;
                try {
                    info = JSON.parse(text);
                    if (!info.thumbnail && !info.title && !info.duration) {
                        throw new Error('Incomplete video info');
                    }
                } catch (e) {
                    throw new Error('Invalid JSON: ' + text.substring(0, 100));
                }
                console.log('Parsed video info:', info);
                if (container) container.style.display = 'block';
                const thumbnailUrl = info.thumbnail || 'https://via.placeholder.com/480x360?text=No+Thumbnail';
                const videoHtml = `
                    <video style="background: black url(${thumbnailUrl}) center center/cover no-repeat; width:100%; height:500px; border-radius:20px;"
                           poster="${thumbnailUrl}" controls playsinline>
                        <source src="${inputUrl}" type="video/mp4">
                    </video>`;
                const titleHtml = `<h3 class="text-white font-bold">${info.title || 'Untitled'}</h3>`;
                const descriptionHtml = `<h4 class="text-white mt-3"><details><summary class="font-bold">View Description</summary><p class="mt-2">Description (Placeholder)</p></details></h4>`;
                const durationHtml = `<h5 class="text-white">${info.duration || 'N/A'}</h5>`;

                updateElement('thumb', videoHtml);
                updateElement('title', titleHtml);
                updateElement('description', descriptionHtml);
                updateElement('duration', durationHtml);
                generateDownloadButtonsClientSide(videoId, inputUrl);
            })
            .catch(error => {
                console.error('Fetch error details:', error);
                if (container) container.style.display = 'block';
                displayError(`Failed to load: ${error.message}. Ensure server is running at http://localhost:3000. Raw response hint: ${error.message.includes('JSON') ? 'Check server output' : 'Network issue'}`);
                updateElement('thumb', '<p class="text-white">Thumbnail unavailable</p>');
                updateElement('title', '<h3 class="text-white font-bold">Untitled</h3>');
                updateElement('description', '<h4 class="text-white mt-3"><details><summary class="font-bold">View Description</summary><p class="mt-2">Description (Placeholder)</p></details></h4>');
                updateElement('duration', '<h5 class="text-white">N/A</h5>');
            })
            .finally(() => resetState(loading, btn));

        function updateElement(elementId, content) {
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = content;
                element.style.opacity = '0';
                setTimeout(() => element.style.opacity = '1', 10);
            } else {
                console.warn(`Element with ID "${elementId}" not found.`);
                displayError(`UI element "${elementId}" missing. Check HTML.`);
            }
        }

        function generateDownloadButtonsClientSide(videoId, inputUrl) {
            console.log('Generating buttons for:', videoId, 'with URL:', inputUrl);
            const downloadContainer = document.getElementById('download');
            if (!downloadContainer) {
                console.error('Download container not found!');
                displayError('Download options failed to load.');
                return;
            }
            downloadContainer.innerHTML = '';

            const backendUrl = 'http://localhost:3000/download';
            const qualities = ['mp3', '360p', '720p', '1080p'];
            qualities.forEach(quality => {
                const downloadUrl = `${backendUrl}?url=${encodeURIComponent(inputUrl)}`;
                const link = document.createElement('a');
                link.href = '#';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    fetch(downloadUrl)
                        .then(response => {
                            if (!response.ok) throw new Error(`Download error: ${response.statusText}`);
                            return response.blob();
                        })
                        .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download =
