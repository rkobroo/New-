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
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be') {
                return urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
            }
            if (urlObj.hostname.includes('facebook.com') ||
                urlObj.hostname.includes('instagram.com') ||
                urlObj.hostname.includes('tiktok.com')) {
                return urlObj.href;
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
        console.log('Handling download for:', videoId);
        const loading = document.getElementById('loading');
        const btn = document.getElementById('downloadBtn');
        const container = document.getElementById('container');

        const backendURL = 'https://your-backend.onrender.com'; // Replace with your deployed backend URL
        const infoUrl = `${backendURL}/info?url=${encodeURIComponent(inputUrl)}`;

        fetch(infoUrl, { mode: 'cors' })
            .then(res => {
                if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
                return res.json();
            })
            .then(info => {
                if (!info.thumbnail || !info.title) throw new Error('Invalid video info');
                if (container) container.style.display = 'block';

                updateElement('thumb', `<video poster="${info.thumbnail}" controls><source src="${inputUrl}" type="video/mp4"></video>`);
                updateElement('title', `<h3>${info.title}</h3>`);
                updateElement('description', `<p>${info.description || 'No description.'}</p>`);
                updateElement('duration', `<span>${info.duration || 'Unknown'}</span>`);

                generateDownloadButtons(info.downloadUrls);
            })
            .catch(err => {
                displayError(err.message);
                updateElement('thumb', '<p>Thumbnail unavailable</p>');
                updateElement('title', '<h3>Untitled</h3>');
                updateElement('description', '<p>Description not available.</p>');
                updateElement('duration', '<span>N/A</span>');
            })
            .finally(() => resetState(loading, btn));

        function updateElement(id, html) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        }

        function generateDownloadButtons(downloadUrls = []) {
            const container = document.getElementById('download');
            if (!container) return;
            container.innerHTML = '';
            downloadUrls.forEach(({ quality, url }) => {
                const btn = document.createElement('a');
                btn.href = url;
                btn.className = 'download-btn';
                btn.innerText = `Download ${quality}`;
                btn.download = '';
                container.appendChild(btn);
            });
        }
    }
});
