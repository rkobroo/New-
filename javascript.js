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
 * Get background color based on format itag.
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
 * Debounce function to limit the execution frequency of a function.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The wait time (in milliseconds).
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
 * Extract YouTube video ID from URL.
 * @param {string} url - YouTube URL.
 * @returns {string|null} - Video ID or null if not found.
 */
// Function to get YouTube video ID from URL, including Shorts URLs
function getYouTubeVideoId(url) {
    // Validate input
    if (!url || typeof url !== 'string') {
        console.error('Invalid URL provided to getYouTubeVideoId:', url);
        return null;
    }

    try {
        // Create URL object to parse the URL
        const urlObj = new URL(url);

        // Check if hostname belongs to YouTube or YouTube short links
        const validHosts = ['www.youtube.com', 'youtube.com', 'youtu.be'];
        if (!validHosts.includes(urlObj.hostname)) {
            console.warn('URL does not belong to YouTube:', url);
            return null;
        }

        // For youtu.be (short links), video ID is in the pathname
        if (urlObj.hostname === 'youtu.be') {
            const videoId = urlObj.pathname.slice(1); // Remove leading '/'
            return videoId.length === 11 ? videoId : null;
        }

        // For youtube.com URLs, look for 'v' or 'shorts' in query or pathname
        if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.startsWith('/shorts/')) {
                // Shorts video ID is in pathname after "/shorts/"
                return urlObj.pathname.split('/')[2];
            }

            // Regular video URL has 'v' as a query parameter
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
 * @param {string} content - HTML content to sanitize.
 * @returns {string} - Sanitized HTML content.
 */
function sanitizeContent(content) {
    return DOMPurify.sanitize(content);
}

/**
 * Update the inner HTML content of a specified element with sanitized content.
 * @param {string} elementId - ID of the HTML element.
 * @param {string} content - Content to insert.
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
 * Get query parameter value by name from a URL.
 * @param {string} name - Name of the parameter.
 * @param {string} url - URL to extract parameter from.
 * @returns {string} - Parameter value or empty string if not found.
 */
function getParameterByName(name, url) {
    // Escape special regex characters
    name = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    
    if (!results) return '';
    if (!results[2]) return '';
    
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/*******************************
 * AJAX Request with Retry Logic
 *******************************/

/**
 * Perform an AJAX GET request with retry capability.
 * @param {string} inputUrl - Input URL for the request.
 * @param {number} retries - Number of retries remaining.
 */
function makeRequest(inputUrl, retries = 4) {
    const requestUrl = `https://vkrdownloader.xyz/server?api_key=vkrdownloader&vkr=${encodeURIComponent(inputUrl)}`;
    const retryDelay = 2000; // Initial retry delay (in milliseconds)
    const maxRetries = retries;

    $.ajax({
        url: requestUrl,
        type: "GET",
        cache: true,
        async: true,
        crossDomain: true,
        dataType: 'json',
        timeout: 15000, // Extended timeout for slow networks
        success: function (data) {
            handleSuccessResponse(data, inputUrl);
        },
        error: function (xhr, status, error) {
            if (retries > 0) {
                let delay = retryDelay * Math.pow(2, maxRetries - retries); // Exponential backoff
                console.log(`Retrying after ${delay / 1000} seconds... (${retries} attempts remaining)`);
                setTimeout(() => makeRequest(inputUrl, retries - 1), delay);
            } else {
                const errorMessage = getErrorMessage(xhr, status, error);
                console.error(`Error details: ${errorMessage}`);
                displayError("Unable to fetch download links after multiple attempts. Please check the URL or try again later.");
                document.getElementById("loading").style.display = "none";
            }
        },
        complete: function () {
            document.getElementById("downloadBtn").disabled = false; // Re-enable button
        }
    });
}

function getErrorMessage(xhr, status, error) {
    const statusCode = xhr.status;
    let message = `Status: ${status}, Error: ${error}`;

    if (xhr.responseText) {
        try {
            const response = JSON.parse(xhr.responseText);
            if (response && response.error) {
                message += `, Server error: ${response.error}`;
            }
        } catch (e) {
            message += `, Unable to parse server response.`;
        }
    }

    switch (statusCode) {
        case 0: return "Network error: Unable to connect to the server.";
        case 400: return "Bad request: The input URL may be invalid.";
        case 401: return "Unauthorized: Please check the API key.";
        case 429: return "Too many requests: You are being rate-limited.";
        case 503: return "Service unavailable: The server is temporarily overloaded.";
        default: return `${message}, HTTP ${statusCode}: ${xhr.statusText || error}`;
    }
}

function displayError(message) {
    // Assume there is a placeholder element for error messages
    const errorElement = document.getElementById("errorMessage");
    if (errorElement) {
        errorElement.innerText = message;
        errorElement.style.display = "block";
    }
}

/*******************************
 * Event Handlers
 *******************************/

/**
 * Handle the click event for the "Download" button.
 */
document.getElementById("downloadBtn").addEventListener("click", debounce(function () {
    document.getElementById("loading").style.display = "initial";
    document.getElementById("downloadBtn").disabled = true; // Disable button

    const inputUrl = document.getElementById("inputUrl").value.trim();
    if (!inputUrl) {
        displayError("Please enter a valid YouTube URL.");
        document.getElementById("loading").style.display = "none";
        document.getElementById("downloadBtn").disabled = false;
        return;
    }

    makeRequest(inputUrl); // Perform AJAX request with retry logic
}, 300)); // Adjust delay if needed

/**
 * Display error message on the page instead of using alert.
 * @param {string} message - Error message to display.
 */
function displayError(message) {
    const errorContainer = document.getElementById("error");
    if (errorContainer) {
        errorContainer.innerHTML = sanitizeContent(message);
        errorContainer.style.display = "block";
    } else {
        // Fallback to alert if no error container exists
        alert(message);
    }
}

/*******************************
 * Response Handling
 *******************************/

/**
 * Handle successful AJAX response.
 * @param {Object} data - Response data from the server.
 * @param {string} inputUrl - Original input URL.
 */
function handleSuccessResponse(data, inputUrl) {
    document.getElementById("container").style.display = "block";
    document.getElementById("loading").style.display = "none";

    if (data.data) {
        const videoData = data.data;
        
        // Extract necessary data
        const downloadUrls = videoData.downloads.map(download => download.url);
        const videoSource = videoData.source;
        const videoId = getYouTubeVideoId(videoSource);
        const thumbnailUrl = videoId 
            ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            : videoData.thumbnail;
        // Create HTML for video
        const videoHtml = `
            <video style='background: black url(${thumbnailUrl}) center center/cover no-repeat; width:100%; height:500px; border-radius:20px;' 
                   poster='${thumbnailUrl}' controls playsinline>
                <source src='${videoData.downloads[5]?.url || ''}' type='video/mp4'>
                ${Array.isArray(downloadUrls) ? downloadUrls.map(url => `<source src='${url}' type='video/mp4'>`).join('') : ''}
                <source src='https://vkrdownloader.xyz/server/dl.php?vkr=${encodeURIComponent(inputUrl)}' type='video/mp4'>
            </video>`;
        const YTvideoHtml = `
            <video style='background: black url(${thumbnailUrl}) center center/cover no-repeat; width:100%; height:500px; border-radius:20px;' 
                   poster='${thumbnailUrl}' controls playsinline>
                 <source src='https://vkrdownloader.xyz/server/redirect.php?vkr=https://youtu.be/${videoId}' type='video/mp4'>
                 <source src='https://vkrdownloader.xyz/server/dl.php?vkr=${inputUrl}' type='video/mp4'>
                ${downloadUrls.map(url => `<source src='${url}' type='video/mp4'>`).join('')}
            </video>`;
        const titleHtml = videoData.title ? `<h3>${sanitizeContent(videoData.title)}</h3>` : "";
        const descriptionHtml = videoData.description ? `<h4><details><summary>View Description</summary>${sanitizeContent(videoData.description)}</details></h4>` : "";
        const durationHtml = videoData.size ? `<h5>${sanitizeContent(videoData.size)}</h5>` : "";

        // Update DOM elements
        if (videoId) {
            updateElement("thumb", YTvideoHtml);
        } else {
            updateElement("thumb", videoHtml);
        }
        updateElement("title", titleHtml);
        updateElement("description", descriptionHtml);
        updateElement("duration", durationHtml);

        // Generate download buttons
        generateDownloadButtons(data, inputUrl);
    } else {
        displayError("Issue: Unable to fetch download links. Please check the URL and contact us via social media @TheOfficialVKr.");
        document.getElementById("loading").style.display = "none";
    }
}

/**
 * Extract YouTube video ID from URL (duplicate function removed, using getYouTubeVideoId).
 */

/**
 * Display error message in the container.
 * @param {string} message - Error message to display.
 */
function displayError(message) {
    const container = document.getElementById("container");
    container.innerHTML = `<div style="color: red;">${sanitizeContent(message)}</div>`;
}

/**
 * Sanitize content to prevent XSS attacks (already defined above).
 */

/**
 * Generate download buttons with dynamic colors and labels.
 * @param {Object} videoData - Video data from the server.
 * @param {string} inputUrl - Original input URL.
 */
function generateDownloadButtons(videoData, inputUrl) {
    const downloadContainer = document.getElementById("download");
    downloadContainer.innerHTML = "";
    downloadContainer.style.display = "grid";
    downloadContainer.style.gridTemplateColumns = "repeat(2, 1fr)";
    downloadContainer.style.gap = "30px";
    downloadContainer.style.justifyContent = "center";
    downloadContainer.style.maxWidth = "600px";
    downloadContainer.style.margin = "0 auto";

    if (videoData.data) {
        const videoSource = videoData.data.source;
        const videoId = getYouTubeVideoId(videoSource);
        if (videoId) {
            const qualities = ["mp3", "360", "720", "1080"];
            const labels = ["Mp3", "Mp4 (360p)", "Mp4 (720p)", "Mp4 (1080p)"];
            qualities.forEach((quality, index) => {
                const iframeSrc = `https://vkrdownloader.xyz/server/dlbtn.php?q=${encodeURIComponent(quality)}&vkr=${encodeURIComponent(videoSource)}`;
                downloadContainer.innerHTML += `
                    <div style="text-align: center;">
                        <span style="display: block; font-size: 14px; margin-bottom: 5px;">${labels[index]}</span>
                        <iframe id="download-iframe-${index}" 
                                style="border: 0; outline: none; width: 200px; max-height: 45px; height: 45px !important; overflow: hidden;" 
                                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-downloads-without-user-activation" 
                                scrolling="no"
                                src="${iframeSrc}">
                        </iframe>
                    </div>`;
            });
        }
    } else {
        displayError("No download links found or incorrect data structure.");
        document.getElementById("loading").style.display = "none";
    }
    if (downloadContainer.innerHTML.trim() === "") {
        displayError("Server is down due to too many requests. Please contact us via social media @TheOfficialVKr.");
        document.getElementById("container").style.display = "none";
    }
    }
