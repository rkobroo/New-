/*******************************
 * Popup Modal Functionality
 *******************************/

window.addEventListener('load', function() {
    setTimeout(showPopup, 500);
});

function showPopup() {
    const modal = document.getElementById('popupModal');
    const popupInput = document.getElementById('popupInput');

    modal.style.display = 'block';

    setTimeout(() => {
        closePopup();
    }, 5000);

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

async function readClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        const popupInput = document.getElementById('popupInput');

        if (text && (text.includes('http://') || text.includes('https://') || text.includes('www.'))) {
            popupInput.value = text;
            popupInput.style.border = '2px solid #4CAF50';
            popupInput.style.background = 'rgba(76, 175, 80, 0.1)';
        }
    } catch (err) {
        console.log('Clipboard access not available or denied');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('closePopup');
    const pasteBtn = document.getElementById('pasteBtn');
    const searchBtn = document.getElementById('searchBtn');
    const popupInput = document.getElementById('popupInput');
    const modal = document.getElementById('popupModal');

    closeBtn.addEventListener('click', closePopup);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePopup();
        }
    });

    pasteBtn.addEventListener('click', async function() {
        try {
            const text = await navigator.clipboard.readText();
            popupInput.value = text;
            popupInput.focus();
        } catch (err) {
            popupInput.focus();
            alert('Please paste the URL manually using Ctrl+V');
        }
    });

    searchBtn.addEventListener('click', function() {
        const url = popupInput.value.trim();
        if (url) {
            document.getElementById('inputUrl').value = url;
            closePopup();
            setTimeout(() => {
                document.getElementById('downloadBtn').click();
            }, 500);
        } else {
            alert('Please enter a URL first');
        }
    });

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

function getBackgroundColor(downloadUrlItag) {
    if (formatColors.greenFormats.includes(downloadUrlItag)) return "green";
    if (formatColors.blueFormats.includes(downloadUrlItag)) return "#3800ff";
    return formatColors.defaultColor;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function getYouTubeVideoIds(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        const urlObj = new URL(url);
        const validHosts = ['www.youtube.com', 'youtube.com', 'youtu.be'];
        if (!validHosts.includes(urlObj.hostname)) return null;

        if (urlObj.hostname === 'youtu.be') {
            const videoId = urlObj.pathname.slice(1);
            return videoId.length === 11 ? videoId : null;
        }

        if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.startsWith('/shorts/')) return urlObj.pathname.split('/')[2];
            const videoId = urlObj.searchParams.get('v');
            return videoId && videoId.length === 11 ? videoId : null;
        }
        return null;
    } catch (error) {
        console.error('Error parsing URL:', error);
        return null;
    }
}

function sanitizeContent(content) {
    return DOMPurify.sanitize(content);
}

function updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) element.innerHTML = content;
}

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
    const requestUrl = `https://vkrdownloader.xyz/server?api_key=vkrdownloader&vkr=${encodeURIComponent(inputUrl)}`;
    const retryDelay = 2000;

    $.ajax({
        url: requestUrl,
        type: "GET",
        cache: true,
        async: true,
        crossDomain: true,
        dataType: 'json',
        timeout: 15000,
        success: function(data) {
            handleSuccessResponse(data, inputUrl);
        },
        error: function(xhr, status, error) {
            if (retries > 0) {
                let delay = retryDelay * Math.pow(2, 4 - retries);
                console.log(`Retrying in ${delay / 1000} seconds... (${retries} attempts left)`);
                setTimeout(() => makeRequest(inputUrl, retries - 1), delay);
            } else {
                const errorMessage = getErrorMessage(xhr, status, error);
                console.error(`Error Details: ${errorMessage}`);
                displayError("Unable to fetch the download link after several attempts. Please check the URL or try again later.");
                document.getElementById("loading").style.display = "none";
            }
        },
        complete: function() {
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
            if (response && response.error) message += `, Server Error: ${response.error}`;
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

/*******************************
 * Event Handlers
 *******************************/

document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById("downloadBtn");
    const loadingElement = document.getElementById("loading");
    const inputUrl = document.getElementById("inputUrl");

    if (downloadBtn && loadingElement && inputUrl) {
        downloadBtn.addEventListener("click", debounce(function() {
            const errorContainer = document.getElementById("error");
            if (errorContainer) errorContainer.style.display = "none";

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

    // Navigation
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            pages.forEach(page => page.style.display = 'none');
            document.getElementById(button.dataset.page).style.display = 'block';
        });
    });
    document.getElementById('home').style.display = 'block';
});

/*******************************
 * Response Handlers
 *******************************/

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
        const downloadUrls = videoData.downloads.map(download => download.url);
        const videoSource = videoData.source;
        const videoId = getYouTubeVideoIds(videoSource);
        const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : videoData.thumbnail;
        const description = videoData.description || 'Untitled';

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
        const descriptionHtml = description ? `<h4><details><summary>View Description</summary>${sanitizeContent(description)}</details></h4>` : "";

        if (videoId) updateElement("thumb", YTvideoHtml);
        else updateElement("thumb", videoHtml);
        updateElement("title", titleHtml);
        updateElement("description", descriptionHtml);

        generateDownloadButtons(data, inputUrl, description, videoData.platform || 'Unknown', videoData.author || 'Unknown');
    } else {
        displayError("Issue: Unable to retrieve the download link. Please check the URL and contact us on Social Media @himalpaudel112.");
        document.getElementById("loading").style.display = "none";
    }
}

