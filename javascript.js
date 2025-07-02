/*******************************
 * Configuration for Colors
 *******************************/

const formatColors = {
    greenFormats: ["17", "18", "22"],
    blueFormats: ["139", "140", "141", "249", "250", "251", "599", "600"],
    defaultColor: "#9e0cf2"
};

/*******************************
 * Utility Functions
 *******************************/

/**
 * Get the background color based on the format itag.
 * @param {string} downloadUrlItag - The itag parameter from the download URL.
 * @returns {string} - The corresponding background color.
 */
function getBackgroundColor(downloadUrlItag) {
    if (formatColors.greenFormats.includes(downloadUrlItag)) {
        return "green";
    } else if (formatColors.blueFormats.includes(downloadUrlItag)) {
        return "#3800ff";
    } else {
        return formatColors.defaultColor;
    }
}

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Extract video ID or URL data from various platforms.
 * @param {string} url - The video URL.
 * @returns {string|null} - The video ID or URL, or null if not found.
 */
function getVideoId(url) {
    if (!url || typeof url !== 'string') {
        console.error('Invalid URL provided to getVideoId:', url);
        return null;
    }
    try {
        const urlObj = new URL(url);

        // YouTube
        if (urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be') {
            if (urlObj.hostname === 'youtu.be') {
                return urlObj.pathname.slice(1);
            }
            if (urlObj.pathname.startsWith('/shorts/')) {
                return urlObj.pathname.split('/')[2];
            }
            const videoId = urlObj.searchParams.get('v');
            return videoId && videoId.length === 11 ? videoId : null;
        }

        // Facebook
        if (urlObj.hostname.includes('facebook.com')) {
            const match = urlObj.pathname.match(/video(s)?\/(\d+)/);
            return match ? urlObj.href : null;
        }

        // Instagram
        if (urlObj.hostname.includes('instagram.com')) {
            const match = urlObj.pathname.match(/reel\/([A-Za-z0-9_-]+)/) || urlObj.pathname.match(/p\/([A-Za-z0-9_-]+)\/$/);
            return match ? urlObj.href : null;
        }

        // TikTok
        if (urlObj.hostname.includes('tiktok.com')) {
            const match = urlObj.pathname.match(/video\/(\d+)/);
            return match ? urlObj.href : null;
        }

        console.warn('Unsupported URL format:', url);
        return null;
    } catch (error) {
        console.error('Error parsing URL in getVideoId:', error);
        return null;
    }
}

/**
 * Sanitize HTML content using DOMPurify.
 * @param {string} content - The HTML content to sanitize.
 * @returns {string} - The sanitized HTML.
 */
function sanitizeContent(content) {
    return DOMPurify.sanitize(content);
}

/**
 * Update the inner HTML of a specified element with sanitized content.
 * @param {string} elementId - The ID of the HTML element.
 * @param {string} content - The content to inject.
 */
function updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    } else {
        console.warn(`Element with ID "${elementId}" not found.`);
    }
}

/**
 * Display an error message within the page.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
    const errorContainer = document.getElementById("error");
    if (errorContainer) {
        errorContainer.innerHTML = sanitizeContent(message);
        errorContainer.style.display = "block";
    } else {
        alert(message);
    }
}

/*******************************
 * Event Handlers
 *******************************/

document.getElementById("downloadBtn").addEventListener("click", debounce(function () {
    document.getElementById("loading").style.display = "initial";
    document.getElementById("downloadBtn").disabled = true;

    const inputUrl = document.getElementById("inputUrl").value.trim();
    if (!inputUrl) {
        displayError("Please enter a valid video URL.");
        document.getElementById("loading").style.display = "none";
        document.getElementById("downloadBtn").disabled = false;
        return;
    }

    const videoId = getVideoId(inputUrl);
    if (videoId) {
        handleClientSideDownload(videoId, inputUrl);
    } else {
        displayError("Invalid URL or unsupported platform.");
        document.getElementById("loading").style.display = "none";
        document.getElementById("downloadBtn").disabled = false;
    }
}, 300));

/*******************************
 * Response Handlers
 *******************************/

/**
 * Handle client-side download logic.
 * @param {string} videoId - The video ID or URL.
 * @param {string} inputUrl - The original input URL.
 */
function handleClientSideDownload(videoId, inputUrl) {
    document.getElementById("container").style.display = "block";
    document.getElementById("loading").style.display = "none";

    // Simulate video data (placeholder until backend provides metadata)
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; // Fallback for YouTube
    const videoHtml = `
        <video style='background: black url(${thumbnailUrl}) center center/cover no-repeat; width:100%; height:500px; border-radius:20px;'
               poster='${thumbnailUrl}' controls playsinline>
            <source src='${inputUrl}' type='video/mp4'>
        </video>`;
    const titleHtml = `<h3>Video Title (Placeholder)</h3>`;
    const descriptionHtml = `<h4><details><summary>View Description</summary>Description (Placeholder)</details></h4>`;
    const durationHtml = `<h5>Size (Placeholder)</h5>`;

    updateElement("thumb", videoHtml);
    updateElement("title", titleHtml);
    updateElement("description", descriptionHtml);
    updateElement("duration", durationHtml);

    generateDownloadButtonsClientSide(videoId, inputUrl);
}

/**
 * Generate download buttons client-side.
 * @param {string} videoId - The video ID or URL.
 * @param {string} inputUrl - The original input URL.
 */
function generateDownloadButtonsClientSide(videoId, inputUrl) {
    const downloadContainer = document.getElementById("download");
    downloadContainer.innerHTML = "";

    // Base URL for the backend proxy (update to your deployed server URL)
    const backendUrl = 'http://localhost:3000/download'; // Change to your server URL (e.g., https://yourserver.com/download)

    // Define available qualities (simplified for now)
    const qualities = ["mp3", "360p", "720p", "1080p"];
    qualities.forEach(quality => {
        const downloadUrl = `${backendUrl}?url=${encodeURIComponent(inputUrl)}`;
        downloadContainer.innerHTML += `
            <a href='${downloadUrl}' download target='_blank' rel='noopener noreferrer'>
                <button class='dlbtns' style='background:${getBackgroundColor(quality)}'>
                    ${sanitizeContent(quality)}
                </button>
            </a>`;
    });

    if (downloadContainer.innerHTML.trim() === "") {
        displayError("No download links available. Please try a different URL.");
        document.getElementById("container").style.display = "none";
    }
}
