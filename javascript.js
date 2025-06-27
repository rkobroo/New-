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
 * AJAX Request with Retry Logic
 *******************************/

function makeRequest(inputUrl, retries = 4) {
    const requestUrl = `youtube.php`; // Use local PHP file
    const retryDelay = 2000; // Initial retry delay in milliseconds
    const maxRetries = retries;

    $.ajax({
        url: requestUrl,
        type: "POST", // Change to POST to match youtube.php
        data: { url: inputUrl }, // Send URL as POST data
        cache: true,
        async: true,
        crossDomain: true,
        dataType: 'json',
        timeout: 15000,
        success: function (data) {
            handleSuccessResponse(data, inputUrl);
        },
        error: function (xhr, status, error) {
            if (retries > 0) {
                let delay = retryDelay * Math.pow(2, maxRetries - retries);
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
            document.getElementById("downloadBtn").disabled = false; // Re-enable the button
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
        displayError("Please enter a valid YouTube URL.");
        document.getElementById("loading").style.display = "none";
        document.getElementById("downloadBtn").disabled = false;
        return;
    }

    makeRequest(inputUrl); // Make the AJAX request with retry logic
}, 300));

/*******************************
 * Response Handlers
 *******************************/

function handleSuccessResponse(data, inputUrl) {
    document.getElementById("container").style.display = "block";
    document.getElementById("loading").style.display = "none";

    if (data.data) {
        const videoData = data.data;

        const thumbnailUrl = videoData.thumbnail;
        const downloadUrls = videoData.downloads.map(download => download.url);
        const videoSource = videoData.source;
        const videoId = getYouTubeVideoIds(videoSource);

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

        if (videoId) {
            updateElement("thumb", YTvideoHtml);
        } else {
            updateElement("thumb", videoHtml);
        }
        updateElement("title", titleHtml);
        updateElement("description", descriptionHtml);
        updateElement("duration", durationHtml);

        generateDownloadButtons(data, inputUrl);
    } else {
        displayError("Issue: Unable to retrieve the download link. Please check the URL and contact us on Social Media @himalpaudel112.");
        document.getElementById("loading").style.display = "none";
    }
}

function generateDownloadButtons(videoData, inputUrl) {
    const downloadContainer = document.getElementById("download");
    downloadContainer.innerHTML = "";

    if (videoData.data) {
        const downloads = videoData.data.downloads;
        const videoSource = videoData.data.source;

        const videoId = getYouTubeVideoIds(videoSource);
        if (videoId) {
            const qualities = ["mp3", "360", "720", "1080"];
            qualities.forEach(quality => {
                downloadContainer.innerHTML += `
      <iframe style="border: 0; outline: none; min-width: 150px; max-height: 45px; height: 45px !important; margin-top: 10px; overflow: hidden;"   
       sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-downloads-without-user-activation"  scrolling="no"
       src="https://vkrdownloader.xyz/server/dlbtn.php?q=${encodeURIComponent(quality)}&vkr=${encodeURIComponent(videoSource)}">
       </iframe>`;
            });
        }

        downloads.forEach(download => {
            if (download && download.url) {
                const downloadUrl = download.url;
                const itag = getParameterByName("itag", downloadUrl);
                const bgColor = getBackgroundColor(itag);
                const videoExt = download.format_id;
                const videoSize = download.size;

                downloadContainer.innerHTML += `
                    <a href='${downloadUrl}' target='_blank' rel='noopener noreferrer'>
                        <button class='dlbtns' style='background:${bgColor}'>
                            ${sanitizeContent(videoExt)} - ${sanitizeContent(videoSize)}
                        </button>
                    </a>`;
            }
        });
    } else {
        displayError("No download links found or data structure is incorrect.");
        document.getElementById("loading").style.display = "none";
    }

    if (downloadContainer.innerHTML.trim() === "") {
        displayError("Server Down due to Too Many Requests. Please contact us on Social Media @himalpaudel112.");
        document.getElementById("container").style.display = "none";
    }
}