async function forceDownload(url, filename) {
    console.log('Force download called:', url, filename);
    showDownloadFeedback('Starting download...');

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const blob = await response.blob();
        const directoryEntry = await new Promise((resolve, reject) => {
            window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, resolve, reject);
        });
        const fileEntry = await new Promise((resolve, reject) => {
            directoryEntry.root.getFile(filename, { create: true, exclusive: false }, resolve, reject);
        });
        const writer = await new Promise((resolve, reject) => {
            fileEntry.createWriter(resolve, reject);
        });
        await new Promise((resolve, reject) => {
            writer.onwriteend = resolve;
            writer.onerror = reject;
            writer.write(blob);
        });

        showDownloadFeedback('Download completed successfully! 🎉');

        // Update history
        let downloadHistory = JSON.parse(localStorage.getItem('downloadHistory')) || [];
        downloadHistory.push({ filename, platform: 'Unknown', author: 'Unknown', timestamp: new Date().toISOString() });
        localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
        updateHistory();
    } catch (error) {
        console.error('Download error:', error);
        showDownloadFeedback('Download failed, trying fallback...');

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function displayError(message) {
    showDownloadFeedback(message, 'error');

    const errorContainer = document.getElementById("error");
    if (errorContainer) {
        errorContainer.innerHTML = sanitizeContent(message);
        errorContainer.style.display = "block";

        setTimeout(() => {
            errorContainer.style.opacity = '0';
            setTimeout(() => {
                errorContainer.style.display = 'none';
                errorContainer.style.opacity = '1';
            }, 300);
        }, 8000);
    }
}

function showDownloadFeedback(message) {
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

    if (message.includes('success') || message.includes('completed') || message.includes('🎉')) {
        feedback.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    } else if (message.includes('error') || message.includes('failed')) {
        feedback.style.background = 'linear-gradient(135deg, #f44336, #da190b)';
    } else {
        feedback.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    }

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
 * @param {string} description - The video description for filename.
 * @param {string} platform - The platform mark.
 * @param {string} author - The author's username.
 */
function generateDownloadButtons(videoData, inputUrl, description, platform, author) {
    const downloadContainer = document.getElementById("download");
    downloadContainer.innerHTML = "";

    let downloadHistory = JSON.parse(localStorage.getItem('downloadHistory')) || [];
    const historyList = document.getElementById('historyList');

    if (videoData.data) {
        const downloads = videoData.data.downloads;
        const videoSource = videoData.data.source;
        const videoId = getYouTubeVideoIds(videoSource);
        const sanitizedDescription = (description || 'video').replace(/[<>:"/\\|?*]/g, '').substring(0, 50).trim();

        if (videoId) {
            const qualities = [
                { quality: "mp3", label: "🎵 Audio MP3", color: "#ff6b6b" },
                { quality: "360", label: "📱 360p Video", color: "#4ecdc4" },
                { quality: "720", label: "💻 720p HD", color: "#45b7d1" },
                { quality: "1080", label: "📺 1080p Full HD", color: "#96ceb4" }
            ];

            qualities.forEach(item => {
                const downloadUrl = `https://vkrdownloader.xyz/server/dl.php?q=${encodeURIComponent(item.quality)}&vkr=${encodeURIComponent(videoSource)}`;
                const filename = `${sanitizedDescription}_${item.quality}.${item.quality === 'mp3' ? 'mp3' : 'mp4'}`;

                const button = document.createElement('button');
                button.className = 'dlbtns';
                button.style.cssText = `background: ${item.color}; width: 100%; padding: 12px; border-radius: 8px; border: none; color: white; font-weight: bold; cursor: pointer; margin: 5px 0;`;
                button.innerHTML = item.label;

                button.addEventListener('click', async function(event) {
                    event.preventDefault();
                    this.disabled = true;
                    this.style.opacity = '0.6';
                    this.innerHTML = '⏳ Downloading...';

                    try {
                        showDownloadFeedback('Preparing download...');

                        const response = await fetch(downloadUrl);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                        const blob = await response.blob();
                        const objectUrl = window.URL.createObjectURL(blob);

                        // Save to internal storage using Cordova File plugin
                        const directoryEntry = await new Promise((resolve, reject) => {
                            window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, resolve, reject);
                        });
                        const fileEntry = await new Promise((resolve, reject) => {
                            directoryEntry.root.getFile(filename, { create: true, exclusive: false }, resolve, reject);
                        });
                        const writer = await new Promise((resolve, reject) => {
                            fileEntry.createWriter(resolve, reject);
                        });
                        await new Promise((resolve, reject) => {
                            writer.onwriteend = resolve;
                            writer.onerror = reject;
                            writer.write(blob);
                        });

                        showDownloadFeedback(`${item.label} downloaded successfully! 🎉`);

                        // Update history
                        downloadHistory.push({ filename: sanitizedDescription, platform, author, timestamp: new Date().toISOString() });
                        localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
                        updateHistory();

                        this.innerHTML = '✅ Downloaded';
                        this.style.background = '#4CAF50';
                    } catch (error) {
                        console.error('Download error:', error);
                        showDownloadFeedback(`${item.label} download failed`);
                        this.innerHTML = '📥 Retry';
                    } finally {
                        setTimeout(() => {
                            this.disabled = false;
                            this.style.opacity = '1';
                            this.innerHTML = item.label;
                            this.style.background = item.color;
                        }, 3000);
                    }
                });

                button.addEventListener('mouseover', function() {
                    this.style.opacity = '0.8';
                });

                button.addEventListener('mouseout', function() {
                    this.style.opacity = '1';
                });

                downloadContainer.appendChild(button);
            });
        }

        downloads.forEach(download => {
            if (download && download.url) {
                const downloadUrl = download.url;
                const itag = getParameterByName("itag", downloadUrl);
                const bgColor = getBackgroundColor(itag);
                const videoExt = download.format_id;
                const videoSize = download.size;
                const filename = `${sanitizedDescription}.mp4`;

                downloadContainer.innerHTML += `
                    <button class='dlbtns' style='background:${bgColor}' 
                            onclick='forceDownload("${downloadUrl}", "${filename}")'>
                        ${sanitizeContent(videoExt)} - ${sanitizeContent(videoSize)}
                    </button>`;

                // Update history for direct downloads
                downloadHistory.push({ filename: sanitizedDescription, platform, author, timestamp: new Date().toISOString() });
                localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
                updateHistory();
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

// Update history display
function updateHistory() {
    const historyList = document.getElementById('historyList');
    let downloadHistory = JSON.parse(localStorage.getItem('downloadHistory')) || [];
    historyList.innerHTML = '';
    downloadHistory.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = `${item.filename} - ${item.platform} - ${item.author} - ${new Date(item.timestamp).toLocaleString()}`;
        historyList.appendChild(li);
    });
}
