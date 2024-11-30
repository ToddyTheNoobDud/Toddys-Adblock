const uiStyle = `
    #adblock-ui {
        display: none;
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(18, 18, 18, 0.9);
        color: #00BFFF;
        padding: 20px;
        border-radius: 15px;
        z-index: 9999;
        font-family: 'Arial', sans-serif;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.7);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        width: 300px;
    }
    #adblock-ui.show {
        display: block;
    }
    #adblock-ui h3 {
        margin: 0;
        font-size: 22px;
        font-weight: bold;
        text-align: center;
        padding-bottom: 10px;
    }
    #adblock-ui p {
        margin: 5px 0;
        font-size: 16px;
        text-align: center;
        color: #B0C4DE;
    }
    #adblock-ui.clickable {
        cursor: pointer;
    }
`;

(() => {
    const uiDiv = document.createElement('div');
    uiDiv.id = 'adblock-ui';
    uiDiv.classList.add('clickable');
    uiDiv.innerHTML = `
        <h3>Toddys Adblock</h3>
        <p>Made by mushroom0162</p>
        <p>Universal adblock Disabled (WIP)</p>
        <p>Static filters enabled</p>
        <p>YouTube adblock enabled</p>
    `;
    document.head.insertAdjacentHTML('beforeend', `<style>${uiStyle}</style>`);
    document.body.appendChild(uiDiv);
    uiDiv.addEventListener('click', () => {
        uiDiv.classList.toggle('show');
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "toggleUI") {
            uiDiv.classList.toggle('show');
            sendResponse({ status: "success" });
        }
    });

    const selectors = new Set([
        '.ytp-ad-module',
        '.ytp-ad-overlay',
        '.ytp-ad-skip-button',
        '.ytp-large-ad-preview',
        '.ytp-ad-progress',
        '.ytp-popup-ad',
        'ytd-promoted-sparkles-web-renderer',
        'ytd-display-ad-renderer',
        'ytd-promoted-video-renderer',
        '[data-ad-type]',
        '#main #advertisement',
        '.ytp-ce-element-show',
        '.ytp-ce-element',
        '.ytp-cards-button-icon-default',
        '.ytp-sponsorship-banner',
        '.ad-container',
        '.sponsored-content',
        '.video-sponsor'
    ]);

    // Create a style tag to hide ads directly using CSS
    const adBlockStyle = document.createElement('style');
    document.head.appendChild(adBlockStyle);

    selectors.forEach(selector => {
        adBlockStyle.appendChild(document.createTextNode(`${selector} { display: none !important; }\n`));
    });

    // Function to remove ads from the DOM efficiently
    const removeAds = (nodes) => {
        const adsToRemove = [];
        nodes.forEach(node => {
            if (node instanceof HTMLElement) {
                for (const selector of selectors) {
                    if (node.matches(selector)) {
                        adsToRemove.push(node);
                        break;
                    }
                }
            }
        });
        if (adsToRemove.length > 0) {
            adsToRemove.forEach(node => node.remove()); // batch remove to reduce reflow
        }
    };

    // Optimize the observer to focus only on specific nodes
    const observer = new MutationObserver(mutations => {
        const addedNodes = [];
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                addedNodes.push(...Array.from(mutation.addedNodes));
            }
        });
        if (addedNodes.length) {
            removeAds(addedNodes); // batch removal of ads added
        }
    });

    // Start observing only the body element
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial removal of existing ads
    removeAds(Array.from(document.querySelectorAll(Array.from(selectors).join(', '))));

    // Revised version of the XHR filter to minimize overhead
    const filterXHRResponses = () => {
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        const originalXhrSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url) {
            this._url = url; 
            return originalXhrOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
            const xhr = this;
            xhr.addEventListener('load', function() {
                // Only process relevant requests
                if (/youtube\.com\/(get_video_info|youtubei\/v1\/player)\?/.test(xhr._url)) {
                    try {
                        const responseJSON = JSON.parse(xhr.responseText);
                        // Clean up ads from responses
                        if (responseJSON.playbackContext) {
                            delete responseJSON.playbackContext.adPlacements;
                        }
                        if (responseJSON.streamingData) {
                            responseJSON.streamingData.adaptiveFormats = responseJSON.streamingData.adaptiveFormats.filter(format => !/^(?:audio|video)\//.test(format.mimeType));
                        }
                        xhr.responseText = JSON.stringify(responseJSON);
                    } catch (e) {
                        console.error("Error processing response:", e);
                    }
                }
            });
            return originalXhrSend.apply(this, arguments);
        };
    };

    // Initialize the XHR filtering
    filterXHRResponses();

    // Clean up on script removal (if needed)
    const cleanup = () => {
        observer.disconnect(); // Stop observing
        adBlockStyle.remove(); // Remove the ad blocking CSS
        uiDiv.remove(); // Clean up the UI
    };

    // Optionally, handle script cleanup when no longer needed
    window.addEventListener('unload', cleanup);
})();