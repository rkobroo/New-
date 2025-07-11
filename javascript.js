/*******************************
 * Popup Modal Functionality
 *******************************/

// Show popup when page loads
window.addEventListener('load', function() {
    setTimeout(showPopup, 500); // Small delay for smooth loading
});

function showPopup() {
    const modal = document.getElementById('popupModal');
    const popupInput = document.getElementById('popupInput');

    modal.style.display = 'block';

    // Auto-close after 5 seconds
    setTimeout(() => {
        closePopup();
    }, 5000);

    // Try to read clipboard automatically
    readClipboard();
}

function closePopup() {
    const modal = document.getElementById('popupModal');
    modal.classList.add('closing');

    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 300);
}

// Clipboard functionality
async function readClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        const popupInput = document.getElementById('popupInput');

        // Check if clipboard contains a URL
        if (text && (text.includes('http://') || text.includes('https://') || text.includes('www.'))) {
            popupInput.value = text;
            popupInput.style.border = '2px solid #4CAF50';
            popupInput.style.background = 'rgba(76, 175, 80, 0.1)';
        }
    } catch (err) {
        console.log('Clipboard access not available or denied');
    }
}

// Event listeners for popup
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('closePopup');
    const pasteBtn = document.getElementById('pasteBtn');
    const searchBtn = document.getElementById('searchBtn');
    const popupInput = document.getElementById('popupInput');
    const modal = document.getElementById('popupModal');

    // Close button
    closeBtn.addEventListener('click', closePopup);

    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePopup();
        }
    });

    // Paste button
    pasteBtn.addEventListener('click', async function() {
        try {
            const text = await navigator.clipboard.readText();
            popupInput.value = text;
            popupInput.focus();
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            popupInput.focus();
            alert('Please paste the URL manually using Ctrl+V');
        }
    });

    // Search button
    searchBtn.addEventListener('click', function() {
        const url = popupInput.value.trim();
        if (url) {
            // Transfer to main input and trigger download
            document.getElementById('inputUrl').value = url;
            closePopup();

            // Trigger download process
            setTimeout(() => {
                document.getElementById('downloadBtn').click();
            }, 500);
        } else {
            alert('Please enter a URL first');
        }
    });

    // Enter key support
    popupInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
});

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
// Function to get YouTube video IDs from a URL, including Shorts URLs
function getYouTubeVideoIds(url) {
    // Validate the input
    if (!url || typeof url !== 'string') {
        console.error('Invalid URL provided to getYouTubeVideoId:', url);
        return null;
    }

    try {
        // Create a URL object to parse the URL
        const urlObj = new URL(url);

        // Check if the hostname belongs to YouTube or YouTube short links
        const validHosts = ['www.youtube.com', 'youtube.com', 'youtu.be'];
        if (!validHosts.includes(urlObj.hostname)) {
            console.warn('URL does not belong to YouTube:', url);
            return null;
        }

        // For youtu.be (short link), the video ID is in the pathname
        if (urlObj.hostname === 'youtu.be') {
            const videoId = urlObj.pathname.slice(1); // Remove the leading '/'
            return videoId.length === 11 ? videoId : null;
        }

        // For youtube.com URLs, look for 'v' or 'shorts' in query or pathname
        if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.startsWith('/shorts/')) {
                // Shorts video ID is in the pathname after "/shorts/"
                return urlObj.pathname.split('/')[2];
            }

            // Regular video URLs have 'v' as a query parameter
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
    // Properly escape regex special characters
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
 * Make an AJAX GET request with retry capability.
 * @param {string} inputUrl - The input URL for the request.
 * @param {number} retries - Number of retry attempts remaining.
 */
function makeRequest(inputUrl, retries = 4) {
    const requestUrl = `https://vkrdownloader.xyz/server?api_key=vkrdownloader&vkr=${encodeURIComponent(inputUrl)}`;
    const retryDelay = 2000; // Initial retry delay in milliseconds
    const maxRetries = retries;

    $.ajax({
        url: requestUrl,
        type: "GET",
        cache: true,
        async: true,
        crossDomain: true,
        dataType: 'json',
        timeout: 15000, // Extended timeout for slower networks
        success: function (data) {
            handleSuccessResponse(data, inputUrl);
        },
        error: function (xhr, status, error) {
            if (retries > 0) {
                let delay = retryDelay * Math.pow(2, maxRetries - retries); // Exponential backoff
                console.log(`Retrying in ${delay / 1000} seconds... (${retries} attempts left)`);
                setTimeout(() => makeRequest(inputUrl, retries - 1), delay);
            } else {
                const errorMessage = getErrorMessage(xhr, status, error);
                console.error(`Error Details: ${errorMessage}`);
                displayError("Unable to fetch the download link after several attempts. Please check the URL or try again later.");
                document.getElementById("loading").style.display = "none";
            }
        },
        complete: function () {
            const downloadBtn = document.getElementById("downloadBtn");
            const loadingElement = document.getElementById("loading");

            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = "Download";
            }

            if (loadingElement) {
                loadingElement.style.opacity = "0";
                setTimeout(() => {
                    loadingElement.style.display = "none";
                }, 300);
            }
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
                message += `, Server Error: ${response.error}`;
            }
        } catch (e) {
            message += `, Unable to parse server response.`;
        }
    }

    switch (statusCode) {
        case 0: return "Network Error: The server is unreachable.";
        case 400: return "Bad Request: The input URL might be incorrect.";
        case 401: return "Unauthorized: Please check the API key.";
        case 429: return "Too Many Requests: You are being rate-limited.";
        case 503: return "Service Unavailable: The server is temporarily overloaded.";
        default: return `${message}, HTTP ${statusCode}: ${xhr.statusText || error}`;
    }
}

