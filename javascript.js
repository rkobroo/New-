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
 * Extract YouTube video ID from a given URL.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} - The video ID or null if not found.
 */
function getYouTubeVideoIds(url) {
    if (!url || typeof url !== 'string') {
        console.error('Invalid URL provided to getYouTubeVideoId:', url);
        return null;
    }
    try {
        const urlObj = new URL(url);
        const validHosts = ['www.youtube.com', 'youtube.com', 'youtu.be'];
        if (!validHosts.includes(urlObj.hostname)) {
            console.warn('URL does not belong to YouTube:', url);
            return null;
        }
        if (urlObj.hostname === 'youtu.be') {
            const videoId = urlObj.pathname.slice(1);
            return videoId.length === 11 ? videoId : null;
        }
        if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.startsWith('/shorts/')) {
                return urlObj.pathname.split('/')[2];
            }
            const videoId = urlObj.searchParams.get('v');
            return videoId && videoId.length === 11 ? videoId : null;
        }
        console.warn('Unrecognized YouTube URL format:', url);
        return null;
    } catch (error) {
        console.error('Error parsing URL in getYouTubeVideoId:', error);
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
 * Retrieve a query parameter value by name from a URL.
 * @param {string} name - The name of the parameter.
 * @param {string} url - The URL to extract the parameter from.
 * @returns {string} - The parameter value or an empty string if not found.
 */
function getParameterByName(name, url) {
    name = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) return '';
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/*******************************
 * Event Handlers
 *******************************/

document.getElementById("downloadBtn").addEventListener("click", debounce(function () {
    document.getElementById("loading").style.display = "initial";
    document.getElementById("downloadBtn").disabled = true;

    const inputUrl = document.getElementById("inputUrl").value.trim();
    if (!inputUrl) {
        displayError("Please enter a valid YouTube URL.");
        document.getElementById("loading").style.display = "none";
        document.getElementById("downloadBtn").disabled = false;
        return;
    }

    // Attempt to extract video ID and construct a direct download link
    const videoId = getYouTubeVideoIds(inputUrl);
    if (videoId) {
        handleClientSideDownload(videoId, inputUrl);
    } else {
        displayError("Invalid YouTube URL or unsupported format.");
        document.getElementById("loading").style.display = "none";
        document.getElementById("downloadBtn").disabled = false;
    }
}, 300));

/**
 * Display an error message within the page instead of using alert.
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
 * Response Handlers
 *******************************/

/**
 * Handle client-side download logic.
 * @param {string} videoId - The YouTube video ID.
 * @param {string} inputUrl - The original input URL.
 */
function handleClientSideDownload(videoId, inputUrl) {
    document.getElementById("container").style.display = "block";
    document.getElementById("loading").style.display = "none";

    // Simulate video data (you'd need to scrape this or use a predefined structure)
    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const videoHtml = `
        <video style='background: black url(${thumbnailUrl}) center center/cover no-repeat; width:100%; height:500px; border-radius:20px;'
               poster='${thumbnailUrl}' controls playsinline>
            <source src='https://www.youtube.com/embed/${videoId}?autoplay=1' type='video/mp4'>
        </video>`;
    const titleHtml = `<h3>Video Title (Placeholder)</h3>`;
    const descriptionHtml = `<h4><details><summary>View Description</summary>Description (Placeholder)</details></h4>`;
    const durationHtml = `<h5>Size (Placeholder)</h5>`;

    updateElement("thumb", videoHtml);
    updateElement("title", titleHtml);
    updateElement("description", descriptionHtml);
    updateElement("duration", durationHtml);

    generateDownloadButtonsClientSide(videoId);
}

/**
 * Generate download buttons client-side.
 * @param {string} videoId - The YouTube video ID.
 */
function generateDownloadButtonsClientSide(videoId) {
    const downloadContainer = document.getElementById("download");
    downloadContainer.innerHTML = "";

    // Simulate download options (replace with actual scraped URLs if possible)
    const qualities = ["mp3", "360", "720", "1080"];
    qualities.forEach(quality => {
        downloadContainer.innerHTML += `
            <a href='https://www.youtube.com/watch?v=${videoId}' download target='_blank' rel='noopener noreferrer'>
                <button class='dlbtns' style='background:${getBackgroundColor(quality)}'>
                    ${sanitizeContent(quality)}p
                </button>
            </a>`;
    });

    if (downloadContainer.innerHTML.trim() === "") {
        displayError("No download links available. Please try a different URL.");
        document.getElementById("container").style.display = "none";
    }
}
