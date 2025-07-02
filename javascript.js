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
        return;
    }

    downloadBtn.addEventListener('click', debounce(function () {
        console.log('Download button clicked');
        const loading = document.getElementById('loading');
        const btn = document.getElementById('downloadBtn');
        if (loading) loading.style.display = 'initial';
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
            console.log('Parsing URL:', url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be') {
                return urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
            }
            if (urlObj.hostname.includes('facebook.com')) {
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
            errorContainer.innerHTML = message;
            errorContainer.style.display = 'block';
        } else {
            alert(message);
        }
    }

    function handleClientSideDownload(videoId, inputUrl) {
        console.log('Handling download for:', videoId, 'with URL:', inputUrl);
        const loading = document.getElementById('loading');
        const btn = document.getElementById('downloadBtn');
        const infoUrl = `http://localhost:3000/info?url=${encodeURIComponent(inputUrl)}`;

        fetch(infoUrl)
            .then(response => {
                console.log('Fetch response status:', response.status);
                if (!response.ok) throw new Error(`Info fetch failed: ${response.statusText}`);
                return response.json();
            })
            .then(info => {
                console.log('Video info:', info);
                const thumbnailUrl = info.thumbnail || '';
                const videoHtml = `
                    <video style='background: black url(${thumbnailUrl}) center center/cover no-repeat; width:100%; height:500px; border-radius:20px;'
                           poster='${thumbnailUrl}' controls playsinline>
                        <source src='${inputUrl}' type='video/mp4'>
                    </video>`;
                const titleHtml = `<h3>${info.title || 'Untitled'}</h3>`;
                const descriptionHtml = `<h4><details><summary>View Description</summary>Description (Placeholder)</details></h4>`;
                const durationHtml = `<h5>${info.duration || 'N/A'}</h5>`;

                updateElement('thumb', videoHtml);
                updateElement('title', titleHtml);
                updateElement('description', descriptionHtml);
                updateElement('duration', durationHtml);
                generateDownloadButtonsClientSide(videoId, inputUrl);
            })
            .catch(error => {
                console.error('Fetch error:', error);
                displayError(`Failed to load video info: ${error.message}`);
                updateElement('thumb', '<p>Thumbnail unavailable</p>');
                updateElement('title', '<h3>Untitled</h3>');
                updateElement('description', '<h4><details><summary>View Description</summary>Description (Placeholder)</details></h4>');
                updateElement('duration', '<h5>N/A</h5>');
            })
            .finally(() => {
                if (loading) loading.style.display = 'none';
                if (btn) btn.disabled = false;
            });

        function updateElement(elementId, content) {
            const element = document.getElementById(elementId