/**
 * Generate a detailed error message based on the XHR response.
 * @param {Object} xhr - The XMLHttpRequest object.
 * @param {string} status - The status string.
 * @param {string} error - The error message.
 * @returns {string} - The formatted error message.
 */

/*******************************
 * Event Handlers
 *******************************/

/**
 * Handle the "Download" button click event.
 */
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById("downloadBtn");
    const loadingElement = document.getElementById("loading");
    const inputUrl = document.getElementById("inputUrl");

    if (downloadBtn && loadingElement && inputUrl) {
        downloadBtn.addEventListener("click", debounce(function () {
            // Clear any previous errors
            const errorContainer = document.getElementById("error");
            if (errorContainer) {
                errorContainer.style.display = "none";
            }

            // Show loading with smooth transition
            loadingElement.style.display = "initial";
            loadingElement.style.opacity = "0";
            setTimeout(() => {
                loadingElement.style.opacity = "1";
            }, 10);

            downloadBtn.disabled = true;
            downloadBtn.innerHTML = "Processing...";

            const url = inputUrl.value.trim();
            if (!url) {
                displayError("Please enter a valid video URL.");
                loadingElement.style.opacity = "0";
                setTimeout(() => {
                    loadingElement.style.display = "none";
                }, 300);
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = "Download";
                return;
            }

            makeRequest(url);
        }, 300));
    }
});

/**
 * Display an error message within the page instead of using alert.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
    // Use the feedback system instead of alert
    showDownloadFeedback(message, 'error');

    // Also try to display in error container if it exists
    const errorContainer = document.getElementById("error");
    if (errorContainer) {
        errorContainer.innerHTML = sanitizeContent(message);
        errorContainer.style.display = "block";

        // Auto-hide error after 8 seconds
        setTimeout(() => {
            errorContainer.style.opacity = '0';
            setTimeout(() => {
                errorContainer.style.display = 'none';
                errorContainer.style.opacity = '1';
            }, 300);
        }, 8000);
    }
}

/*******************************
 * Response Handlers
 *******************************/

/**
 * Handle successful AJAX responses.
 * @param {Object} data - The response data from the server.
 * @param {string} inputUrl - The original input URL.
 */
function handleSuccessResponse(data, inputUrl) {
    const container = document.getElementById("container");
    const loading = document.getElementById("loading");

    if (loading) {
        loading.style.opacity = "0";
        setTimeout(() => {
            loading.style.display = "none";
        }, 300);
    }

    if (container) {
        container.style.display = "block";
        setTimeout(() => {
            container.classList.add("show");
        }, 10);
    }

    if (data.data) {
        const videoData = data.data;

        // Extract necessary data
        //const thumbnailUrl = videoData.thumbnail;
        const downloadUrls = videoData.downloads.map(download => download.url);
        const videoSource = videoData.source;
        const videoId = getYouTubeVideoIds(videoSource);
        const thumbnailUrl = videoId 
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : videoData.thumbnail;
        // Construct video HTML
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
        displayError("Issue: Unable to retrieve the download link. Please check the URL and contact us on Social Media @himalpaudel112.");
        document.getElementById("loading").style.display = "none";
    }
}

// Function to force download
async function forceDownload(url, filename) {
    console.log('Force download called:', url, filename);

    showDownloadFeedback('Starting download...');

    try {
        // Method 1: Fetch the file and create blob for download
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        setTimeout(() => {
            window.URL.revokeObjectURL(downloadUrl);
        }, 1000);

        showDownloadFeedback('Download completed successfully! 🎉');

    } catch (error) {
        console.error('Download error:', error);

        // Fallback: Direct link method
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        link.setAttribute('target', '_self');

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showDownloadFeedback('Download initiated via fallback method');
    }
}

// Function to show download feedback
function showDownloadFeedback(message) {
    // Create or get existing feedback element
    let feedback = document.getElementById('downloadFeedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'downloadFeedback';
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            border: 2px solid #ff0000;
            animation: rgbBorder 2s linear infinite;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.style.opacity = '1';
    feedback.style.display = 'block';
    feedback.style.transform = 'translateX(0)';

    // Update background color based on message type
    if (message.includes('success') || message.includes('completed') || message.includes('🎉')) {
        feedback.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    } else if (message.includes('error') || message.includes('failed')) {
        feedback.style.background = 'linear-gradient(135deg, #f44336, #da190b)';
    } else {
        feedback.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    }

    // Hide after 4 seconds
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateX(100%)';
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 300);
    }, 4000);
}

/**
 * Generate download buttons with dynamic colors and labels.
 * @param {Object} videoData - The video data from the server.
 * @param {string} inputUrl - The original input URL.
 */
function generateDownloadButtons(videoData, inputUrl) {
    const downloadContainer = document.getElementById("download");
    downloadContainer.innerHTML = "";

    if (videoData.data) {
        const downloads = videoData.data.downloads;
        const videoSource = videoData.data.source;

        // Add YouTube specific button if applicable
        const videoId = getYouTubeVideoIds(videoSource);
        if (videoId) {
          //  downloadContainer.innerHTML += `
          //      <a href='https://inv.nadeko.net/latest_version?id=${videoId}&itag=18&local=true' target='_blank' rel='noopener noreferrer'>
          //          <button class='dlbtns' style='background: green'>Download Video (YouTube)</button>
          //      </a>`;
            const qualities = [
                { quality: "mp3", label: "🎵 Audio MP3", color: "#ff6b6b" },
                { quality: "360", label: "📱 360p Video", color: "#4ecdc4" },
                { quality: "720", label: "💻 720p HD", color: "#45b7d1" },
                { quality: "1080", label: "📺 1080p Full HD", color: "#96ceb4" }
            ];

            qualities.forEach(item => {
                const downloadUrl = `https://vkrdownloader.xyz/server/dl.php?q=${encodeURIComponent(item.quality)}&vkr=${encodeURIComponent(videoSource)}`;
                const filename = `RKO_${item.quality}_${Date.now()}.${item.quality === 'mp3' ? 'mp3' : 'mp4'}`;

                const button = document.createElement('button');
                button.className = 'dlbtns';
                button.style.cssText = `background: ${item.color}; width: 100%; padding: 12px; border-radius: 8px; border: none; color: white; font-weight: bold; cursor: pointer; margin: 5px 0;`;
                button.innerHTML = item.label;

                button.addEventListener('mouseover', function() {
                    this.style.opacity = '0.8';
                });

                button.addEventListener('mouseout', function() {
                    this.style.opacity = '1';
                });

                button.addEventListener('click', async function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    console.log('Quality button clicked:', item.quality);
                    console.log('Download URL:', downloadUrl);

                    // Disable button temporarily to prevent multiple clicks
                    this.disabled = true;
                    this.style.opacity = '0.6';
                    this.innerHTML = '⏳ Downloading...';

                    try {
                        showDownloadFeedback('Preparing download...');

                        // Fetch the file and create blob for download
                        const response = await fetch(downloadUrl);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const blob = await response.blob();
                        const objectUrl = window.URL.createObjectURL(blob);

                        // Create download link
                        const link = document.createElement("a");
                        link.href = objectUrl;
                        link.download = filename;
                        link.style.display = 'none';

                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        // Clean up the blob URL
                        setTimeout(() => {
                            window.URL.revokeObjectURL(objectUrl);
                        }, 1000);

                        showDownloadFeedback(`${item.label} downloaded successfully! 🎉`);
                        this.innerHTML = '✅ Downloaded';
                        this.style.background = '#4CAF50';

                    } catch (error) {
                        console.error('Download error:', error);

                        // Fallback: Direct link method
                        const link = document.createElement("a");
                        link.href = downloadUrl;
                        link.download = filename;
                        link.style.display = 'none';
                        link.setAttribute('target', '_self');

                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        showDownloadFeedback(`${item.label} download started via fallback`);
                        this.innerHTML = '📥 Downloaded';
                    } finally {
                        // Re-enable button after 3 seconds
                        setTimeout(() => {
                            this.disabled = false;
                            this.style.opacity = '1';
                            this.innerHTML = item.label;
                            this.style.background = item.color;
                        }, 3000);
                    }
                });

                downloadContainer.appendChild(button);
            });
        }

        // Generate download buttons for available formats
        downloads.forEach(download => {
            if (download && download.url) {
                const downloadUrl = download.url;
                const itag = getParameterByName("itag", downloadUrl);
                const bgColor = getBackgroundColor(itag);
                const videoExt = download.format_id;
                const videoSize = download.size;

                downloadContainer.innerHTML += `
                    <button class='dlbtns' style='background:${bgColor}' 
                            onclick='forceDownload("${downloadUrl}", "${sanitizeContent(videoExt)}_${sanitizeContent(videoSize)}.mp4")'>
                        ${sanitizeContent(videoExt)} - ${sanitizeContent(videoSize)}
                    </button>`;
            }
        });
    } else {
        displayError("No download links found or data structure is incorrect.");
        document.getElementById("loading").style.display = "none";
    }

    // If no download buttons or iframes were added, notify the user
    if (downloadContainer.innerHTML.trim() === "") {
        displayError("Server Down due to Too Many Requests. Please contact us on Social Media @himalpaudel112.");
        document.getElementById("container").style.display = "none";
        // Redirecting the user to an alternative download page
       // window.location.href = `https://vkrdownloader.xyz/download.php?vkr=${encodeURIComponent(inputUrl)}`;
    }
                         }
